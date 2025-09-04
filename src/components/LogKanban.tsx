import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { supabase } from '@/integrations/supabase/client';

interface BookCard {
  id: string;
  nomeDoLivro: string;
  isbn: string;
  notaFiscal?: string;
  dataNaGrafica?: Date;
  dataNaEditora?: Date;
  createdAt: Date;
  expectedQuantity?: number;
  arrivedQuantity?: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'devem-ser-enviados', title: 'Devem ser enviados', color: '#A5C9CA' },
  { id: 'na-grafica', title: 'Na gráfica', color: '#FFA62B' },
  { id: 'chegou-na-editora', title: 'Chegou na editora', color: '#DB6400' },
  { id: 'concluido', title: 'Concluído', color: '#16697A' },
];

const Container = styled(Box)`
  display: flex;
  justify-content: space-around;
  padding: 20px;
  font-family: 'Poppins', sans-serif;
`;

const HeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  margin-bottom: 10px;
`;

const ColumnContainer = styled(Box)<{ $backgroundColor: string }>`
  background-color: ${(props) => props.$backgroundColor};
  border-radius: 8px;
  padding: 10px;
  margin: 0 10px;
  width: 345px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  font-family: 'Poppins', sans-serif;
`;

const ColumnTitle = styled(Typography)`
  text-align: center;
  margin-bottom: 15px;
  font-family: 'Poppins', sans-serif;
  color: #ffffff;
`;

const ModalContent = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 400px;
  font-family: 'Poppins', sans-serif;
`;

const Clock: React.FC = () => {
  const [ctime, setTime] = useState<string>(new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Typography
      variant="h4"
      className="font-poppins text-gray-800"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {ctime}
    </Typography>
  );
};

const CustomCard: React.FC<{
  card: BookCard;
  index: number;
  onEdit: (card: BookCard) => void;
  onDelete: (cardId: string) => void;
}> = ({ card, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-gray-200 w-60 h-64 rounded-lg mb-4 mx-auto"
        >
          <div className="flex p-2 gap-1">
            <div>
              <span className="bg-teal-500 inline-block w-3 h-3 rounded-full" />
            </div>
            <div>
              <span className="bg-orange-500 inline-block w-3 h-3 rounded-full" />
            </div>
            <div>
              <span className="bg-indigo-500 inline-block w-3 h-3 rounded-full" />
            </div>
          </div>
          <div className="card__content p-2">
            <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
              <strong>{card.nomeDoLivro}</strong>
            </Typography>
            <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
              <strong>ISBN:</strong> {card.isbn}
            </Typography>
            {card.notaFiscal && (
              <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
                <strong>NF:</strong> {card.notaFiscal}
              </Typography>
            )}
            {card.expectedQuantity !== undefined && (
              <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
                <strong>Solicitado:</strong> {card.expectedQuantity}
              </Typography>
            )}
            {card.arrivedQuantity !== undefined && (
              <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
                <strong>Entregue:</strong> {card.arrivedQuantity}
              </Typography>
            )}
            {card.dataNaGrafica && (
              <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
                <strong>Na Gráfica:</strong> {card.dataNaGrafica.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </Typography>
            )}
            {card.dataNaEditora && (
              <Typography variant="body2" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}>
                <strong>Na Editora:</strong> {card.dataNaEditora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </Typography>
            )}
            <Button
              onClick={() => onEdit(card)}
              style={{ color: '#000000', fontFamily: 'Poppins, sans-serif' }}
            >
              Editar
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const LogKanban: React.FC = () => {
  const [boardData, setBoardData] = useState<{ [key: string]: BookCard[] }>({
    'devem-ser-enviados': [],
    'na-grafica': [],
    'chegou-na-editora': [],
    'concluido': [],
  });
  const [editingCard, setEditingCard] = useState<BookCard | null>(null);
  const [newCard, setNewCard] = useState<Partial<BookCard>>({ nomeDoLivro: '', isbn: '', notaFiscal: '', expectedQuantity: undefined });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('audioEnabled') === 'true';
  });
  const isProcessingRef = useRef<boolean>(false);

  // Initialize audio for notification
  const notificationSound = new Audio('/notification.mp3');

  const enableAudio = () => {
    notificationSound.play().then(() => {
      setAudioEnabled(true);
      localStorage.setItem('audioEnabled', 'true');
    }).catch((error) => console.error('Erro ao habilitar áudio:', error));
  };

  useEffect(() => {
    // Fetch initial data
    async function fetchData() {
      const { data, error } = await supabase
        .from('logistica')
        .select('*');

      if (error) {
        console.error('Erro ao buscar dados:', error);
        return;
      }

      const grouped: { [key: string]: BookCard[] } = {
        'devem-ser-enviados': [],
        'na-grafica': [],
        'chegou-na-editora': [],
        'concluido': [],
      };

      data.forEach((item) => {
        const card: BookCard = {
          id: item.id,
          nomeDoLivro: item.nome_do_livro,
          isbn: item.isbn,
          notaFiscal: item.nota_fiscal || undefined,
          expectedQuantity: item.quantidade_esperada || undefined,
          arrivedQuantity: item.quantidade_chegada || undefined,
          dataNaGrafica: item.data_na_grafica ? new Date(item.data_na_grafica) : undefined,
          dataNaEditora: item.data_na_editora ? new Date(item.data_na_editora) : undefined,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        };

        const status = item.status || 'devem-ser-enviados';
        if (grouped[status]) {
          grouped[status].push(card);
        } else {
          grouped['devem-ser-enviados'].push(card);
        }
      });

      setBoardData(grouped);
    }

    fetchData();

    // Set up Supabase real-time subscription
    const channel = supabase
      .channel('logistica-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logistica' }, (payload) => {
        setBoardData((prev) => {
          // Check if card already exists to prevent duplicates
          const cardExists = Object.values(prev).flat().some((card) => card.id === payload.new.id);
          if (cardExists) return prev;

          if (audioEnabled) {
            notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
          }
          const newCard: BookCard = {
            id: payload.new.id,
            nomeDoLivro: payload.new.nome_do_livro,
            isbn: payload.new.isbn,
            notaFiscal: payload.new.nota_fiscal || undefined,
            expectedQuantity: payload.new.quantidade_esperada || undefined,
            arrivedQuantity: payload.new.quantidade_chegada || undefined,
            dataNaGrafica: payload.new.data_na_grafica ? new Date(payload.new.data_na_grafica) : undefined,
            dataNaEditora: payload.new.data_na_editora ? new Date(payload.new.data_na_editora) : undefined,
            createdAt: payload.new.created_at ? new Date(payload.new.created_at) : new Date(),
          };
          return {
            ...prev,
            'devem-ser-enviados': [...prev['devem-ser-enviados'], newCard],
          };
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'logistica' }, (payload) => {
        setBoardData((prev) => {
          const newBoardData = { ...prev };
          let cardUpdated = false;
          for (const columnId in newBoardData) {
            const cardIndex = newBoardData[columnId].findIndex((c) => c.id === payload.new.id);
            if (cardIndex !== -1) {
              const updatedCard: BookCard = {
                id: payload.new.id,
                nomeDoLivro: payload.new.nome_do_livro,
                isbn: payload.new.isbn,
                notaFiscal: payload.new.nota_fiscal || undefined,
                expectedQuantity: payload.new.quantidade_esperada || undefined,
                arrivedQuantity: payload.new.quantidade_chegada || undefined,
                dataNaGrafica: payload.new.data_na_grafica ? new Date(payload.new.data_na_grafica) : undefined,
                dataNaEditora: payload.new.data_na_editora ? new Date(payload.new.data_na_editora) : undefined,
                createdAt: payload.new.created_at ? new Date(payload.new.created_at) : new Date(),
              };
              newBoardData[columnId][cardIndex] = updatedCard;
              cardUpdated = true;
              if (audioEnabled) {
                notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
              }
              break;
            }
          }
          return cardUpdated ? newBoardData : prev;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'logistica' }, (payload) => {
        setBoardData((prev) => {
          const newBoardData = { ...prev };
          for (const columnId in newBoardData) {
            newBoardData[columnId] = newBoardData[columnId].filter((card) => card.id !== payload.old.id);
          }
          if (audioEnabled) {
            notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
          }
          return newBoardData;
        });
      })
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [audioEnabled]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const column = Array.from(boardData[source.droppableId]);
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);

      setBoardData({
        ...boardData,
        [source.droppableId]: column,
      });
    } else {
      const sourceColumn = Array.from(boardData[source.droppableId]);
      const destColumn = Array.from(boardData[destination.droppableId]);
      const [movedCard] = sourceColumn.splice(source.index, 1);

      let updatedCard = { ...movedCard };

      if (destination.droppableId === 'na-grafica' && !updatedCard.dataNaGrafica) {
        updatedCard.dataNaGrafica = new Date();
      } else if (destination.droppableId === 'chegou-na-editora' && !updatedCard.dataNaEditora) {
        updatedCard.dataNaEditora = new Date();
      }

      updatedCard = { ...updatedCard };

      destColumn.splice(destination.index, 0, updatedCard);

      setBoardData({
        ...boardData,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn,
      });

      if (audioEnabled) {
        notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
      }

      const { error } = await supabase
        .from('logistica')
        .update({
          status: destination.droppableId,
          data_na_grafica: updatedCard.dataNaGrafica ? updatedCard.dataNaGrafica.toISOString() : null,
          data_na_editora: updatedCard.dataNaEditora ? updatedCard.dataNaEditora.toISOString() : null,
        })
        .eq('id', updatedCard.id);

      if (error) {
        console.error('Erro ao atualizar card:', error);
      }
    }
  };

  const handleEditCard = (card: BookCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const { error } = await supabase
      .from('logistica')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('Erro ao deletar card:', error);
      isProcessingRef.current = false;
      return;
    }

    if (audioEnabled) {
      notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
    }

    setBoardData((prev) => {
      const newBoardData = { ...prev };
      for (const columnId in newBoardData) {
        newBoardData[columnId] = newBoardData[columnId].filter((card) => card.id !== cardId);
      }
      return newBoardData;
    });

    setIsModalOpen(false);
    setEditingCard(null);
    isProcessingRef.current = false;
  };

  const handleSaveCard = async (updatedCard: BookCard) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const { error } = await supabase
      .from('logistica')
      .update({
        nome_do_livro: updatedCard.nomeDoLivro,
        isbn: updatedCard.isbn,
        nota_fiscal: updatedCard.notaFiscal || null,
        quantidade_esperada: updatedCard.expectedQuantity || null,
        quantidade_chegada: updatedCard.arrivedQuantity || null,
        data_na_grafica: updatedCard.dataNaGrafica ? updatedCard.dataNaGrafica.toISOString() : null,
        data_na_editora: updatedCard.dataNaEditora ? updatedCard.dataNaEditora.toISOString() : null,
      })
      .eq('id', updatedCard.id);

    if (error) {
      console.error('Erro ao atualizar card:', error);
      isProcessingRef.current = false;
      return;
    }

    if (audioEnabled) {
      notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
    }

    setBoardData((prev) => {
      const newBoardData = { ...prev };
      for (const columnId in newBoardData) {
        const cardIndex = newBoardData[columnId].findIndex((c) => c.id === updatedCard.id);
        if (cardIndex !== -1) {
          newBoardData[columnId][cardIndex] = updatedCard;
          break;
        }
      }
      return newBoardData;
    });

    setIsModalOpen(false);
    setEditingCard(null);
    isProcessingRef.current = false;
  };

  const handleCreateCard = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (newCard.nomeDoLivro && newCard.isbn) {
      const { data, error } = await supabase
        .from('logistica')
        .insert([
          {
            nome_do_livro: newCard.nomeDoLivro,
            isbn: newCard.isbn,
            nota_fiscal: newCard.notaFiscal || null,
            quantidade_esperada: newCard.expectedQuantity || null,
            status: 'devem-ser-enviados',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar card:', error);
        isProcessingRef.current = false;
        return;
      }

      if (audioEnabled) {
        notificationSound.play().catch((error) => console.error('Erro ao tocar som de notificação:', error));
      }

      const createdCard: BookCard = {
        id: data.id,
        nomeDoLivro: data.nome_do_livro,
        isbn: data.isbn,
        notaFiscal: data.nota_fiscal || undefined,
        expectedQuantity: data.quantidade_esperada || undefined,
        arrivedQuantity: data.quantidade_chegada || undefined,
        dataNaGrafica: data.data_na_grafica ? new Date(data.data_na_grafica) : undefined,
        dataNaEditora: data.data_na_editora ? new Date(data.data_na_editora) : undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      };

      setBoardData((prev) => {
        // Check if card already exists to prevent duplicates
        const cardExists = prev['devem-ser-enviados'].some((card) => card.id === createdCard.id);
        if (cardExists) return prev;
        return {
          ...prev,
          'devem-ser-enviados': [...prev['devem-ser-enviados'], createdCard],
        };
      });

      setIsCreateModalOpen(false);
      setNewCard({ nomeDoLivro: '', isbn: '', notaFiscal: '', expectedQuantity: undefined });
    }
    isProcessingRef.current = false;
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      <DragDropContext onDragEnd={onDragEnd}>
        <HeaderContainer>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setIsCreateModalOpen(true)}
              sx={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#000000ff', '&:hover': { backgroundColor: '#115293' } }}
            >
              Criar Card
            </Button>
            {!audioEnabled && (
              <Button
                variant="contained"
                onClick={enableAudio}
                sx={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
              >
                Habilitar Notificações de Áudio
              </Button>
            )}
          </Box>
          <Clock />
        </HeaderContainer>
        <Container>
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <ColumnContainer
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  $backgroundColor={column.color}
                >
                  <ColumnTitle variant="h6">
                    {column.title}
                  </ColumnTitle>
                  {boardData[column.id].map((card, index) => (
                    <CustomCard
                      key={card.id}
                      card={card}
                      index={index}
                      onEdit={handleEditCard}
                      onDelete={handleDeleteCard}
                    />
                  ))}
                  {provided.placeholder}
                </ColumnContainer>
              )}
            </Droppable>
          ))}
        </Container>

        {isModalOpen && editingCard && (
          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <ModalContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif' }}>
                Editar Card
              </Typography>
              <TextField
                label="Nome do Livro"
                value={editingCard.nomeDoLivro}
                onChange={(e) => setEditingCard({ ...editingCard, nomeDoLivro: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="ISBN"
                value={editingCard.isbn}
                onChange={(e) => setEditingCard({ ...editingCard, isbn: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="Nota Fiscal (opcional)"
                value={editingCard.notaFiscal || ''}
                onChange={(e) => setEditingCard({ ...editingCard, notaFiscal: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="Quantidade Esperada"
                type="number"
                value={editingCard.expectedQuantity ?? ''}
                onChange={(e) => setEditingCard({ ...editingCard, expectedQuantity: parseInt(e.target.value) || undefined })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="Quantidade Chegada"
                type="number"
                value={editingCard.arrivedQuantity ?? ''}
                onChange={(e) => setEditingCard({ ...editingCard, arrivedQuantity: parseInt(e.target.value) || undefined })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <Box sx={{ marginTop: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => editingCard && handleSaveCard(editingCard)}
                  sx={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Salvar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => editingCard && handleDeleteCard(editingCard.id)}
                  sx={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Deletar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsModalOpen(false)}
                  sx={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Cancelar
                </Button>
              </Box>
            </ModalContent>
          </Modal>
        )}

        {isCreateModalOpen && (
          <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
            <ModalContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif' }}>
                Criar Novo Card
              </Typography>
              <TextField
                label="Nome do Livro"
                value={newCard.nomeDoLivro}
                onChange={(e) => setNewCard({ ...newCard, nomeDoLivro: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="ISBN"
                value={newCard.isbn}
                onChange={(e) => setNewCard({ ...newCard, isbn: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="Nota Fiscal (opcional)"
                value={newCard.notaFiscal}
                onChange={(e) => setNewCard({ ...newCard, notaFiscal: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <TextField
                label="Quantidade Esperada"
                type="number"
                value={newCard.expectedQuantity ?? ''}
                onChange={(e) => setNewCard({ ...newCard, expectedQuantity: parseInt(e.target.value) || undefined })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              />
              <Box sx={{ marginTop: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateCard}
                  sx={{ marginRight: 1, fontFamily: 'Poppins, sans-serif' }}
                >
                  Criar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  sx={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Cancelar
                </Button>
              </Box>
            </ModalContent>
          </Modal>
        )}
      </DragDropContext>
    </>
  );
};

export default LogKanban;
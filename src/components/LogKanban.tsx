import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
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
  { id: 'devem-ser-enviados', title: 'Devem ser enviados', color: '#a5c8c9' }, // Trello-like soft gray
  { id: 'na-grafica', title: 'Na gráfica', color: '#ffa72b' }, // Light blue
  { id: 'chegou-na-editora', title: 'Chegou na editora', color: '#db6300' }, // Light yellow
  { id: 'concluido', title: 'Concluído', color: '#166a7a' }, // Light green
];

const Container = styled(Box)({
  display: 'flex',
  overflowX: 'auto',
  padding: '24px',
  backgroundColor: 'hsla(210, 20%, 98%, 0.00)', // Trello-like background
  minHeight: '100vh',
  fontFamily: "'Inter', sans-serif",
});

const HeaderContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  backgroundColor: '#ffb319', // header logistica
  color: '#fff',
  borderRadius: '8px 8px 0 0',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  marginBottom: '16px',
});

const ColumnContainer = styled(Box)<{ $backgroundColor: string }>(({ $backgroundColor }) => ({
  backgroundColor: $backgroundColor,
  borderRadius: '8px',
  padding: '12px',
  margin: '0 8px',
  width: '300px',
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
  },
}));

const ColumnTitle = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  color: '#000000ff', // Trello dark text
  padding: '8px',
  marginBottom: '8px',
});

const ModalContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  width: '400px',
  fontFamily: "'Inter', sans-serif",
});

const StyledCard = styled('div')({
  backgroundColor: '#fff',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  '&:hover': {
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)',
  },
});

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
      variant="h6"
      sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#fff' }}
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
        <StyledCard
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="card__content">
            <Typography variant="subtitle1" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#172b4d' }}>
              {card.nomeDoLivro}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
              <strong>ISBN:</strong> {card.isbn}
            </Typography>
            {card.notaFiscal && (
              <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
                <strong>NF:</strong> {card.notaFiscal}
              </Typography>
            )}
            {card.expectedQuantity !== undefined && (
              <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
                <strong>Solicitado:</strong> {card.expectedQuantity}
              </Typography>
            )}
            {card.arrivedQuantity !== undefined && (
              <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
                <strong>Entregue:</strong> {card.arrivedQuantity}
              </Typography>
            )}
            {card.dataNaGrafica && (
              <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
                <strong>Na Gráfica:</strong> {card.dataNaGrafica.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </Typography>
            )}
            {card.dataNaEditora && (
              <Typography variant="body2" sx={{ color: '#5e6c84', fontFamily: "'Inter', sans-serif" }}>
                <strong>Na Editora:</strong> {card.dataNaEditora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </Typography>
            )}
            <Button
              onClick={() => onEdit(card)}
              sx={{ color: '#b87a00ff', fontFamily: "'Inter', sans-serif", textTransform: 'none', fontWeight: 500 }}
            >
              Editar
            </Button>
          </div>
        </StyledCard>
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
  const [newCard, setNewCard] = useState<Partial<BookCard>>({ nomeDoLivro: '', isbn: '', notaFiscal: '', expectedQuantity: undefined, dataNaGrafica: undefined, dataNaEditora: undefined });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('audioEnabled') === 'true';
  });
  const isProcessingRef = useRef<boolean>(false);

  const notificationSound = new Audio('/notification.mp3');

  const enableAudio = () => {
    notificationSound.play().then(() => {
      setAudioEnabled(true);
      localStorage.setItem('audioEnabled', 'true');
    }).catch((error) => console.error('Erro ao habilitar áudio:', error));
  };

  useEffect(() => {
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

    const channel = supabase
      .channel('logistica-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logistica' }, (payload) => {
        setBoardData((prev) => {
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

      const updatedCard = { ...movedCard };

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
            data_na_grafica: newCard.dataNaGrafica ? newCard.dataNaGrafica.toISOString() : null,
            data_na_editora: newCard.dataNaEditora ? newCard.dataNaEditora.toISOString() : null,
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
        const cardExists = prev['devem-ser-enviados'].some((card) => card.id === createdCard.id);
        if (cardExists) return prev;
        return {
          ...prev,
          'devem-ser-enviados': [...prev['devem-ser-enviados'], createdCard],
        };
      });

      setIsCreateModalOpen(false);
      setNewCard({ nomeDoLivro: '', isbn: '', notaFiscal: '', expectedQuantity: undefined, dataNaGrafica: undefined, dataNaEditora: undefined });
    }
    isProcessingRef.current = false;
  };

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <DragDropContext onDragEnd={onDragEnd}>
        <HeaderContainer>
          <Typography variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            Log Literare
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setIsCreateModalOpen(true)}
              sx={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: '#000000ff',
                '&:hover': { backgroundColor: '#000000ff' },
                borderRadius: '6px',
                textTransform: 'none',
                padding: '6px 16px',
              }}
            >
              Criar entrega
            </Button>
            {!audioEnabled && (
              <Button
                variant="contained"
                onClick={enableAudio}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#008a73ff',
                  '&:hover': { backgroundColor: '#008a73ff' },
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Ativar Notificações
              </Button>
            )}
            <Clock />
          </Box>
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

        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          TransitionComponent={Grow}
        >
          <ModalContent>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#172b4d' }}>
              Editar entrega
            </Typography>
            <TextField
              label="Book Title"
              value={editingCard?.nomeDoLivro || ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, nomeDoLivro: e.target.value } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="ISBN"
              value={editingCard?.isbn || ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, isbn: e.target.value } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Nota fiscal (opcional)"
              value={editingCard?.notaFiscal || ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, notaFiscal: e.target.value } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Qtd Esperada"
              type="number"
              value={editingCard?.expectedQuantity ?? ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, expectedQuantity: parseInt(e.target.value) || undefined } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Qtd que chegou"
              type="number"
              value={editingCard?.arrivedQuantity ?? ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, arrivedQuantity: parseInt(e.target.value) || undefined } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Data que foi enviado para grafica"
              type="date"
              value={editingCard?.dataNaGrafica ? editingCard.dataNaGrafica.toISOString().split('T')[0] : ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, dataNaGrafica: e.target.value ? new Date(e.target.value) : undefined } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Chegou na editora"
              type="date"
              value={editingCard?.dataNaEditora ? editingCard.dataNaEditora.toISOString().split('T')[0] : ''}
              onChange={(e) => setEditingCard((prev) => prev ? { ...prev, dataNaEditora: e.target.value ? new Date(e.target.value) : undefined } : null)}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <Box sx={{ marginTop: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => editingCard && handleSaveCard(editingCard)}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#000000ff',
                  '&:hover': { backgroundColor: '#000000ff' },
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Salvar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => editingCard && handleDeleteCard(editingCard.id)}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#eb5a46',
                  '&:hover': { backgroundColor: '#d94430' },
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setIsModalOpen(false)}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  borderColor: '#091e4221',
                  color: '#030303ff',
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Cancelar
              </Button>
            </Box>
          </ModalContent>
        </Modal>

        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          TransitionComponent={Grow}
        >
          <ModalContent>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#172b4d' }}>
              Criar entrega
            </Typography>
            <TextField
              label="Nome do livro"
              value={newCard.nomeDoLivro}
              onChange={(e) => setNewCard({ ...newCard, nomeDoLivro: e.target.value })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="ISBN"
              value={newCard.isbn}
              onChange={(e) => setNewCard({ ...newCard, isbn: e.target.value })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Invoice Number (optional)"
              value={newCard.notaFiscal}
              onChange={(e) => setNewCard({ ...newCard, notaFiscal: e.target.value })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Expected Quantity"
              type="number"
              value={newCard.expectedQuantity ?? ''}
              onChange={(e) => setNewCard({ ...newCard, expectedQuantity: parseInt(e.target.value) || undefined })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Enviado para gráfica"
              type="date"
              value={newCard.dataNaGrafica ? newCard.dataNaGrafica.toISOString().split('T')[0] : ''}
              onChange={(e) => setNewCard({ ...newCard, dataNaGrafica: e.target.value ? new Date(e.target.value) : undefined })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <TextField
              label="Chegou na Editora"
              type="date"
              value={newCard.dataNaEditora ? newCard.dataNaEditora.toISOString().split('T')[0] : ''}
              onChange={(e) => setNewCard({ ...newCard, dataNaEditora: e.target.value ? new Date(e.target.value) : undefined })}
              fullWidth
              margin="normal"
              InputProps={{ style: { fontFamily: "'Inter', sans-serif" } }}
              InputLabelProps={{ style: { fontFamily: "'Inter', sans-serif", color: '#5e6c84' } }}
              className="border rounded-md"
            />
            <Box sx={{ marginTop: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateCard}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#000000ff',
                  '&:hover': { backgroundColor: '#000000ff' },
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Create
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  borderColor: '#091e4221',
                  color: '#172b4d',
                  borderRadius: '6px',
                  textTransform: 'none',
                  padding: '6px 16px',
                }}
              >
                Cancel
              </Button>
            </Box>
          </ModalContent>
        </Modal>
      </DragDropContext>
    </div>
  );
};

export default LogKanban;
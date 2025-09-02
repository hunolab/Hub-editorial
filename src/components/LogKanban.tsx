import * as React from 'react';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { supabase } from '@/types/supabase'; // ajuste o caminho conforme seu projeto

interface BookCard {
  id: string;
  nomeDoLivro: string;
  isbn: string;
  notaFiscal?: string;
  dataNaGrafica?: Date;
  dataNaEditora?: Date;
  createdAt: Date;
}

interface Column {
  id: string;
  title: string;
  color: string;
  textColor: string;
}

const columns: Column[] = [
  { id: 'devem-ser-enviados', title: 'Devem ser enviados', color: '#FFF5E4', textColor: '#000000' },
  { id: 'na-grafica', title: 'Na gráfica', color: '#C1D8C3', textColor: '#000000' },
  { id: 'chegou-na-editora', title: 'Chegou na editora', color: '#6A9C89', textColor: '#FFFFFF' },
  { id: 'concluido', title: 'Concluído', color: '#5CB338', textColor: '#FFFFFF' },
];

const Container = styled(Box)`
  display: flex;
  justify-content: space-around;
  padding: 20px;
  font-family: 'Poppins', sans-serif;
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
`;

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }: { theme: any; expand: boolean }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
}));

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

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

const LogKanban: React.FC = () => {
  const [boardData, setBoardData] = useState<{ [key: string]: BookCard[] }>({
    'devem-ser-enviados': [],
    'na-grafica': [],
    'chegou-na-editora': [],
    'concluido': [],
  });
  const [editingCard, setEditingCard] = useState<BookCard | null>(null);
  const [newCard, setNewCard] = useState<Partial<BookCard>>({ nomeDoLivro: '', isbn: '', notaFiscal: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  // Carregar dados do Supabase ao montar o componente
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
  }, []);

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

      // Atualizar no banco
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
        // Opcional: reverter estado local ou mostrar erro ao usuário
      }
    }
  };

  const handleEditCard = (card: BookCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (updatedCard: BookCard) => {
    const { error } = await supabase
      .from('logistica')
      .update({
        nome_do_livro: updatedCard.nomeDoLivro,
        isbn: updatedCard.isbn,
        nota_fiscal: updatedCard.notaFiscal || null,
        data_na_grafica: updatedCard.dataNaGrafica ? updatedCard.dataNaGrafica.toISOString() : null,
        data_na_editora: updatedCard.dataNaEditora ? updatedCard.dataNaEditora.toISOString() : null,
      })
      .eq('id', updatedCard.id);

    if (error) {
      console.error('Erro ao atualizar card:', error);
      return;
    }

    const newBoardData = { ...boardData };
    for (const columnId in newBoardData) {
      const cardIndex = newBoardData[columnId].findIndex(card => card.id === updatedCard.id);
      if (cardIndex !== -1) {
        newBoardData[columnId][cardIndex] = updatedCard;
        break;
      }
    }
    setBoardData(newBoardData);
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleCreateCard = async () => {
    if (newCard.nomeDoLivro && newCard.isbn) {
      const { data, error } = await supabase
        .from('logistica')
        .insert([
          {
            nome_do_livro: newCard.nomeDoLivro,
            isbn: newCard.isbn,
            nota_fiscal: newCard.notaFiscal || null,
            status: 'devem-ser-enviados',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar card:', error);
        return;
      }

      const createdCard: BookCard = {
        id: data.id,
        nomeDoLivro: data.nome_do_livro,
        isbn: data.isbn,
        notaFiscal: data.nota_fiscal || undefined,
        dataNaGrafica: data.data_na_grafica ? new Date(data.data_na_grafica) : undefined,
        dataNaEditora: data.data_na_editora ? new Date(data.data_na_editora) : undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      };

      setBoardData({
        ...boardData,
        'devem-ser-enviados': [...boardData['devem-ser-enviados'], createdCard],
      });

      setIsCreateModalOpen(false);
      setNewCard({ nomeDoLivro: '', isbn: '', notaFiscal: '' });
    }
  };

  const handleExpandClick = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      <DragDropContext onDragEnd={onDragEnd}>
        <Container>
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <ColumnContainer
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  $backgroundColor={column.color}
                >
                  <ColumnTitle style={{ color: column.textColor }} variant="h6">
                    {column.title}
                  </ColumnTitle>
                  {boardData[column.id].map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(providedDraggable) => (
                        <Card
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          sx={{ maxWidth: 345, marginBottom: 2, backgroundColor: column.color, color: column.textColor, fontFamily: 'Poppins, sans-serif' }}
                        >
                          <CardHeader
                            avatar={
                              <Avatar sx={{ bgcolor: '#1976d2', fontFamily: 'Poppins, sans-serif' }} aria-label="book">
                                {card.nomeDoLivro[0]}
                              </Avatar>
                            }
                            action={
                              <IconButton
                                aria-label="edit"
                                onClick={() => handleEditCard(card)}
                                sx={{ color: column.textColor }}
                              >
                                <EditIcon />
                              </IconButton>
                            }
                            title={card.nomeDoLivro}
                            subheader={card.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                            sx={{ fontFamily: 'Poppins, sans-serif' }}
                          />
                          <CardContent>
                            <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif' }}>
                              <strong>ISBN:</strong> {card.isbn}
                            </Typography>
                            {card.notaFiscal && (
                              <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif' }}>
                                <strong>NF:</strong> {card.notaFiscal}
                              </Typography>
                            )}
                          </CardContent>
                          <CardActions disableSpacing>
                            <ExpandMore
                              expand={expandedCards[card.id] || false}
                              onClick={() => handleExpandClick(card.id)}
                              aria-expanded={expandedCards[card.id] || false}
                              aria-label="show more"
                              sx={{ color: column.textColor }}
                            >
                              <ExpandMoreIcon />
                            </ExpandMore>
                          </CardActions>
                          <Collapse in={expandedCards[card.id] || false} timeout="auto" unmountOnExit>
                            <CardContent>
                              {card.dataNaGrafica && (
                                <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif' }}>
                                  <strong>Na Gráfica:</strong>{' '}
                                  {card.dataNaGrafica.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                </Typography>
                              )}
                              {card.dataNaEditora && (
                                <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif' }}>
                                  <strong>Na Editora:</strong>{' '}
                                  {card.dataNaEditora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                </Typography>
                              )}
                            </CardContent>
                          </Collapse>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {column.id === 'devem-ser-enviados' && (
                    <Button
                      variant="contained"
                      onClick={() => setIsCreateModalOpen(true)}
                      sx={{ marginTop: 2, fontFamily: 'Poppins, sans-serif' }}
                    >
                      Criar Card
                    </Button>
                  )}
                </ColumnContainer>
              )}
            </Droppable>
          ))}
        </Container>

        {isModalOpen && editingCard && (
          <Modal open={isModalOpen} onClose={handleCloseModal}>
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
              <Box sx={{ marginTop: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => editingCard && handleSaveCard(editingCard)}
                  sx={{ marginRight: 1, fontFamily: 'Poppins, sans-serif' }}
                >
                  Salvar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleCloseModal}
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

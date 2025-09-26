import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled, ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
import { supabase } from '@/integrations/supabase/client';

// Interface para o card de livro
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
  previsaoChegada?: Date;
}

// Interface para as colunas do Kanban
interface Column {
  id: string;
  title: string;
  color: string;
}

// Definição das colunas
const columns: Column[] = [
  { id: 'devem-ser-enviados', title: 'Devem ser enviados', color: '#D1D3D4' },
  { id: 'na-grafica', title: 'Na gráfica', color: '#D1D3D4' },
  { id: 'chegou-na-editora', title: 'Chegou na editora', color: '#D1D3D4' },
  { id: 'concluido', title: 'Concluído', color: '#D1D3D4' },
];

// Temas claro e escuro
const lightTheme = createTheme({
  palette: { mode: 'light', background: { default: 'transparent', paper: '#272729' }, text: { primary: '#272729' } },
});
const darkTheme = createTheme({
  palette: { mode: 'dark', background: { default: 'transparent', paper: '#272729' }, text: { primary: '#272729' } },
});

// Estilização do container principal
const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  padding: '24px',
  backgroundColor: 'transparent',
  minHeight: '100vh',
  fontFamily: "'Roboto', sans-serif",
}));

// Estilização do cabeçalho
const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  backgroundColor: 'transparent',
  color: '#272729',
  borderRadius: '8px 8px 0 0',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  marginBottom: '16px',
}));

// Estilização da coluna
const ColumnContainer = styled(Box)<{ $backgroundColor: string }>(({ $backgroundColor, theme }) => ({
  backgroundColor: $backgroundColor,
  borderRadius: '16px',
  padding: '16px',
  margin: '0 8px',
  width: '300px',
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
  '&.droppable-over': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

// Estilização do título da coluna
const ColumnTitle = styled(Typography)(({ theme }) => ({
  fontFamily: "'Roboto', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  color: '#272729',
  padding: '8px',
  marginBottom: '8px',
}));

// Estilização do modal
const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: theme.palette.background.paper,
  padding: '16px',
  borderRadius: '16px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  width: '100%',
  maxWidth: '360px',
  maxHeight: '80vh',
  overflowY: 'auto',
  fontFamily: "'Roboto', sans-serif",
  '@media (max-width: 400px)': {
    maxWidth: '90vw',
    padding: '12px',
  },
}));

// Componente de relógio
const Clock: React.FC = () => {
  const [ctime, setTime] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Typography
      variant="h6"
      sx={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, color: '#272729' }}
    >
      {ctime}
    </Typography>
  );
};

// Função para gerar uma cor fixa baseada no ID do card
const getFixedColor = (id: string): string => {
  const colors = ['#EF7722', '#0BA6DF', '#DC143C', '#16610E', '#9929EA'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Componente do card personalizado
const CustomCard: React.FC<{
  card: BookCard;
  index: number;
  onEdit: (card: BookCard) => void;
}> = ({ card, index, onEdit }) => {
  // Cor fixa do círculo baseada no ID do card
  const circleColor = getFixedColor(card.id);

  // Verifica se a entrega está próxima (10 dias ou menos)
  const isEntregaProxima = () => {
    if (!card.previsaoChegada) return false;
    const hoje = new Date();
    const diffDias = Math.ceil(
      (card.previsaoChegada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDias <= 10 && diffDias >= 0;
  };

  const status = isEntregaProxima() ? 'Entrega Próxima!' : 'Em andamento';

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="wrapper"
          style={{
            backgroundColor: '#121212',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '8px',
            boxShadow: snapshot.isDragging
              ? '0 8px 16px rgba(0, 0, 0, 0.2)'
              : '0 4px 8px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
            fontFamily: "'Roboto', sans-serif",
            maxWidth: '280px',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging ? 'rotate(2deg)' : provided.draggableProps.style?.transform,
          }}
        >
          {/* Círculo colorido no canto superior direito */}
          <div
            className="circle-bg"
            style={{
              height: '100px',
              width: '100px',
              backgroundColor: circleColor,
              borderRadius: '50%',
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              zIndex: 1,
              transition: 'transform 0.5s ease',
              transform: snapshot.isDragging ? 'scale(1.2)' : 'scale(1)',
            }}
          />
          <div className="overviewInfo" style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="backbutton" style={{ cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1.02698 11.9929L5.26242 16.2426L6.67902 14.8308L4.85766 13.0033L22.9731 13.0012L22.9728 11.0012L4.85309 11.0033L6.6886 9.17398L5.27677 7.75739L1.02698 11.9929Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <div className="editbutton">
                <Button
                  onClick={() => onEdit(card)}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    backgroundColor: '#ffb319',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    '&:hover': { backgroundColor: '#e6a017' },
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>

            <div className="productinfo" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="grouptext" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Produto</h3>
                <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>{card.nomeDoLivro}</p>
              </div>
              <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 4H20V20H4V4ZM6 6V18H18V6H6ZM8 8H16V10H8V8ZM8 12H16V14H8V12ZM8 16H12V18H8V16Z"
                    fill="#f5f5f5"
                  />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>ISBN</h3>
                  <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>{card.isbn}</p>
                </div>
              </div>
              {card.previsaoChegada && (
                <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
                      fill="#f5f5f5"
                    />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Previsão de Chegada</h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>
                      {card.previsaoChegada.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
              <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6ZM6 4H13L18 9V20H6V4ZM8 12H16V14H8V12ZM8 16H14V18H8V16Z"
                    fill="#f5f5f5"
                  />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>NF</h3>
                  <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>{card.notaFiscal || 'SEM NF'}</p>
                </div>
              </div>
              {card.expectedQuantity !== undefined && (
                <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M7 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3H17V2H15V3H9V2H7V3ZM5 5H7V7H9V5H15V7H17V5H19V19H5V5ZM7 9H17V11H7V9ZM7 13H17V15H7V13ZM7 17H13V19H7V17Z"
                      fill="#f5f5f5"
                    />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Solicitado</h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>{card.expectedQuantity}</p>
                  </div>
                </div>
              )}
              {card.arrivedQuantity !== undefined && (
                <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                      fill="#f5f5f5"
                    />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Entregue</h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>{card.arrivedQuantity}</p>
                  </div>
                </div>
              )}
              {card.dataNaGrafica && (
                <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
                      fill="#f5f5f5"
                    />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Na Gráfica</h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>
                      {card.dataNaGrafica.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
              {card.dataNaEditora && (
                <div className="grouptext" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
                      fill="#f5f5f5"
                    />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Na Editora</h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#f5f5f5' }}>
                      {card.dataNaEditora.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
              <div className="status" style={{ marginTop: '12px', textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    backgroundColor: isEntregaProxima() ? '#f44336' : 'rgba(255, 255, 255, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    animation: isEntregaProxima() ? 'blink 1.5s infinite' : 'none',
                  }}
                >
                  {status}
                </p>
                <style>{`
                  @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                  }
                `}</style>
              </div>
            </div>
          </div>
          <style>{`
            .wrapper:hover .circle-bg {
              transform: scale(10);
            }
          `}</style>
        </div>
      )}
    </Draggable>
  );
};

// Componente principal do Kanban
const LogKanban: React.FC = () => {
  // Estado para os dados do Kanban
  const [boardData, setBoardData] = useState<{ [key: string]: BookCard[] }>({
    'devem-ser-enviados': [],
    'na-grafica': [],
    'chegou-na-editora': [],
    'concluido': [],
  });
  const [editingCard, setEditingCard] = useState<BookCard | null>(null);
  const [newCard, setNewCard] = useState<Partial<BookCard>>({
    nomeDoLivro: '',
    isbn: '',
    notaFiscal: '',
    expectedQuantity: undefined,
    dataNaGrafica: undefined,
    dataNaEditora: undefined,
    previsaoChegada: undefined,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() =>
    localStorage.getItem('audioEnabled') === 'true'
  );
  const isProcessingRef = useRef<boolean>(false);
  const notificationSound = new Audio('/notification.mp3');

  // Função para habilitar notificações de áudio
  const enableAudio = () => {
    notificationSound
      .play()
      .then(() => {
        setAudioEnabled(true);
        localStorage.setItem('audioEnabled', 'true');
      })
      .catch((error) => console.error('Erro ao habilitar áudio:', error));
  };

  // Detecta o tema do sistema
  const [theme, setTheme] = useState(lightTheme);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? darkTheme : lightTheme);
    const handler = (e: MediaQueryListEvent) =>
      setTheme(e.matches ? darkTheme : lightTheme);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Carrega dados do Supabase e configura atualizações em tempo real
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('logistica').select('*');
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
          previsaoChegada: item.previsao_chegada ? new Date(item.previsao_chegada) : undefined,
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
            notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
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
            previsaoChegada: payload.new.previsao_chegada ? new Date(payload.new.previsao_chegada) : undefined,
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
                previsaoChegada: payload.new.previsao_chegada ? new Date(payload.new.previsao_chegada) : undefined,
                createdAt: payload.new.created_at ? new Date(payload.new.created_at) : new Date(),
              };
              newBoardData[columnId][cardIndex] = updatedCard;
              cardUpdated = true;
              if (audioEnabled) {
                notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
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
            notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
          }
          return newBoardData;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [audioEnabled]);

  // Função para lidar com o drag-and-drop
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const column = Array.from(boardData[source.droppableId]);
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setBoardData({ ...boardData, [source.droppableId]: column });
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
        notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
      }
      const { error } = await supabase
        .from('logistica')
        .update({ status: destination.droppableId })
        .eq('id', updatedCard.id);
      if (error) console.error('Erro ao atualizar card:', error);
    }
  };

  // Função para abrir o modal de edição
  const handleEditCard = (card: BookCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  // Função para deletar um card
  const handleDeleteCard = async (cardId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    const { error } = await supabase.from('logistica').delete().eq('id', cardId);
    if (error) {
      console.error('Erro ao deletar card:', error);
      isProcessingRef.current = false;
      return;
    }
    if (audioEnabled) {
      notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
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

  // Função para salvar alterações no card
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
        previsao_chegada: updatedCard.previsaoChegada ? updatedCard.previsaoChegada.toISOString().split('T')[0] : null,
      })
      .eq('id', updatedCard.id);
    if (error) {
      console.error('Erro ao atualizar card:', error);
      isProcessingRef.current = false;
      return;
    }
    if (audioEnabled) {
      notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
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

  // Função para criar um novo card
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
            previsao_chegada: newCard.previsaoChegada ? newCard.previsaoChegada.toISOString().split('T')[0] : null,
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
        notificationSound.play().catch((error) => console.error('Erro ao tocar som:', error));
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
        previsaoChegada: data.previsao_chegada ? new Date(data.previsao_chegada) : undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      };
      setBoardData((prev) => ({
        ...prev,
        'devem-ser-enviados': [...prev['devem-ser-enviados'], createdCard],
      }));
      setIsCreateModalOpen(false);
      setNewCard({
        nomeDoLivro: '',
        isbn: '',
        notaFiscal: '',
        expectedQuantity: undefined,
        dataNaGrafica: undefined,
        dataNaEditora: undefined,
        previsaoChegada: undefined,
      });
    }
    isProcessingRef.current = false;
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <DragDropContext onDragEnd={onDragEnd}>
          <HeaderContainer>
            <Typography
              variant="h5"
              sx={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, color: '#272729' }}
            >
              Logística
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                  fontFamily: "'Roboto', sans-serif",
                  textTransform: 'none',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  backgroundColor: '#ffb319',
                  '&:hover': { backgroundColor: '#e6a017' },
                }}
              >
                Criar entrega
              </Button>
              {!audioEnabled && (
                <Button
                  variant="contained"
                  onClick={enableAudio}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    backgroundColor: '#ffb319',
                    '&:hover': { backgroundColor: '#e6a017' },
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
                {(provided, snapshot) => (
                  <ColumnContainer
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    $backgroundColor={column.color}
                    className={snapshot.isDraggingOver ? 'droppable-over' : ''}
                  >
                    <ColumnTitle variant="h6">{column.title}</ColumnTitle>
                    {boardData[column.id].map((card, index) => (
                      <CustomCard
                        key={card.id}
                        card={card}
                        index={index}
                        onEdit={handleEditCard}
                      />
                    ))}
                    {provided.placeholder}
                  </ColumnContainer>
                )}
              </Droppable>
            ))}
          </Container>

          {/* Modal de edição */}
          <Modal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            TransitionComponent={Grow}
          >
            <ModalContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ 
                  fontFamily: "'Roboto', sans-serif", 
                  fontWeight: 600, 
                  color: '#ffffff',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Editar entrega
              </Typography>
              <TextField
                label="Nome do livro"
                value={editingCard?.nomeDoLivro || ''}
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev ? { ...prev, nomeDoLivro: e.target.value } : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="ISBN"
                value={editingCard?.isbn || ''}
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev ? { ...prev, isbn: e.target.value } : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Nota fiscal (opcional)"
                value={editingCard?.notaFiscal || ''}
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev ? { ...prev, notaFiscal: e.target.value } : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Quantidade Esperada"
                type="number"
                value={editingCard?.expectedQuantity ?? ''}
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev
                      ? {
                          ...prev,
                          expectedQuantity: isNaN(parseInt(e.target.value))
                            ? undefined
                            : parseInt(e.target.value),
                        }
                      : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Quantidade Chegada"
                type="number"
                value={editingCard?.arrivedQuantity ?? ''}
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev
                      ? {
                          ...prev,
                          arrivedQuantity: isNaN(parseInt(e.target.value))
                            ? undefined
                            : parseInt(e.target.value),
                        }
                      : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Enviado para gráfica"
                type="date"
                value={
                  editingCard?.dataNaGrafica
                    ? editingCard.dataNaGrafica.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev
                      ? {
                          ...prev,
                          dataNaGrafica: e.target.value ? new Date(e.target.value) : undefined,
                        }
                      : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Chegou na editora"
                type="date"
                value={
                  editingCard?.dataNaEditora
                    ? editingCard.dataNaEditora.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev
                      ? {
                          ...prev,
                          dataNaEditora: e.target.value ? new Date(e.target.value) : undefined,
                        }
                      : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Previsão de Chegada"
                type="date"
                value={
                  editingCard?.previsaoChegada
                    ? editingCard.previsaoChegada.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setEditingCard((prev) =>
                    prev
                      ? {
                          ...prev,
                          previsaoChegada: e.target.value ? new Date(e.target.value) : undefined,
                        }
                      : null
                  )
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <Box sx={{ marginTop: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => editingCard && handleSaveCard(editingCard)}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#ffb319',
                    padding: '6px 12px',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    '&:hover': { backgroundColor: '#e6a017' },
                  }}
                >
                  Salvar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => editingCard && handleDeleteCard(editingCard.id)}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  }}
                >
                  Deletar
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsModalOpen(false)}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </ModalContent>
          </Modal>

          {/* Modal de criação */}
          <Modal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            TransitionComponent={Grow}
          >
            <ModalContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ 
                  fontFamily: "'Roboto', sans-serif", 
                  fontWeight: 600, 
                  color: '#ffffff',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Criar entrega
              </Typography>
              <TextField
                label="Nome do livro"
                value={newCard.nomeDoLivro}
                onChange={(e) => setNewCard({ ...newCard, nomeDoLivro: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="ISBN"
                value={newCard.isbn}
                onChange={(e) => setNewCard({ ...newCard, isbn: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Nota fiscal (opcional)"
                value={newCard.notaFiscal}
                onChange={(e) => setNewCard({ ...newCard, notaFiscal: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Quantidade Esperada"
                type="number"
                value={newCard.expectedQuantity ?? ''}
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    expectedQuantity: isNaN(parseInt(e.target.value))
                      ? undefined
                      : parseInt(e.target.value),
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Quantidade Chegada"
                type="number"
                value={newCard.arrivedQuantity ?? ''}
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    arrivedQuantity: isNaN(parseInt(e.target.value))
                      ? undefined
                      : parseInt(e.target.value),
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Enviado para gráfica"
                type="date"
                value={newCard.dataNaGrafica ? newCard.dataNaGrafica.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    dataNaGrafica: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Chegou na editora"
                type="date"
                value={newCard.dataNaEditora ? newCard.dataNaEditora.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    dataNaEditora: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <TextField
                label="Previsão de Chegada"
                type="date"
                value={
                  newCard.previsaoChegada ? newCard.previsaoChegada.toISOString().split('T')[0] : ''
                }
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    previsaoChegada: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                fullWidth
                margin="normal"
                InputProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { fontFamily: "'Roboto', sans-serif", color: '#f5f5f5', fontSize: '0.9rem' } }}
              />
              <Box sx={{ marginTop: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleCreateCard}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#ffb319',
                    padding: '6px 12px',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    '&:hover': { backgroundColor: '#e6a017' },
                  }}
                >
                  Criar
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsCreateModalOpen(false)}
                  sx={{
                    fontFamily: "'Roboto', sans-serif",
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </ModalContent>
          </Modal>
        </DragDropContext>
      </div>
    </ThemeProvider>
  );
};

export default LogKanban;
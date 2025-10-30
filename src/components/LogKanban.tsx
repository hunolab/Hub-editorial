// src/components/LogKanban.tsx
import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Trash2, Plus, Package, Calendar, FileText, Truck, CheckCircle, 
  Search, Volume2, VolumeX, Clock, LogOut 
} from 'lucide-react';

interface BoardItem {
  id: string;
  nome_do_livro: string;
  isbn: string;
  nota_fiscal: string | null;
  data_na_grafica: string | null;
  data_na_editora: string | null;
  status: 'devem-ser-enviados' | 'enviados' | 'em-transito' | 'recebidos';
  created_at: string;
  quantidade_esperada: number | null;
  quantidade_chegada: number | null;
  previsao_chegada: string | null;
}

const statusMap = {
  'devem-ser-enviados': { label: 'A Enviar', color: 'bg-blue-100 text-blue-800', icon: Package },
  'enviados': { label: 'Enviados', color: 'bg-yellow-100 text-yellow-800', icon: Truck },
  'em-transito': { label: 'Em Trânsito', color: 'bg-orange-100 text-orange-800', icon: Truck },
  'recebidos': { label: 'Recebidos', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function LogKanban() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('audioEnabled') === 'true');
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const notificationSound = useRef(new Audio('/notification.mp3'));

  const [form, setForm] = useState({
    nome_do_livro: '',
    isbn: '',
    nota_fiscal: '',
    quantidade_esperada: '',
    quantidade_chegada: '',
    previsao_chegada: '',
  });

  // === RELÓGIO ===
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // === AUTENTICAÇÃO + REAL-TIME ===
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Login necessário', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      setUser(session.user);
      loadItems();
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    const channel = supabase
      .channel('logistica')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logistica' }, (payload) => {
        if (audioEnabled) notificationSound.current.play().catch(() => {});
        handleRealtime(payload);
      })
      .subscribe();

    return () => {
      listener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [audioEnabled]);

  const handleRealtime = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setItems(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
    } else if (payload.eventType === 'DELETE') {
      setItems(prev => prev.filter(i => i.id !== payload.old.id));
    }
  };

  // === BUSCA ===
  useEffect(() => {
    const filtered = items.filter(i =>
      i.nome_do_livro.toLowerCase().includes(search.toLowerCase()) ||
      i.isbn.includes(search)
    );
    setFilteredItems(filtered);
  }, [items, search]);

  // === CARREGAR ITENS ===
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('logistica')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar:', err);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // === CRIAR ITEM (100% FUNCIONAL!) ===
  const handleCreate = async () => {
    if (!form.nome_do_livro || !form.isbn) {
      toast({ title: 'Erro', description: 'Preencha livro e ISBN', variant: 'destructive' });
      return;
    }

    const payload = {
      nome_do_livro: form.nome_do_livro.trim(),
      isbn: form.isbn.trim(),
      nota_fiscal: form.nota_fiscal.trim() || null,
      quantidade_esperada: form.quantidade_esperada ? parseInt(form.quantidade_esperada) : null,
      quantidade_chegada: form.quantidade_chegada ? parseInt(form.quantidade_chegada) : null,
      previsao_chegada: form.previsao_chegada || null,
      status: 'devem-ser-enviados' as const,
    };

    try {
      setIsCreating(true);

      // ESSA É A LINHA MÁGICA
      const { data, error } = await supabase
        .from('logistica')
        .insert(payload)
        .select()
        .single(); // SEM .single() → Promise pendente!

      if (error) throw error;

      // Atualiza localmente
      if (data) {
        setItems(prev => [data, ...prev]);
      }

      toast({ title: 'Criado!', description: `${payload.nome_do_livro} adicionado.` });
      resetForm();
    } catch (err: any) {
      console.error('ERRO AO CRIAR:', err);
      toast({ title: 'Erro', description: err.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsCreating(false); // SEMPRE EXECUTA
    }
  };

  // === DRAG & DROP ===
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as BoardItem['status'];
    const updateData: any = { status: newStatus };
    if (newStatus === 'enviados') updateData.data_na_grafica = new Date().toISOString();
    if (newStatus === 'recebidos') updateData.data_na_editora = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('logistica')
        .update(updateData)
        .eq('id', draggableId);
      if (error) throw error;
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setForm({
      nome_do_livro: '',
      isbn: '',
      nota_fiscal: '',
      quantidade_esperada: '',
      quantidade_chegada: '',
      previsao_chegada: '',
    });
  };

  // === UI ===
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Package className="h-6 w-6 animate-spin inline-block mr-2" />
        Carregando entregas...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Board de Logística</h2>
          <p className="text-muted-foreground">Entregas logistica</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user && (
            <div className="text-sm flex items-center gap-1">
              {user.email}
              <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button size="icon" variant="ghost" onClick={() => {
            const e = !audioEnabled;
            setAudioEnabled(e);
            localStorage.setItem('audioEnabled', String(e));
          }}>
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <div className="text-sm flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {currentTime}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por livro ou ISBN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrega
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(statusMap).map(([key, col]) => {
            const columnItems = filteredItems.filter(i => i.status === key);
            const Icon = col.icon;
            return (
              <div key={key} className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {col.label}
                  </span>
                  <Badge variant="secondary">{columnItems.length}</Badge>
                </h3>
                <Droppable droppableId={key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-96"
                    >
                      {columnItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing transition-all ${
                                snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                              }`}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-sm font-medium line-clamp-1">
                                    {item.nome_do_livro}
                                  </CardTitle>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteId(item.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>ISBN: {item.isbn}</span>
                                </div>
                                {(item.quantidade_esperada || item.quantidade_chegada) && (
                                  <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>{item.quantidade_esperada || 0} → {item.quantidade_chegada || 0}</span>
                                  </div>
                                )}
                                {item.previsao_chegada && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(item.previsao_chegada), 'dd/MM')}</span>
                                  </div>
                                )}
                                {item.nota_fiscal && (
                                  <div className="text-xs">NF: {item.nota_fiscal}</div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de Criação */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Entrega</DialogTitle>
            <DialogDescription>Preencha os dados da entrega</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Livro *</Label>
              <Input
                value={form.nome_do_livro}
                onChange={e => setForm({ ...form, nome_do_livro: e.target.value })}
                placeholder="Ex: O Senhor dos Anéis"
              />
            </div>
            <div className="space-y-2">
              <Label>ISBN *</Label>
              <Input
                value={form.isbn}
                onChange={e => setForm({ ...form, isbn: e.target.value })}
                placeholder="978-85-508-1234-5"
              />
            </div>
            <div className="space-y-2">
              <Label>Nota Fiscal</Label>
              <Input
                value={form.nota_fiscal}
                onChange={e => setForm({ ...form, nota_fiscal: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Qtd Esperada</Label>
                <Input
                  type="number"
                  value={form.quantidade_esperada}
                  onChange={e => setForm({ ...form, quantidade_esperada: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label>Qtd Chegada</Label>
                <Input
                  type="number"
                  value={form.quantidade_chegada}
                  onChange={e => setForm({ ...form, quantidade_chegada: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Previsão de Chegada</Label>
              <Input
                type="date"
                value={form.previsao_chegada}
                onChange={e => setForm({ ...form, previsao_chegada: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                const { error } = await supabase.from('logistica').delete().eq('id', deleteId);
                if (error) {
                  toast({ title: 'Erro', description: error.message, variant: 'destructive' });
                } else {
                  setItems(prev => prev.filter(i => i.id !== deleteId));
                }
                setDeleteId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
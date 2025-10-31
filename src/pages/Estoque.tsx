// src/pages/Estoque.tsx
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

interface EstoqueItem {
  id: string;
  isbn: string;
  titulo: string;
  gaveta: string;
  quantidade: number;
  ultima_atualizacao: string;
}

export default function Estoque() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    isbn: '',
    titulo: '',
    gaveta: '',
    quantidade: '',
  });
  const [busca, setBusca] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState<EstoqueItem | null>(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  const [quantidadeRetirar, setQuantidadeRetirar] = useState('');

  const { toast } = useToast();

  // === VERIFICA SESSÃO ===
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Acesso negado',
          description: 'Faça login para acessar o estoque.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      fetchEstoque();
    };
    checkSession();
  }, []);

  // === BUSCAR ESTOQUE ===
  async function fetchEstoque() {
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('ultima_atualizacao', { ascending: false });

      if (error) throw error;
      setItens(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar estoque:', err);
      toast({
        title: 'Erro ao carregar',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // === ADICIONAR / ATUALIZAR ===
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isbn = form.isbn.trim();
    const titulo = form.titulo.trim();
    const gaveta = form.gaveta.trim();
    const qtd = parseInt(form.quantidade);

    if (!isbn || !titulo || !gaveta || isNaN(qtd) || qtd <= 0) {
      toast({ title: 'Erro', description: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from('estoque')
        .select('id, quantidade')
        .eq('isbn', isbn)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') throw selectError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('estoque')
          .update({
            quantidade: existing.quantidade + qtd,
            ultima_atualizacao: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        toast({ title: 'Sucesso', description: `+${qtd} unidade(s) adicionada(s)` });
      } else {
        const { error: insertError } = await supabase
          .from('estoque')
          .insert({
            isbn,
            titulo,
            gaveta,
            quantidade: qtd,
          });

        if (insertError) throw insertError;

        toast({ title: 'Sucesso', description: 'Livro adicionado ao estoque' });
      }

      setForm({ isbn: '', titulo: '', gaveta: '', quantidade: '' });
      fetchEstoque();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      });
    }
  }

  // === ABRIR MODAL ===
  const abrirModal = (item: EstoqueItem) => {
    setLivroSelecionado(item);
    setQuantidadeAdicionar('');
    setQuantidadeRetirar('');
    setModalOpen(true);
  };

  // === ADICIONAR NO MODAL ===
  const handleAdicionar = async () => {
    if (!livroSelecionado) return;
    const qtd = parseInt(quantidadeAdicionar);
    if (isNaN(qtd) || qtd <= 0) {
      toast({ title: 'Erro', description: 'Digite uma quantidade válida', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('estoque')
        .update({
          quantidade: livroSelecionado.quantidade + qtd,
          ultima_atualizacao: new Date().toISOString(),
        })
        .eq('id', livroSelecionado.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: `+${qtd} unidade(s) adicionada(s)` });
      fetchEstoque();
      setModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // === RETIRAR NO MODAL ===
  const handleRetirar = async () => {
    if (!livroSelecionado) return;
    const qtd = parseInt(quantidadeRetirar);
    if (isNaN(qtd) || qtd <= 0) {
      toast({ title: 'Erro', description: 'Digite uma quantidade válida', variant: 'destructive' });
      return;
    }
    if (qtd > livroSelecionado.quantidade) {
      toast({ title: 'Erro', description: 'Quantidade maior que o estoque', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('estoque')
        .update({
          quantidade: livroSelecionado.quantidade - qtd,
          ultima_atualizacao: new Date().toISOString(),
        })
        .eq('id', livroSelecionado.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: `-${qtd} unidade(s) retirada(s)` });
      fetchEstoque();
      setModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // === FILTRO LOCAL ===
  const itensFiltrados = itens.filter((item) => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    return (
      item.isbn.toLowerCase().includes(termo) ||
      item.titulo.toLowerCase().includes(termo)
    );
  });

  // === VERIFICA ISBN EXATO ===
  const isIsbnExatoMatch = (busca: string, isbn: string): boolean => {
    return busca.trim() === isbn;
  };

  return (
    <div className="space-y-6">
      {/* FORMULÁRIO */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar ao Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <Input
              placeholder="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              required
            />
            <Input
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
            <Input
              placeholder="Gaveta"
              value={form.gaveta}
              onChange={(e) => setForm({ ...form, gaveta: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="Qtd"
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              min="1"
              required
            />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      {/* LISTAGEM E FILTRO */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Estoque Atual ({itens.length} títulos)</CardTitle>
          <Input
            placeholder="Buscar por ISBN ou Título..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : itensFiltrados.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum item encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Gaveta</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensFiltrados.map((item) => {
                    const isHighlighted = isIsbnExatoMatch(busca, item.isbn);

                    return (
                      <TableRow
                        key={item.id}
                        className={`
                          cursor-pointer transition-colors
                          ${isHighlighted
                            ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500'
                            : 'hover:bg-muted/50'
                          }
                        `}
                        onClick={() => abrirModal(item)}
                      >
                        <TableCell className="font-mono text-xs">{item.isbn}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.titulo}</TableCell>
                        <TableCell>{item.gaveta}</TableCell>
                        <TableCell className="text-center font-bold">{item.quantidade}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(item.ultima_atualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL ELEGENTE */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{livroSelecionado?.titulo}</DialogTitle>
            <DialogDescription>
              Gerencie o estoque deste livro
            </DialogDescription>
          </DialogHeader>

          {livroSelecionado && (
            <div className="space-y-6 py-4">
              {/* INFORMAÇÕES */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">ISBN</Label>
                  <p className="font-mono text-foreground">{livroSelecionado.isbn}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gaveta</Label>
                  <p className="font-medium">{livroSelecionado.gaveta}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estoque Atual</Label>
                  <p className="text-2xl font-bold text-primary">{livroSelecionado.quantidade}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Última Atualização</Label>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(livroSelecionado.ultima_atualizacao), 'dd MMM yyyy, HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* ADICIONAR */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="adicionar">Adicionar ao estoque</Label>
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      <Input
                        id="adicionar"
                        type="number"
                        min="1"
                        placeholder="Quantidade"
                        value={quantidadeAdicionar}
                        onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAdicionar} className="bg-green-600 hover:bg-green-700">
                    Adicionar
                  </Button>
                </div>

                {/* RETIRAR */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="retirar">Retirar do estoque</Label>
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-red-600" />
                      <Input
                        id="retirar"
                        type="number"
                        min="1"
                        max={livroSelecionado.quantidade}
                        placeholder={`Máx: ${livroSelecionado.quantidade}`}
                        value={quantidadeRetirar}
                        onChange={(e) => setQuantidadeRetirar(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleRetirar}
                    variant="destructive"
                    disabled={!quantidadeRetirar || parseInt(quantidadeRetirar) > livroSelecionado.quantidade}
                  >
                    Retirar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
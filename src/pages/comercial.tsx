// src/pages/comercial.tsx
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Plus, Download, Edit3 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format as formatCurrency } from 'currency-formatter';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

interface Vendedora {
  id: string;
  nome: string;
  foto_url: string | null;
  meta_mensal: number; // R$ 30000
}

interface Venda {
  id: string;
  vendedora_id: string;
  tipo_venda: 'solo' | 'coautoria';
  valor: number;
  data_venda: string;
  cliente_nome: string;
}

interface AggregatedSales {
  vendedora_id: string;
  total_vendas: number;
  total_valor: number;
  solos: number;
  coautorias: number;
  valor_sol: number;
  valor_coaut: number;
}

// FIGURINHAS ALEATÓRIAS - pasta: public/adesivos/
const adesivos = [
  '/adesivos/1.png',
  '/adesivos/2.png',
  '/adesivos/3.png',
  '/adesivos/4.png',
  '/adesivos/1.png',
  '/adesivos/3.png',
];

export default function Comercial() {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [vendasAgregadas, setVendasAgregadas] = useState<AggregatedSales[]>([]);
  const [historico, setHistorico] = useState<Venda[]>([]);
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [vendedoraSelecionada, setVendedoraSelecionada] = useState<Vendedora | null>(null);
  const [showAddVenda, setShowAddVenda] = useState(false);
  const [editMeta, setEditMeta] = useState(false);
  const [metaInputK, setMetaInputK] = useState('');

  const [novaVenda, setNovaVenda] = useState({
    vendedora_id: '',
    tipo_venda: 'solo' as 'solo' | 'coautoria',
    valor: '',
    data_venda: new Date().toISOString(),
    cliente_nome: '',
  });

  const { toast } = useToast();

  // === Intervalo de datas ===
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start, end;

    if (dateRange?.from && dateRange?.to) {
      start = startOfDay(dateRange.from);
      end = endOfDay(dateRange.to);
    } else {
      switch (periodo) {
        case 'diario':
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case 'semanal':
          start = startOfWeek(now, { locale: ptBR });
          end = endOfWeek(now, { locale: ptBR });
          break;
        case 'mensal':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
      }
    }
    return { startDate: start, endDate: end };
  }, [periodo, dateRange]);

  // === Buscar vendedoras ===
  useEffect(() => {
    async function fetchVendedoras() {
      const { data, error } = await supabase
        .from('vendedoras')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        setVendedoras(data || []);
      }
    }
    fetchVendedoras();
  }, [toast]);

  // === Buscar vendas agregadas ===
  const fetchVendasAgregadas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendas')
      .select('vendedora_id, tipo_venda, valor')
      .gte('data_venda', startDate.toISOString())
      .lte('data_venda', endDate.toISOString());

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const agregados = vendedoras.map(v => {
      const vendas = data?.filter(venda => venda.vendedora_id === v.id) || [];
      const total = vendas.length;
      const solos = vendas.filter(v => v.tipo_venda === 'solo');
      const coautorias = vendas.filter(v => v.tipo_venda === 'coautoria');
      const valor_sol = solos.reduce((sum, venda) => sum + (venda.valor || 0), 0);
      const valor_coaut = coautorias.reduce((sum, venda) => sum + (venda.valor || 0), 0);
      const total_valor = valor_sol + valor_coaut;

      return {
        vendedora_id: v.id,
        total_vendas: total,
        total_valor,
        solos: solos.length,
        coautorias: coautorias.length,
        valor_sol,
        valor_coaut
      };
    });

    setVendasAgregadas(agregados);
    setLoading(false);
  };

  useEffect(() => {
    if (vendedoras.length > 0) fetchVendasAgregadas();
  }, [vendedoras, startDate, endDate]);

  // === Abrir modal com meta em K (R$) ===
  const abrirModal = async (vendedora: Vendedora) => {
    setVendedoraSelecionada(vendedora);
    setMetaInputK((vendedora.meta_mensal / 1000).toString());
    setEditMeta(false);
    setModalOpen(true);

    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('vendedora_id', vendedora.id)
      .gte('data_venda', startDate.toISOString())
      .lte('data_venda', endDate.toISOString())
      .order('data_venda', { ascending: false });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setHistorico(data || []);
    }
  };

  // === Salvar meta (30K → 30000) ===
  const handleSalvarMeta = async () => {
    const valorK = parseFloat(metaInputK);
    if (isNaN(valorK) || valorK <= 0) {
      toast({ title: 'Erro', description: 'Meta deve ser maior que 0', variant: 'destructive' });
      return;
    }

    const metaReal = valorK * 1000;

    try {
      const { error } = await supabase
        .from('vendedoras')
        .update({ meta_mensal: metaReal })
        .eq('id', vendedoraSelecionada?.id);

      if (error) throw error;

      setVendedoras(prev => prev.map(v => v.id === vendedoraSelecionada?.id ? { ...v, meta_mensal: metaReal } : v));
      setEditMeta(false);
      toast({ title: 'Sucesso', description: `Meta atualizada para R$ ${valorK}K!` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // === Adicionar venda COM HORÁRIO DE BRASÍLIA ===
  const handleAdicionarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorStr = novaVenda.valor.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(valorStr);

    if (!novaVenda.vendedora_id || isNaN(valor) || valor <= 0 || !novaVenda.cliente_nome.trim()) {
      toast({ title: 'Erro', description: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }

    // === HORÁRIO DE BRASÍLIA (UTC-3) ===
    const dataBrasilia = new Date().toLocaleString('sv', { timeZone: 'America/Sao_Paulo' });
    const dataISO = dataBrasilia.replace(' ', 'T') + 'Z';

    try {
      const { error } = await supabase
        .from('vendas')
        .insert({
          vendedora_id: novaVenda.vendedora_id,
          tipo_venda: novaVenda.tipo_venda,
          valor,
          data_venda: dataISO, // HORÁRIO DE BRASÍLIA
          cliente_nome: novaVenda.cliente_nome.trim(),
        });

      if (error) throw error;

      toast({ title: 'Sucesso', description: `Venda de R$ ${formatCurrency(valor, { code: 'BRL' })} adicionada!` });
      setNovaVenda({ 
        vendedora_id: '', 
        tipo_venda: 'solo', 
        valor: '', 
        data_venda: new Date().toISOString(), 
        cliente_nome: '' 
      });
      setShowAddVenda(false);
      fetchVendasAgregadas();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // === Exportar CSV ===
  const exportarCSV = (vendedora: Vendedora) => {
    const vendas = vendasAgregadas.find(v => v.vendedora_id === vendedora.id);
    if (!vendas) return;

    const metaK = `R$ ${(vendedora.meta_mensal / 1000)}K`;

    const csv = [
      ['Vendedora', vendedora.nome],
      ['Período', `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`],
      [],
      ['Métrica', 'Quantidade', 'Valor'],
      ['Total Vendas', vendas.total_vendas, formatCurrency(vendas.total_valor, { code: 'BRL' })],
      ['Solos', vendas.solos, formatCurrency(vendas.valor_sol, { code: 'BRL' })],
      ['Coautorias', vendas.coautorias, formatCurrency(vendas.valor_coaut, { code: 'BRL' })],
      [],
      ['Meta Mensal (R$)', metaK, ''],
      ['Progresso', `${((vendas.total_valor / (periodo === 'mensal' ? vendedora.meta_mensal : vendedora.meta_mensal / 4)) * 100).toFixed(1)}%`, '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vendedora.nome.replace(/\s+/g, '_')}_metricas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // === Totais gerais ===
  const totais = useMemo(() => {
    return vendasAgregadas.reduce((acc, v) => ({
      total: acc.total + v.total_vendas,
      total_valor: acc.total_valor + v.total_valor,
      solos: acc.solos + v.solos,
      coautorias: acc.coautorias + v.coautorias,
      valor_sol: acc.valor_sol + v.valor_sol,
      valor_coaut: acc.valor_coaut + v.valor_coaut,
    }), { total: 0, total_valor: 0, solos: 0, coautorias: 0, valor_sol: 0, valor_coaut: 0 });
  }, [vendasAgregadas]);

  // === Progresso por VALOR (R$) ===
  const getProgresso = (vendedora: Vendedora) => {
    const vendas = vendasAgregadas.find(v => v.vendedora_id === vendedora.id);
    const valorTotal = vendas?.total_valor || 0;
    const meta = periodo === 'mensal' ? vendedora.meta_mensal : vendedora.meta_mensal / 4;
    const percent = meta > 0 ? Math.min((valorTotal / meta) * 100, 100) : 0;
    const bateu = valorTotal >= meta;
    return { valorTotal, percent, meta, bateu };
  };

  // === Formatar meta como R$ 30K ===
  const formatMetaK = (valor: number) => `R$ ${(valor / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Painel Comercial</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM')
                  )
                ) : (
                  <span>Período personalizado...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={() => setShowAddVenda(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Total de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              R$ {formatCurrency(totais.total_valor, { code: 'BRL' })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {totais.total} vendas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Solos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totais.solos}</p>
            <p className="text-sm text-green-600">R$ {formatCurrency(totais.valor_sol, { code: 'BRL' })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Coautorias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totais.coautorias}</p>
            <p className="text-sm text-blue-600">R$ {formatCurrency(totais.valor_coaut, { code: 'BRL' })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards das Vendedoras - ADESIVOS MAIS PARA DENTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vendedoras.map((vendedora) => {
          const { valorTotal, percent, meta, bateu } = getProgresso(vendedora);
          const vendas = vendasAgregadas.find(v => v.vendedora_id === vendedora.id);

          // FIGURINHA ALEATÓRIA
          const adesivoAleatorio = bateu
            ? adesivos[Math.floor(Math.random() * adesivos.length)]
            : null;

          return (
            <div key={vendedora.id} className="relative">
              {/* ADESIVO MAIS PARA DENTRO DO CARD */}
              {adesivoAleatorio && (
                <div className="absolute -top-3 right-3 z-20 pointer-events-none transform rotate-12 animate-bounce">
                  <img
                    src={adesivoAleatorio}
                    alt="Meta batida!"
                    className="w-20 h-20 drop-shadow-xl"
                    style={{
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                    }}
                  />
                </div>
              )}

              {/* CARD COM ESPAÇO NO TOPO */}
              <Card className="relative border-2 shadow-lg hover:shadow-xl transition-shadow pt-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={vendedora.foto_url || undefined} />
                      <AvatarFallback>{vendedora.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{vendedora.nome}</p>
                      <p className="text-2xl font-bold">{vendas?.total_vendas || 0}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {formatCurrency(valorTotal, { code: 'BRL' })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meta: {formatMetaK(meta)}</span>
                      <span className="font-medium">{percent.toFixed(0)}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1"
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModal(vendedora)}
                    >
                      Acessar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => exportarCSV(vendedora)}
                      title="Exportar CSV"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Modal com Edição de Meta */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {vendedoraSelecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={vendedoraSelecionada.foto_url || undefined} />
                      <AvatarFallback>{vendedoraSelecionada.nome[0]}</AvatarFallback>
                    </Avatar>
                    {vendedoraSelecionada.nome}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditMeta(!editMeta)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Meta Mensal (R$)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMeta ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={metaInputK}
                          onChange={(e) => setMetaInputK(e.target.value)}
                          className="w-24"
                          min="1"
                          placeholder="30"
                          step="1"
                        />
                        <span className="text-lg font-medium">K</span>
                        <Button size="sm" onClick={handleSalvarMeta}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditMeta(false)}>Cancelar</Button>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">{formatMetaK(vendedoraSelecionada.meta_mensal)}</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Vendas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{vendasAgregadas.find(v => v.vendedora_id === vendedoraSelecionada.id)?.total_vendas || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valor Vendido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {formatCurrency(getProgresso(vendedoraSelecionada).valorTotal, { code: 'BRL' })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Meta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatMetaK(getProgresso(vendedoraSelecionada).meta)}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">Solos: {vendasAgregadas.find(v => v.vendedora_id === vendedoraSelecionada.id)?.solos || 0}</Badge>
                  <Badge variant="outline">Coautorias: {vendasAgregadas.find(v => v.vendedora_id === vendedoraSelecionada.id)?.coautorias || 0}</Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Histórico de Vendas</h3>
                  {historico.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhuma venda no período</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historico.map((venda) => (
                          <TableRow key={venda.id}>
                            <TableCell className="text-xs">
                              {format(new Date(venda.data_venda), 'dd/MM HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={venda.tipo_venda === 'solo' ? 'default' : 'secondary'}>
                                {venda.tipo_venda}
                              </Badge>
                            </TableCell>
                            <TableCell>{venda.cliente_nome || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {formatCurrency(venda.valor || 0, { code: 'BRL' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setModalOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Venda */}
      <Dialog open={showAddVenda} onOpenChange={setShowAddVenda}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdicionarVenda} className="space-y-4">
            <div>
              <Label>Vendedora</Label>
              <Select value={novaVenda.vendedora_id} onValueChange={(v) => setNovaVenda({ ...novaVenda, vendedora_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {vendedoras.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={novaVenda.tipo_venda} onValueChange={(v) => setNovaVenda({ ...novaVenda, tipo_venda: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="coautoria">Coautoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor (R$)</Label>
              <Input
                placeholder="30.000,00"
                value={novaVenda.valor}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  value = value.replace(/(\d)(\d{2})$/, '$1,$2');
                  value = value.replace(/(?=(\d{3})+(\D))\B/g, '.');
                  setNovaVenda({ ...novaVenda, valor: value });
                }}
              />
            </div>

            <div>
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={novaVenda.data_venda.slice(0, 16)}
                onChange={(e) => setNovaVenda({ ...novaVenda, data_venda: e.target.value + ':00' })}
              />
            </div>

            <div>
              <Label>Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={novaVenda.cliente_nome}
                onChange={(e) => setNovaVenda({ ...novaVenda, cliente_nome: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">Registrar Venda</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
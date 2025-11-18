// src/pages/Dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Send,
  Calculator,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Plus,
  Upload,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UiverseLoader } from '@/components/UiverseLoader';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useEmblaCarousel from 'embla-carousel-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ptBR } from 'date-fns/locale';

interface Reference {
  formatted: string;
  fields: { [key: string]: string };
  type: string;
}

interface Submission {
  id: string;
  author_name: string;
  author_email: string;
  submission_type: 'solo' | 'coautoria';
  chapter_title: string | null;
  chapter_content: string;
  curriculum: string;
  summary: string;
  cover_text: string | null;
  photo_file_url: string | null;
  book_coordinator: string | null;
  status: 'novo' | 'recebido' | 'em_analise' | 'solicitar_ajustes' | 'concluido';
  comments: string[];
  created_at: string;
  references: Reference[] | null;
  book_id: string | null;
}

interface Book {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: string;
  user_id?: string;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newComment, setNewComment] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [openCreateBook, setOpenCreateBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookCover, setNewBookCover] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });

  // ==================== LIVROS ====================
  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('id, name, cover_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar livros:', error);
      toast.destructive({ title: 'Erro', description: 'Falha ao carregar livros.' });
    } else {
      setBooks(data || []);
    }
  };

  const createBook = async () => {
    if (!newBookName.trim()) {
      toast.destructive({ title: 'Erro', description: 'Nome do livro é obrigatório.' });
      return;
    }

    try {
      let coverUrl: string | null = null;
      if (newBookCover) {
        setUploadingCover(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const fileExt = newBookCover.name.split('.').pop()?.toLowerCase() || 'jpg';
        const randomId = Math.random().toString(36).substring(2, 10);
        const fileName = `${user.id}/${Date.now()}-${randomId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(fileName, newBookCover, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName);

        coverUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('books')
        .insert({ name: newBookName.trim(), cover_url: coverUrl })
        .select()
        .single();

      if (error) throw error;

      setBooks((prev) => [data, ...prev]);
      toast({ title: 'Livro criado com sucesso!', description: data.name });

      setOpenCreateBook(false);
      setNewBookName('');
      setNewBookCover(null);
    } catch (err: any) {
      toast.destructive({ title: 'Erro', description: err.message || 'Falha ao criar o livro.' });
    } finally {
      setUploadingCover(false);
    }
  };

  const deleteBook = async (bookId: string) => {
    setIsDeleting(true);
    try {
      await supabase.from('chapter_submissions').update({ book_id: null }).eq('book_id', bookId);
      const { error } = await supabase.from('books').delete().eq('id', bookId);
      if (error) throw error;

      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      if (selectedBookId === bookId) {
        setSelectedBookId(null);
        fetchSubmissions();
      }
      toast({ title: 'Livro excluído com sucesso' });
    } catch (err: any) {
      toast.destructive({ title: 'Erro', description: err.message || 'Falha ao excluir' });
    } finally {
      setIsDeleting(false);
      setBookToDelete(null);
    }
  };

  // ==================== SUBMISSÕES ====================
  const fetchSubmissions = async (bookId: string | null = null) => {
    try {
      setIsLoading(true);
      setError(null);
      let query = supabase
        .from('chapter_submissions')
        .select(`
          id, author_name, author_email, submission_type, chapter_title,
          chapter_content, curriculum, summary, cover_text, photo_file_url,
          book_coordinator, status, comments, created_at, references, book_id
        `)
        .order('created_at', { ascending: false });

      if (bookId) query = query.eq('book_id', bookId);

      const { data, error } = await query;
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      setError('Falha ao carregar submissões.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    fetchSubmissions(selectedBookId || null);
  }, [selectedBookId]);

  // ==================== STATUS ====================
  const updateStatus = async (submissionId: string, newStatus: Submission['status']) => {
    try {
      const { error } = await supabase
        .from('chapter_submissions')
        .update({ status: newStatus })
        .eq('id', submissionId);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: newStatus } : s))
      );
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast({ title: 'Status atualizado!', description: 'Capítulo movido com sucesso.' });
    } catch (err) {
      toast.destructive({ title: 'Erro', description: 'Não foi possível alterar o status.' });
    }
  };

  // ==================== BADGE DE STATUS ====================
  const getStatusBadge = (status: Submission['status']) => {
    const config = {
      novo: { label: 'Novo', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      recebido: { label: 'Em Revisão', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      em_analise: { label: 'Em Análise', className: 'bg-amber-100 text-amber-800 border-amber-300' },
      solicitar_ajustes: { label: 'Ajustes Solicitados', className: 'bg-orange-200 text-orange-900 border-orange-400 font-medium' },
      concluido: { label: 'Aprovado', className: 'bg-green-100 text-green-800 border-green-300 font-medium' },
    }[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
      <Badge variant="outline" className={`px-3 py-1 text-xs font-medium ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // ==================== OUTRAS FUNÇÕES ====================
  const handleView = (submission: Submission) => {
    setSelectedSubmission(submission);
    setNewComment('');
  };

  const downloadDocx = async (submission: Submission) => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: submission.chapter_title || "Capítulo sem título", heading: HeadingLevel.HEADING_1, spacing: { after: 240 } }),
            new Paragraph({ children: [new TextRun({ text: `Por: ${submission.author_name}`, italics: true, size: 24 })], spacing: { after: 240 } }),
            ...submission.chapter_content.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 200 } })),
            new Paragraph({ text: "Resumo", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 240 } }),
            ...submission.summary.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 200 } })),
            ...(submission.references && submission.references.length > 0 ? [
              new Paragraph({ text: "Referências", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 240 } }),
              ...submission.references.map(ref => new Paragraph({ children: [new TextRun({ text: ref.formatted, size: 24 })], spacing: { after: 200 } }))
            ] : []),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${submission.chapter_title || 'capitulo'}-${submission.author_name}.docx`);
      toast({ title: "Download iniciado", description: "DOCX gerado com sucesso." });
    } catch (error) {
      toast.destructive({ title: "Erro", description: "Falha ao gerar DOCX." });
    }
  };

  const addComment = async () => {
    if (!selectedSubmission || !newComment.trim()) return;
    try {
      const updatedComments = [...selectedSubmission.comments, newComment];
      const { error } = await supabase
        .from('chapter_submissions')
        .update({ comments: updatedComments })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, comments: updatedComments } : s));
      setSelectedSubmission({ ...selectedSubmission, comments: updatedComments });
      setNewComment('');
      toast({ title: "Comentário adicionado" });
    } catch (error) {
      toast.destructive({ title: "Erro", description: "Falha ao salvar comentário." });
    }
  };

  const handleDeleteSubmission = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('chapter_submissions').delete().eq('id', deleteId);
      if (error) throw error;
      setSubmissions(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Submissão excluída" });
    } catch (error) {
      toast.destructive({ title: "Erro", description: "Falha ao excluir." });
    } finally {
      setIsDeleting(false);
    }
  };

  // ==================== ESTATÍSTICAS ====================
  const total = submissions.length;
  const aprovadas = submissions.filter(s => s.status === 'concluido').length;
  const emRevisao = total - aprovadas;
  const metaSubmissoes = 50;
  const metaAprovacoes = 40;
  const progressoSubmissoes = Math.min((total / metaSubmissoes) * 100, 100);
  const progressoAprovacoes = Math.min((aprovadas / metaAprovacoes) * 100, 100);
  const recentSubmissions = submissions.slice(0, 10);

  const stats = [
    { label: 'Submissões Totais', value: total.toString(), icon: BookOpen, color: 'text-blue-600' },
    { label: 'Em Revisão', value: emRevisao.toString(), icon: Clock, color: 'text-orange-600' },
    { label: 'Aprovadas', value: aprovadas.toString(), icon: CheckCircle, color: 'text-green-600' },
    { label: 'Livros Ativos', value: books.length.toString(), icon: FileText, color: 'text-purple-600' },
  ];

  if (isLoading) return <UiverseLoader />;
  if (error) return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editorial</h1>
            <p className="text-muted-foreground">Gerenciador de Capítulos</p>
          </div>

          <div className="flex gap-3">
            <Dialog open={openCreateBook} onOpenChange={setOpenCreateBook}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Livro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Livro</DialogTitle>
                  <DialogDescription>Preencha os dados do novo livro</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Livro</Label>
                    <Input placeholder="Ex: Direito Penal em Foco 2026" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capa (opcional)</Label>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingCover}>
                        <Upload className="h-4 w-4 mr-2" />
                        {newBookCover ? 'Trocar capa' : 'Escolher imagem'}
                      </Button>
                      {newBookCover && (
                        <>
                          <span className="text-sm text-muted-foreground truncate max-w-40">{newBookCover.name}</span>
                          <Button size="icon" variant="ghost" onClick={() => setNewBookCover(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setNewBookCover(e.target.files[0])} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenCreateBook(false)}>Cancelar</Button>
                  <Button onClick={createBook} disabled={!newBookName.trim() || uploadingCover}>
                    {uploadingCover ? 'Criando...' : 'Criar Livro'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/submit">
                <Send className="h-5 w-5 mr-2" />
                Nova Submissão
              </Link>
            </Button>
          </div>
        </div>

        {/* CARROSSEL DE LIVROS */}
        {books.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Meus Livros</CardTitle>
              <CardDescription>
                {selectedBookId ? `Filtrando: ${books.find(b => b.id === selectedBookId)?.name}` : 'Todos os capítulos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                  <div onClick={() => setSelectedBookId(null)} className={`flex-shrink-0 w-48 cursor-pointer transition-all rounded-lg overflow-hidden border-2 ${selectedBookId === null ? 'border-primary shadow-xl scale-105' : 'border-transparent hover:border-primary/30'}`}>
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-64 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-gray-500" />
                    </div>
                    <div className="p-4 bg-card border-t">
                      <h3 className="font-bold text-lg">Todos os Livros</h3>
                      <p className="text-sm text-muted-foreground">{submissions.length} capítulos</p>
                    </div>
                  </div>

                  {books.map((book) => {
                    const chapterCount = submissions.filter(s => s.book_id === book.id).length;
                    return (
                      <div key={book.id} onClick={() => setSelectedBookId(selectedBookId === book.id ? null : book.id)}
                        className={`flex-shrink-0 w-48 cursor-pointer transition-all rounded-lg overflow-hidden border-2 ${selectedBookId === book.id ? 'border-primary shadow-xl scale-105' : 'border-transparent hover:border-primary/30'}`}>
                        <div className="relative group">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.name} className="w-full h-64 object-cover" />
                          ) : (
                            <div className="bg-gradient-to-br from-indigo-200 to-purple-300 h-64 flex items-center justify-center">
                              <BookOpen className="h-16 w-16 text-white/80" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                            <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); setBookToDelete(book.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-card border-t">
                          <h3 className="font-bold text-lg truncate">{book.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TABELA */}
        <Card>
          <CardHeader>
            <CardTitle>Capítulos Recentes</CardTitle>
            <CardDescription>Últimas submissões {selectedBookId ? 'do livro selecionado' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{s.chapter_title || 'Sem título'}</TableCell>
                      <TableCell>{s.author_name}</TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(s.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleView(s)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadDocx(s)}><Download className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {selectedBookId ? 'Nenhuma submissão neste livro ainda.' : 'Nenhuma submissão.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* PROGRESSO E AÇÕES RÁPIDAS */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Progresso Mensal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm"><span>Submissões</span><span>{total} / {metaSubmissoes}</span></div>
                <Progress value={progressoSubmissoes} className="mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm"><span>Aprovações</span><span>{aprovadas} / {metaAprovacoes}</span></div>
                <Progress value={progressoAprovacoes} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start"><Link to="/dashboard/calculadora"><Calculator className="h-4 w-4 mr-2" />Calculadora</Link></Button>
              <Button asChild variant="outline" className="w-full justify-start"><Link to="/dashboard/referencia"><FileText className="h-4 w-4 mr-2" />Referências</Link></Button>
              <Button asChild variant="outline" className="w-full justify-start"><Link to="/dashboard/logistica"><TrendingUp className="h-4 w-4 mr-2" />Entregas</Link></Button>
            </CardContent>
          </Card>
        </div>

        {/* MODAL DE DETALHES COM ALTERAÇÃO DE STATUS */}
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
            {!selectedSubmission ? (
              <div className="p-12 text-center">Carregando...</div>
            ) : (
              <>
                <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      {selectedSubmission.chapter_title || 'Sem título'}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      por <span className="font-semibold">{selectedSubmission.author_name}</span> •{' '}
                      {format(new Date(selectedSubmission.created_at), "'dia' dd 'de' MMMM 'de' yyyy', às' HH:mm", { locale: ptBR })}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">Status:</Label>
                    <Select value={selectedSubmission.status} onValueChange={(v) => updateStatus(selectedSubmission.id, v as Submission['status'])}>
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="recebido">Em Revisão</SelectItem>
                        <SelectItem value="solicitar_ajustes">Ajustes Solicitados</SelectItem>
                        <SelectItem value="concluido">Aprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setSelectedSubmission(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="px-6 pb-8 pt-6 space-y-8">
                  {/* ATRIBUIR A LIVRO */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-900 text-lg">Atribuir este capítulo a um livro</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {selectedSubmission.book_id
                            ? `Atual: "${books.find(b => b.id === selectedSubmission.book_id)?.name || 'Livro removido'}"`
                            : 'Não está em nenhum livro'}
                        </p>
                      </div>
                      <Select
                        value={selectedSubmission.book_id ?? 'none'}
                        onValueChange={async (value) => {
                          const newBookId = value === 'none' ? null : value;
                          const { error } = await supabase
                            .from('chapter_submissions')
                            .update({ book_id: newBookId })
                            .eq('id', selectedSubmission.id);
                          if (error) throw error;
                          setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, book_id: newBookId } : s));
                          setSelectedSubmission(prev => prev ? { ...prev, book_id: newBookId } : null);
                          fetchSubmissions(selectedBookId || null);
                          toast({ title: 'Sucesso!', description: 'Capítulo movido!' });
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-96">
                          <SelectValue placeholder="Selecionar livro..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum livro</SelectItem>
                          {books.map(book => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedSubmission.photo_file_url && (
                    <div>
                      <h3 className="font-semibold mb-3">Foto do autor</h3>
                      <img src={selectedSubmission.photo_file_url} alt="Foto" className="max-w-md rounded-lg shadow-lg" />
                    </div>
                  )}

                  {selectedSubmission.cover_text && (
                    <div>
                      <h3 className="font-semibold mb-3">Texto da capa (bio)</h3>
                      <div className="bg-muted/30 rounded-lg p-5 whitespace-pre-wrap text-sm">{selectedSubmission.cover_text}</div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Conteúdo completo do capítulo</h3>
                    <div className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-6 whitespace-pre-wrap">
                      {selectedSubmission.chapter_content || 'Conteúdo não disponível'}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Resumo</h3>
                    <div className="bg-muted/30 rounded-lg p-5 whitespace-pre-wrap">
                      {selectedSubmission.summary || 'Sem resumo'}
                    </div>
                  </div>

                  {selectedSubmission.curriculum && (
                    <div>
                      <h3 className="font-semibold mb-3">Currículo Lattes</h3>
                      <a href={selectedSubmission.curriculum} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {selectedSubmission.curriculum}
                      </a>
                    </div>
                  )}

                  {Array.isArray(selectedSubmission.references) && selectedSubmission.references.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Referências</h3>
                      <div className="space-y-3">
                        {selectedSubmission.references.map((ref: any, i: number) => (
                          <div key={i} className="bg-muted/30 rounded-lg p-4 text-sm">
                            {ref?.formatted || 'Referência vazia'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold mb-6">Comentários do editor</h3>
                    <div className="space-y-4 mb-8">
                      {Array.isArray(selectedSubmission.comments) && selectedSubmission.comments.length > 0 ? (
                        selectedSubmission.comments.map((c: string, i: number) => (
                          <div key={i} className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                            <p className="text-sm whitespace-pre-wrap">{c}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic">Nenhum comentário ainda.</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Textarea placeholder="Digite seu comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 min-h-32" />
                      <div className="flex flex-col gap-3">
                        <Button onClick={addComment} disabled={!newComment.trim()}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Enviar
                        </Button>
                        <Button variant="outline" onClick={() => downloadDocx(selectedSubmission)}>
                          <Download className="h-4 w-4 mr-2" /> DOCX
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ALERT DIALOGS */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Apagar Submissão?
              </AlertDialogTitle>
              <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSubmission} className="bg-red-600" disabled={isDeleting}>
                {isDeleting ? 'Apagando...' : 'Apagar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!bookToDelete} onOpenChange={() => setBookToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Excluir Livro?
              </AlertDialogTitle>
              <AlertDialogDescription>O livro será removido e todas as submissões perderão a referência.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => bookToDelete && deleteBook(bookToDelete)} className="bg-red-600" disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir Livro'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
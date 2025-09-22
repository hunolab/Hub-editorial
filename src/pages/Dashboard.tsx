import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Download, 
  Eye,
  User,
  Calendar,
  FileText,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import CalculadoraEditorial from '@/pages/Calculadora';
import { AnimatedThemeToggler } from "@/components/ui/magicui/animated-theme-toggler";
import LogKanban from '@/components/LogKanban';

gsap.registerPlugin(ScrollTrigger);

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
  updated_at: string;
}

const statusColors = {
  novo: 'bg-blue-100 text-blue-800',
  recebido: 'bg-yellow-100 text-yellow-800',
  em_analise: 'bg-purple-100 text-purple-800',
  solicitar_ajustes: 'bg-orange-100 text-orange-800',
  concluido: 'bg-green-100 text-green-800'
};

const statusLabels = {
  novo: 'Novo',
  recebido: 'Recebido',
  em_analise: 'Em Análise',
  solicitar_ajustes: 'Solicitar Ajustes',
  concluido: 'Concluído'
};

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home'); // Estado para controlar a aba ativa

  const navigate = useNavigate();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (tableRef.current && submissions.length > 0) {
      gsap.fromTo('.submission-row',
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          stagger: 0.1,
          scrollTrigger: {
            trigger: tableRef.current,
            start: 'top 80%'
          }
        }
      );
    }
  }, [submissions]);

  useEffect(() => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.author_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.chapter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        sub.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.book_coordinator?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUser(session.user);
  };

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('chapter_submissions')
        .select('id, author_name, author_email, submission_type, chapter_title, chapter_content, curriculum, summary, cover_text, photo_file_url, book_coordinator, status, comments, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar submissões",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chapter_submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, status: newStatus as any } : sub
        )
      );

      toast({
        title: "Status atualizado",
        description: "Status da submissão foi alterado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chapter_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(sub => sub.id !== id));

      toast({
        title: "Submissão excluída",
        description: "A submissão foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir submissão",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const addComment = async (id: string) => {
    if (!newComment.trim()) return;

    try {
      const submission = submissions.find(sub => sub.id === id);
      if (!submission) return;

      const updatedComments = [...submission.comments, newComment];

      const { error } = await supabase
        .from('chapter_submissions')
        .update({ comments: updatedComments })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, comments: updatedComments } : sub
        )
      );

      setNewComment('');
      toast({
        title: "Comentário adicionado",
        description: "Comentário foi salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar comentário",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const downloadDocx = async (submission: Submission) => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: submission.chapter_title || "Capítulo sem título",
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Por: ${submission.author_name}`,
                  italics: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: submission.chapter_content,
                  size: 24,
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${submission.chapter_title || 'capitulo'}-${submission.author_name}.docx`;
      saveAs(blob, fileName);

      toast({
        title: "Download iniciado",
        description: "O arquivo DOCX está sendo baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar DOCX",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-background py-8 overflow-x-hidden">
      <div className="max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Abas */}
        <div className="mb-6">
          <nav className="flex space-x-4 flex-wrap">
            <Button
              variant={activeTab === 'home' ? 'default' : 'outline'}
              onClick={() => setActiveTab('home')}
              className={activeTab === 'home' ? 'bg-primary text-primary-foreground' : 'text-foreground'}
            >
              Home
            </Button>
            <Button
              variant={activeTab === 'kanban' ? 'default' : 'outline'}
              onClick={() => setActiveTab('kanban')}
              className={activeTab === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-foreground'}
            >
              Logistica
            </Button>
            <Button
              variant={activeTab === 'calculadora' ? 'default' : 'outline'}
              onClick={() => setActiveTab('calculadora')}
              className={activeTab === 'calculadora' ? 'bg-primary text-primary-foreground' : 'text-foreground'}
            >
              Calculadora Editorial
            </Button>
          </nav>
        </div>

        {/* Conteúdo da Aba */}
        {activeTab === 'home' && (
          <>
            <div className="mb-8 flex items-center justify-between w-full">
              <div>
                <h1 className="heading-lg text-foreground mb-2">
                  Editorial
                </h1>
                <p className="body-md text-muted-foreground">
                  Capítulos enviados
                </p>
              </div>
              <AnimatedThemeToggler />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full">
              <Card className="card-editorial w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Submissões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {submissions.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-editorial w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Novas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {submissions.filter(s => s.status === 'novo').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-editorial w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {submissions.filter(s => s.status === 'em_analise').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-editorial w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Concluídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {submissions.filter(s => s.status === 'concluido').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="card-editorial mb-8 w-full">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email, título, livro/coordenador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 input-editorial w-full"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="input-editorial w-full">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="solicitar_ajustes">Solicitar Ajustes</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card className="card-editorial w-full" ref={tableRef}>
              <CardContent className="p-0">
                <div className="w-full box-border">
                  <table className="w-full table-fixed">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Autor
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Tipo
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Título
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Livro/Coordenação
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Data
                        </th>
                        <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="submission-row hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-4">
                            <div className="overflow-hidden text-ellipsis whitespace-normal">
                              <div className="font-medium text-foreground break-words">
                                {submission.author_name}
                              </div>
                              <div className="text-sm text-muted-foreground break-words">
                                {submission.author_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="capitalize">
                              {submission.submission_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground break-words">
                              {submission.chapter_title || 'Sem título'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground break-words">
                              {submission.book_coordinator || 'Não informado'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Select
                              value={submission.status}
                              onValueChange={(value) => updateStatus(submission.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground break-words">
                            {new Date(submission.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSubmission(submission)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                      <FileText className="h-5 w-5 text-primary" />
                                      <span>{submission.chapter_title || 'Capítulo sem título'}</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Detalhes completos da submissão
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedSubmission && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Autor</label>
                                          <p className="text-foreground">{selectedSubmission.author_name}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                                          <p className="text-foreground">{selectedSubmission.author_email}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                                          <p className="text-foreground capitalize">{selectedSubmission.submission_type}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Livro/Coordenação</label>
                                          <p className="text-foreground">{selectedSubmission.book_coordinator || 'Não informado'}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                                          <Badge className={statusColors[selectedSubmission.status]}>
                                            {statusLabels[selectedSubmission.status]}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Conteúdo do Capítulo</label>
                                        <div className="mt-2 p-4 bg-card border rounded-lg max-h-60 overflow-y-auto">
                                          <p className="text-foreground whitespace-pre-wrap text-sm">
                                            {selectedSubmission.chapter_content}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Resumo</label>
                                        <p className="mt-2 text-foreground">{selectedSubmission.summary}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Currículo</label>
                                        <p className="mt-2 text-foreground">{selectedSubmission.curriculum}</p>
                                      </div>
                                      {selectedSubmission.cover_text && (
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Texto da Capa</label>
                                          <p className="mt-2 text-foreground">{selectedSubmission.cover_text}</p>
                                        </div>
                                      )}
                                      {selectedSubmission.photo_file_url && (
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Foto</label>
                                          <img 
                                            src={selectedSubmission.photo_file_url} 
                                            alt="Foto do autor" 
                                            className="mt-2 max-w-xs rounded-lg"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Comentários Internos</label>
                                        <div className="mt-2 space-y-2">
                                          {selectedSubmission.comments.map((comment, index) => (
                                            <div key={index} className="p-3 bg-muted/20 rounded-lg">
                                              <p className="text-foreground text-sm">{comment}</p>
                                            </div>
                                          ))}
                                          <div className="flex space-x-2">
                                            <Textarea
                                              placeholder="Adicionar comentário interno..."
                                              value={newComment}
                                              onChange={(e) => setNewComment(e.target.value)}
                                              className="textarea-editorial"
                                              rows={2}
                                            />
                                            <Button 
                                              onClick={() => addComment(selectedSubmission.id)}
                                              disabled={!newComment.trim()}
                                            >
                                              <MessageSquare className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadDocx(submission)}
                                title="Baixar DOCX"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. A submissão será permanentemente removida.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSubmission(submission.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredSubmissions.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">
                        Nenhuma submissão encontrada
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Tente ajustar os filtros de busca.'
                          : 'Aguardando novas submissões de capítulos.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Renderiza o LogKanban quando a aba 'kanban' estiver ativa */}
        {activeTab === 'kanban' && <LogKanban />}

        {activeTab === 'calculadora' && <CalculadoraEditorial />}
      </div>
    </div>
  );
}
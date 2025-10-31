// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Send, Calculator, FileText, TrendingUp, Clock, CheckCircle, 
  AlertCircle, Download, Eye, Trash2, MessageSquare, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UiverseLoader } from '@/components/UiverseLoader';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Dialog + Alert
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';

// DOCX
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newComment, setNewComment] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const mapStatus = (status: Submission['status']): string => {
    const map: Record<Submission['status'], string> = {
      'novo': 'Em Revisão',
      'recebido': 'Em Revisão',
      'em_analise': 'Em Revisão',
      'solicitar_ajustes': 'Em Revisão',
      'concluido': 'Aprovado'
    };
    return map[status] || 'Rejeitado';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Em Revisão': return <Badge variant="secondary">Em Revisão</Badge>;
      case 'Aprovado': return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'Rejeitado': return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('chapter_submissions') // TABELA CORRETA
          .select(`
            id, author_name, author_email, submission_type, chapter_title, 
            chapter_content, curriculum, summary, cover_text, photo_file_url, 
            book_coordinator, status, comments, created_at, references
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);
      } catch (err: any) {
        setError('Falha ao carregar submissões.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const total = submissions.length;
  const emRevisao = submissions.filter(s => mapStatus(s.status) === 'Em Revisão').length;
  const aprovadas = submissions.filter(s => s.status === 'concluido').length;

  const metaSubmissoes = 50;
  const metaAprovacoes = 40;
  const progressoSubmissoes = Math.min((total / metaSubmissoes) * 100, 100);
  const progressoAprovacoes = Math.min((aprovadas / metaAprovacoes) * 100, 100);

  const recentSubmissions = submissions.slice(0, 4);

  const stats = [
    { label: 'Submissões Totais', value: total.toString(), icon: BookOpen, color: 'text-blue-600' },
    { label: 'Em Revisão', value: emRevisao.toString(), icon: Clock, color: 'text-yellow-600' },
    { label: 'Aprovadas', value: aprovadas.toString(), icon: CheckCircle, color: 'text-green-600' },
    { label: 'Rejeitadas', value: '0', icon: FileText, color: 'text-red-600' },
  ];

  const handleView = (submission: Submission) => {
    setSelectedSubmission(submission);
    setNewComment('');
  };

  const downloadDocx = async (submission: Submission) => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: submission.chapter_title || "Capítulo sem título",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 240 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Por: ${submission.author_name}`, italics: true, size: 24 })],
              spacing: { after: 240 },
            }),
            ...submission.chapter_content.split('\n').map(line => 
              new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 200 } })
            ),
            new Paragraph({ text: "Resumo", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 240 } }),
            ...submission.summary.split('\n').map(line => 
              new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 200 } })
            ),
            ...(submission.references && submission.references.length > 0 ? [
              new Paragraph({ text: "Referências", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 240 } }),
              ...submission.references.map(ref => 
                new Paragraph({ children: [new TextRun({ text: ref.formatted, size: 24 })], spacing: { after: 200 } })
              ),
            ] : []),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${submission.chapter_title || 'capitulo'}-${submission.author_name}.docx`);
      toast({ title: "Download iniciado", description: "DOCX gerado." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar DOCX.", variant: "destructive" });
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

      setSubmissions(prev => prev.map(s => 
        s.id === selectedSubmission.id ? { ...s, comments: updatedComments } : s
      ));
      setSelectedSubmission({ ...selectedSubmission, comments: updatedComments });
      setNewComment('');
      toast({ title: "Comentário adicionado", description: "Salvo com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('chapter_submissions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Excluído", description: "Submissão removida." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editorial</h1>
            <p className="text-muted-foreground">Genrenciador de Capitulos</p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/submit">
              <Send className="h-5 w-5 mr-2" />
              Nova Capitulo 
            </Link>
          </Button>
        </div>

        {/* Stats */}
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

        {/* Tabela */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Capítulos Recentes</CardTitle>
              <CardDescription>Últimos {recentSubmissions.length} capítulos</CardDescription>
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
                        <TableCell>{getStatusBadge(mapStatus(s.status))}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(s.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleView(s)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <span>{s.chapter_title || 'Capítulo sem título'}</span>
                                </DialogTitle>
                                <DialogDescription>
                                  Detalhes completos da submissão.
                                </DialogDescription>
                              </DialogHeader>
                              {selectedSubmission && selectedSubmission.id === s.id && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                                    <div><label className="text-sm font-medium text-muted-foreground">Autor</label><p>{selectedSubmission.author_name}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Email</label><p>{selectedSubmission.author_email}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Tipo</label><p className="capitalize">{selectedSubmission.submission_type}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Coordenação</label><p>{selectedSubmission.book_coordinator || 'Não informado'}</p></div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                                      <Badge className={statusColors[selectedSubmission.status]}>
                                        {statusLabels[selectedSubmission.status]}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Conteúdo</label>
                                    <div className="mt-2 p-4 bg-card border rounded-lg max-h-60 overflow-y-auto">
                                      <p className="text-sm whitespace-pre-wrap">{selectedSubmission.chapter_content}</p>
                                    </div>
                                  </div>

                                  <div><label className="text-sm font-medium text-muted-foreground">Resumo</label><p className="mt-2">{selectedSubmission.summary}</p></div>
                                  <div><label className="text-sm font-medium text-muted-foreground">Currículo</label><p className="mt-2">{selectedSubmission.curriculum}</p></div>
                                  {selectedSubmission.cover_text && (
                                    <div><label className="text-sm font-medium text-muted-foreground">Texto da Capa</label><p className="mt-2">{selectedSubmission.cover_text}</p></div>
                                  )}
                                  {selectedSubmission.photo_file_url && (
                                    <div><label className="text-sm font-medium text-muted-foreground">Foto</label>
                                      <img src={selectedSubmission.photo_file_url} alt="Foto" className="mt-2 max-w-xs rounded-lg" />
                                    </div>
                                  )}

                                  {/* Referências FORA da <p> */}
                                  {selectedSubmission.references && selectedSubmission.references.length > 0 && (
                                    <div className="mt-4">
                                      <strong className="block mb-2">Referências Bibliográficas:</strong>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {selectedSubmission.references.map((ref, i) => (
                                          <li key={i} className="text-sm">{ref.formatted}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Comentarios Equipe Editorial</label>
                                    <div className="mt-2 space-y-2">
                                      {selectedSubmission.comments.map((c, i) => (
                                        <div key={i} className="p-3 bg-muted/20 rounded-lg text-sm">{c}</div>
                                      ))}
                                      <div className="flex space-x-2">
                                        <Textarea
                                          placeholder="Adicionar comentário..."
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          rows={2}
                                        />
                                        <Button onClick={addComment} disabled={!newComment.trim()}>
                                          <MessageSquare className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" variant="ghost" onClick={() => downloadDocx(s)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma submissão.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Progresso Mensal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><div className="flex justify-between text-sm"><span>Submissões</span><span>{total} / {metaSubmissoes}</span></div>
                <Progress value={progressoSubmissoes} className="mt-2" />
              </div>
              <div><div className="flex justify-between text-sm"><span>Aprovações</span><span>{aprovadas} / {metaAprovacoes}</span></div>
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

        {/* Floating Button */}
        <Button size="lg" className="fixed bottom-6 right-6 rounded-full shadow-lg z-10" asChild>
          <Link to="/submit"><Send className="h-5 w-5 mr-2" />Nova Submissão</Link>
        </Button>
      </div>

      {/* Exclusão */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600" disabled={isDeleting}>
              {isDeleting ? 'Apagando...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
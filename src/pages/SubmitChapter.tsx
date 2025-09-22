import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  FileText, 
  User, 
  BookOpen, 
  Info,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Carregar a biblioteca docx via CDN
const loadDocx = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.min.js';
    script.async = true;
    script.onload = () => resolve(window.docx);
    script.onerror = () => reject(new Error('Falha ao carregar a biblioteca docx'));
    document.body.appendChild(script);
  });
};

type SubmissionType = 'solo' | 'coautoria';

interface FormData {
  authorName: string;
  authorEmail: string;
  submissionType: SubmissionType | '';
  chapterTitle: string;
  chapterContent: string;
  curriculum: string;
  summary: string;
  coverText: string;
  photoFile: File | null;
  bookCoordinator?: string;
  hasReferences: boolean;
  references: Array<{ formatted: string; fields: ReferenceFields; type: string }>;
}

interface MaterialType {
  label: string;
  value: string;
}

interface ReferenceFields {
  [key: string]: string;
}

const materialTypes: MaterialType[] = [
  { label: "Livro", value: "book" },
  { label: "Capítulo de Livro", value: "book-chapter" },
  { label: "Artigo de Periódico", value: "article-or-section-of-periodical" },
  { label: "Website", value: "website" },
];

const fieldDefinitions: { [key: string]: { required: string[]; optional: string[] } } = {
  book: {
    required: ["autor", "titulo", "cidade", "editora", "ano"],
    optional: ["subtitulo", "edicao", "isbn"],
  },
  "book-chapter": {
    required: ["autor_capitulo", "titulo_capitulo", "autor_livro", "titulo_livro", "cidade", "editora", "ano", "paginas"],
    optional: ["subtitulo_capitulo", "subtitulo_livro", "edicao", "isbn"],
  },
  "article-or-section-of-periodical": {
    required: ["autor", "titulo_artigo", "titulo_periodico", "ano", "volume", "numero", "paginas"],
    optional: ["subtitulo_artigo", "doi", "url"],
  },
  website: {
    required: ["autor", "titulo_pagina", "nome_site", "ano", "url"],
    optional: ["data_acesso"],
  },
};

const formatAuthorName = (author: string): string => {
  if (!author) return "";
  const authors = author.split(";").map((a) => a.trim());
  return authors
    .map((a) => {
      const parts = a.split(" ").filter((p) => p);
      if (parts.length < 2) return "";
      const surname = parts[parts.length - 1];
      const firstName = parts[0];
      const initial = firstName.charAt(0).toUpperCase() + ".";
      return `${surname.toUpperCase()}, ${initial}`;
    })
    .filter((a) => a)
    .join("; ");
};

const formatReference = (fields: ReferenceFields, type: MaterialType): string => {
  const { value: typeValue } = type;
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  switch (typeValue) {
    case "book":
      return `${formatAuthorName(fields.autor)}. ${fields.titulo}. ${fields.cidade}: ${fields.editora}, ${fields.ano}.`;
    case "book-chapter":
      return `${formatAuthorName(fields.autor_capitulo)}. ${fields.titulo_capitulo}. In: ${formatAuthorName(fields.autor_livro)}. ${fields.titulo_livro}. ${fields.cidade}: ${fields.editora}, ${fields.ano}. p. ${fields.paginas}.`;
    case "article-or-section-of-periodical":
      return `${formatAuthorName(fields.autor)}. ${fields.titulo_artigo}. ${fields.titulo_periodico}, ${fields.cidade}, v. ${fields.volume}, n. ${fields.numero}, p. ${fields.paginas}, ${fields.ano}. ${fields.doi ? `DOI: ${fields.doi}` : ""}`;
    case "website":
      return `${formatAuthorName(fields.autor)}. ${fields.titulo_pagina}. ${fields.nome_site}, ${fields.ano}. Disponível em: ${fields.url}. Acesso em: ${fields.data_acesso || currentDate}.`;
    default:
      return "Tipo de material não suportado.";
  }
};

export default function SubmitChapter() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    authorName: '',
    authorEmail: '',
    submissionType: '',
    chapterTitle: '',
    chapterContent: '',
    curriculum: '',
    summary: '',
    coverText: '',
    photoFile: null,
    bookCoordinator: '',
    hasReferences: false,
    references: [],
  });

  const [currentReference, setCurrentReference] = useState<ReferenceFields>({});
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current.querySelectorAll('.form-field'), 
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }
      );
    }
  }, [currentStep]);

  useEffect(() => {
    setErrors(prev => ({ ...prev, chapterContent: '' }));
  }, [formData.submissionType]);

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const validateReference = (): boolean => {
    if (!selectedMaterialType) {
      setErrors(prev => ({ ...prev, referenceType: 'Selecione um tipo de material' }));
      return false;
    }
    const requiredFields = fieldDefinitions[selectedMaterialType.value]?.required || [];
    const missingFields = requiredFields.filter((field) => !currentReference[field]?.trim());
    if (missingFields.length > 0) {
      setErrors(prev => ({ ...prev, referenceFields: `Preencha todos os campos obrigatórios: ${missingFields.join(", ")}` }));
      return false;
    }
    return true;
  };

  const addReference = () => {
    if (!validateReference()) return;

    const formatted = formatReference(currentReference, selectedMaterialType!);
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { formatted, fields: currentReference, type: selectedMaterialType!.value }],
    }));
    setCurrentReference({});
    setSelectedMaterialType(null);
    setErrors(prev => ({ ...prev, referenceType: '', referenceFields: '' }));
    toast({
      title: "Referência adicionada",
      description: "Referência formatada em ABNT foi adicionada à lista.",
    });
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
    toast({
      title: "Referência removida",
      description: "Referência foi removida da lista.",
    });
  };

  const generateDocx = async () => {
    await loadDocx();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Título do capítulo (se fornecido)
          ...(formData.chapterTitle ? [
            new Paragraph({
              text: formData.chapterTitle,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 240 },
            }),
          ] : []),
          // Conteúdo do capítulo
          ...formData.chapterContent.split('\n').map(line => new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 200 },
          })),
          // Seção de referências (se houver)
          ...(formData.hasReferences && formData.references.length > 0 ? [
            new Paragraph({
              text: "Referências Bibliográficas",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 240 },
            }),
            ...formData.references.map(ref => new Paragraph({
              children: [new TextRun(ref.formatted)],
              spacing: { after: 200 },
            })),
          ] : []),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chapter_submission_${Date.now()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.authorName.trim()) {
          newErrors.authorName = 'Nome do autor é obrigatório';
        }
        if (!formData.authorEmail.trim()) {
          newErrors.authorEmail = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.authorEmail)) {
          newErrors.authorEmail = 'Email inválido';
        }
        break;

      case 2:
        if (!formData.submissionType) {
          newErrors.submissionType = 'Tipo de envio é obrigatório';
        } else if (formData.submissionType === 'coautoria' && !formData.bookCoordinator?.trim()) {
          newErrors.bookCoordinator = 'Título do livro, Coordenador é obrigatório para coautoria';
        }
        break;

      case 3:
        if (!formData.chapterContent.trim()) {
          newErrors.chapterContent = 'Conteúdo do capítulo é obrigatório';
        } else {
          const charCount = getCharacterCount(formData.chapterContent);
          if (formData.submissionType === 'coautoria' && (charCount < 8000 || charCount > 13000)) {
            newErrors.chapterContent = 'Para coautoria, o capítulo deve ter entre 8.000 e 13.000 caracteres';
          }
        }
        if (formData.hasReferences && formData.references.length === 0) {
          newErrors.references = 'Adicione pelo menos uma referência bibliográfica';
        }
        break;

      case 4:
        const curriculumContentLength = formData.curriculum.startsWith('**CURRÍCULO**\n') 
          ? formData.curriculum.length - '**CURRÍCULO**\n'.length 
          : formData.curriculum.length;
        const summaryContentLength = formData.summary.startsWith('**RESUMO**\n') 
          ? formData.summary.length - '**RESUMO**\n'.length 
          : formData.summary.length;

        if (!formData.curriculum.trim()) {
          newErrors.curriculum = 'Currículo é obrigatório';
        } else if (curriculumContentLength < 300 || curriculumContentLength > 1000) {
          newErrors.curriculum = 'Currículo deve ter entre 300 e 1000 caracteres (excluindo o título)';
        }
        
        if (!formData.summary.trim()) {
          newErrors.summary = 'Resumo é obrigatório';
        } else if (summaryContentLength < 100 || summaryContentLength > 400) {
          newErrors.summary = 'Resumo deve ter entre 100 e 400 caracteres (excluindo o título)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        setErrors(prev => ({ ...prev, photoFile: 'Apenas arquivos PNG são aceitos' }));
        setFormData(prev => ({ ...prev, photoFile: null }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photoFile: 'Arquivo deve ter no máximo 10MB' }));
        setFormData(prev => ({ ...prev, photoFile: null }));
        return;
      }
      setFormData(prev => ({ ...prev, photoFile: file }));
      setErrors(prev => ({ ...prev, photoFile: '' }));
    }
  };

  const removePhotoFile = () => {
    setFormData(prev => ({ ...prev, photoFile: null }));
    setErrors(prev => ({ ...prev, photoFile: '' }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);
    
    try {
      let photoUrl = '';
      
      if (formData.photoFile) {
        const fileExt = 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chapter-photos')
          .upload(fileName, formData.photoFile);

        if (uploadError) {
          throw new Error(`Erro ao fazer upload da foto: ${uploadError.message}`);
        }

        const { data } = supabase.storage
          .from('chapter-photos')
          .getPublicUrl(fileName);
        
        if (!data?.publicUrl) {
          throw new Error('Não foi possível obter a URL pública da foto. Verifique as permissões do bucket.');
        }
        
        photoUrl = data.publicUrl;
      }
      
      const { error } = await supabase
        .from('chapter_submissions')
        .insert({
          author_name: formData.authorName,
          author_email: formData.authorEmail,
          submission_type: formData.submissionType as SubmissionType,
          chapter_title: formData.chapterTitle || null,
          chapter_content: formData.chapterContent,
          curriculum: formData.curriculum,
          summary: formData.summary,
          cover_text: formData.coverText || null,
          photo_file_url: photoUrl || null,
          book_coordinator: formData.bookCoordinator || null,
          "references": formData.references.length > 0 ? formData.references : null,
          status: 'novo',
          comments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Erro ao enviar submissão: ${error.message}`);
      }

      // Gerar o arquivo .docx
      await generateDocx();

      toast({
        title: "Capítulo enviado com sucesso!",
        description: "Obrigado pela submissão. O arquivo .docx foi baixado. Entraremos em contato em breve.",
      });

      setFormData({
        authorName: '',
        authorEmail: '',
        submissionType: '',
        chapterTitle: '',
        chapterContent: '',
        curriculum: '',
        summary: '',
        coverText: '',
        photoFile: null,
        bookCoordinator: '',
        hasReferences: false,
        references: [],
      });
      setCurrentReference({});
      setSelectedMaterialType(null);
      setCurrentStep(1);
      navigate('/');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Erro ao enviar capítulo",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados do Autor', icon: User },
    { number: 2, title: 'Tipo de Envio', icon: BookOpen },
    { number: 3, title: 'Capítulo', icon: FileText },
    { number: 4, title: 'Informações Extras', icon: Info },
  ];

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-soft py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="heading-lg text-foreground mb-2">
            Envio de Capítulo
          </h1>
          <p className="body-md text-muted-foreground">
            Processo guiado para submissão do seu trabalho
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={`flex items-center space-x-2 ${
                  step.number <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentStep(step.number)}
                onKeyDown={(e) => e.key === 'Enter' && setCurrentStep(step.number)}
              >
                <div className={`p-2 rounded-full ${
                  step.number <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block font-medium text-sm">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="card-editorial shadow-elegant">
          <CardHeader>
            <CardTitle className="heading-sm flex items-center">
              {(() => {
                const Icon = steps[currentStep - 1].icon;
                return <Icon className="h-5 w-5 mr-2 text-primary" />;
              })()}
              Etapa {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Informe seus dados pessoais"}
              {currentStep === 2 && "Selecione o tipo de submissão"}
              {currentStep === 3 && "Envie o conteúdo do seu capítulo"}
              {currentStep === 4 && "Complete com informações adicionais"}
            </CardDescription>
          </CardHeader>

          <CardContent ref={formRef}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2 form-field">
                  <Label htmlFor="authorName" className="font-medium">
                    Nome do Autor *
                  </Label>
                  <Input
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    className="input-editorial"
                    placeholder="Seu nome completo"
                    aria-label="Nome completo do autor"
                    aria-describedby={errors.authorName ? 'authorName-error' : undefined}
                  />
                  {errors.authorName && (
                    <Alert variant="destructive" id="authorName-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.authorName}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2 form-field">
                  <Label htmlFor="authorEmail" className="font-medium">
                    Email *
                  </Label>
                  <Input
                    id="authorEmail"
                    type="email"
                    value={formData.authorEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                    className="input-editorial"
                    placeholder="seu@email.com"
                    aria-label="Email do autor"
                    aria-describedby={errors.authorEmail ? 'authorEmail-error' : undefined}
                  />
                  {errors.authorEmail && (
                    <Alert variant="destructive" id="authorEmail-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.authorEmail}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 form-field">
                <RadioGroup
                  value={formData.submissionType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, submissionType: value as SubmissionType, bookCoordinator: value === 'coautoria' ? prev.bookCoordinator : '' }))}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center space-x-2 p-4 border-2 border-border rounded-xl hover:border-primary transition-colors">
                    <RadioGroupItem value="solo" id="solo" />
                    <Label htmlFor="solo" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Solo</div>
                        <div className="text-sm text-muted-foreground">
                          Envio individual, sem limite de caracteres
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border-2 border-border rounded-xl hover:border-primary transition-colors">
                    <RadioGroupItem value="coautoria" id="coautoria" />
                    <Label htmlFor="coautoria" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Coautoria</div>
                        <div className="text-sm text-muted-foreground">
                          Colaboração editorial, entre 8.000 e 13.000 caracteres
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {formData.submissionType === 'coautoria' && (
                  <div className="space-y-2">
                    <Label htmlFor="bookCoordinator" className="font-medium">
                      Título do livro, Coordenador *
                    </Label>
                    <Input
                      id="bookCoordinator"
                      value={formData.bookCoordinator || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bookCoordinator: e.target.value }))}
                      className="input-editorial"
                      placeholder="Título do livro e nome do coordenador"
                      aria-label="Título do livro e coordenador"
                      aria-describedby={errors.bookCoordinator ? 'bookCoordinator-error' : undefined}
                    />
                    {errors.bookCoordinator && (
                      <Alert variant="destructive" id="bookCoordinator-error">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.bookCoordinator}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {errors.submissionType && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.submissionType}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2 form-field">
                  <Label htmlFor="chapterTitle" className="font-medium">
                    Título do Capítulo (opcional)
                  </Label>
                  <Input
                    id="chapterTitle"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, chapterTitle: e.target.value }))}
                    className="input-editorial"
                    placeholder="Título do seu capítulo"
                    aria-label="Título do capítulo"
                  />
                </div>

                <div className="space-y-2 form-field">
                  <Label htmlFor="chapterContent" className="font-medium">
                    Conteúdo do Capítulo *
                  </Label>
                  <Textarea
                    id="chapterContent"
                    value={formData.chapterContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, chapterContent: e.target.value }))}
                    className="textarea-editorial min-h-[300px]"
                    placeholder={formData.submissionType === 'coautoria' 
                      ? 'Cole aqui o texto do seu capítulo (8.000 a 13.000 caracteres, incluindo espaços)...' 
                      : 'Cole aqui o texto do seu capítulo...'}
                    aria-label="Conteúdo do capítulo"
                    aria-describedby={errors.chapterContent ? 'chapterContent-error' : undefined}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{getCharacterCount(formData.chapterContent)} caracteres (incluindo espaços)</span>
                    {formData.submissionType === 'coautoria' && (
                      <span>
                        {getCharacterCount(formData.chapterContent) < 8000 
                          ? `Mínimo: ${8000 - getCharacterCount(formData.chapterContent)} caracteres restantes` 
                          : getCharacterCount(formData.chapterContent) > 13000 
                          ? `Excesso: ${getCharacterCount(formData.chapterContent) - 13000} caracteres` 
                          : '✓ Dentro do limite'}
                      </span>
                    )}
                  </div>
                  {errors.chapterContent && (
                    <Alert variant="destructive" id="chapterContent-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.chapterContent}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2 form-field">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasReferences"
                      checked={formData.hasReferences}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasReferences: !!checked, references: checked ? prev.references : [] }))}
                      aria-label="Capítulo contém referências bibliográficas"
                    />
                    <Label htmlFor="hasReferences" className="font-medium">
                      Seu capítulo contém referências bibliográficas?
                    </Label>
                  </div>
                </div>

                {formData.hasReferences && (
                  <div className="space-y-4 form-field">
                    <Label className="font-medium">Adicionar Referência (ABNT)</Label>
                    <div className="space-y-2">
                      <Select
                        value={selectedMaterialType?.value || ""}
                        onValueChange={(value) => {
                          const selected = materialTypes.find((m) => m.value === value);
                          setSelectedMaterialType(selected || null);
                          setCurrentReference({});
                          setErrors(prev => ({ ...prev, referenceType: '', referenceFields: '' }));
                        }}
                      >
                        <SelectTrigger className="input-editorial">
                          <SelectValue placeholder="Selecione o tipo de material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialTypes.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.referenceType && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.referenceType}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {selectedMaterialType && (
                      <div className="space-y-4">
                        {fieldDefinitions[selectedMaterialType.value]?.required.map((field) => (
                          <div key={field} className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              {field.replace(/_/g, " ")}*
                            </Label>
                            <Input
                              value={currentReference[field] || ""}
                              onChange={(e) => setCurrentReference(prev => ({ ...prev, [field]: e.target.value }))}
                              placeholder={
                                field.includes("autor")
                                  ? "Ex.: Yuri Alberto"
                                  : `Digite ${field.replace(/_/g, " ")}`
                              }
                              className="input-editorial"
                              aria-label={`Campo ${field.replace(/_/g, " ")}`}
                            />
                          </div>
                        ))}
                        {fieldDefinitions[selectedMaterialType.value]?.optional.map((field) => (
                          <div key={field} className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              {field.replace(/_/g, " ")}
                            </Label>
                            <Input
                              value={currentReference[field] || ""}
                              onChange={(e) => setCurrentReference(prev => ({ ...prev, [field]: e.target.value }))}
                              placeholder={
                                field.includes("autor")
                                  ? "Ex.: Memphis Depay (opcional)"
                                  : `Digite ${field.replace(/_/g, " ")} (opcional)`
                              }
                              className="input-editorial"
                              aria-label={`Campo ${field.replace(/_/g, " ")} (opcional)`}
                            />
                          </div>
                        ))}
                        {errors.referenceFields && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.referenceFields}</AlertDescription>
                          </Alert>
                        )}
                        <Button onClick={addReference} className="btn-editorial">
                          Adicionar Referência
                        </Button>
                      </div>
                    )}

                    {formData.references.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-medium">Referências Adicionadas</Label>
                        <ul className="space-y-2">
                          {formData.references.map((ref, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                              <span className="text-sm">{ref.formatted}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeReference(index)}
                                className="btn-outline-editorial"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {errors.references && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.references}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2 form-field">
                  <Label htmlFor="curriculum" className="font-medium">
                    Currículo *
                  </Label>
                  <Textarea
                    id="curriculum"
                    value={formData.curriculum.startsWith('**CURRÍCULO**') ? formData.curriculum : `**CURRÍCULO**\n${formData.curriculum}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value.startsWith('**CURRÍCULO**\n')) {
                        setFormData(prev => ({ ...prev, curriculum: `**CURRÍCULO**\n${value}` }));
                      } else {
                        setFormData(prev => ({ ...prev, curriculum: value }));
                      }
                    }}
                    className="textarea-editorial"
                    placeholder="Conte um pouco sobre sua experiência e formação..."
                    aria-label="Currículo do autor"
                    aria-describedby={errors.curriculum ? 'curriculum-error' : undefined}
                  />
                  <div className="text-sm text-muted-foreground">
                    {(formData.curriculum.startsWith('**CURRÍCULO**\n') 
                      ? formData.curriculum.length - '**CURRÍCULO**\n'.length 
                      : formData.curriculum.length)}/1000 caracteres (mínimo 300, excluindo o título)
                  </div>
                  {errors.curriculum && (
                    <Alert variant="destructive" id="curriculum-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.curriculum}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2 form-field">
                  <Label htmlFor="summary" className="font-medium">
                    Resumo do Capítulo *
                  </Label>
                  <Textarea
                    id="summary"
                    value={formData.summary.startsWith('**RESUMO**') ? formData.summary : `**RESUMO**\n${formData.summary}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value.startsWith('**RESUMO**\n')) {
                        setFormData(prev => ({ ...prev, summary: `**RESUMO**\n${value}` }));
                      } else {
                        setFormData(prev => ({ ...prev, summary: value }));
                      }
                    }}
                    className="textarea-editorial"
                    placeholder="Faça um resumo conciso da sua obra..."
                    aria-label="Resumo da obra"
                    aria-describedby={errors.summary ? 'summary-error' : undefined}
                  />
                  <div className="text-sm text-muted-foreground">
                    {(formData.summary.startsWith('**RESUMO**\n') 
                      ? formData.summary.length - '**RESUMO**\n'.length 
                      : formData.summary.length)}/400 caracteres (mínimo 100, excluindo o título)
                  </div>
                  {errors.summary && (
                    <Alert variant="destructive" id="summary-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.summary}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {formData.submissionType === 'solo' && (
                  <div className="space-y-2 form-field">
                    <Label htmlFor="coverText" className="font-medium">
                      Texto da Capa (opcional)
                    </Label>
                    <Textarea
                      id="coverText"
                      value={formData.coverText}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverText: e.target.value }))}
                      className="textarea-editorial"
                      placeholder="Texto que gostaria de ver na capa..."
                      aria-label="Texto da capa"
                    />
                  </div>
                )}

                <div className="space-y-2 form-field">
                  <Label htmlFor="photoFile" className="font-medium">
                    Foto
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="photoFile"
                      type="file"
                      accept=".png"
                      onChange={handleFileUpload}
                      className="input-editorial"
                      aria-label="Upload de foto em PNG"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Apenas PNG, máximo 10MB
                  </p>
                  {formData.photoFile && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 text-sm text-primary">
                        <CheckCircle className="h-4 w-4" />
                        <span>{formData.photoFile.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removePhotoFile}
                        className="btn-outline-editorial"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  )}
                  {errors.photoFile && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.photoFile}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <div className="px-6 pb-6">
            <div className="flex justify-between">
              <Button
                onClick={prevStep}
                variant="outline"
                disabled={currentStep === 1 || isLoading}
                className="btn-outline-editorial"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep < 4 ? (
                <Button onClick={nextStep} className="btn-editorial" disabled={isLoading}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="btn-hero"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Capítulo'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
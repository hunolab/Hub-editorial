// src/pages/Revisor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface Regra {
  id: string;
  busca: string;
  flags: string;
  correcao: string;
  mensagem: string;
}

export default function Revisor() {
  const [texto, setTexto] = useState('');
  const [textoRevisado, setTextoRevisado] = useState('');
  const [regras, setRegras] = useState<Regra[]>([]);
  const [dicionario, setDicionario] = useState<Set<string> | null>(null);
  const [stopwords, setStopwords] = useState<Set<string>>(new Set());
  const [isRevisando, setIsRevisando] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const { toast } = useToast();

  // 1. CARREGA REGRAS DO grammar-rules.xml
  useEffect(() => {
    const carregarGrammar = async () => {
      try {
        const res = await fetch('/dict/grammar-rules.xml');
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        const rules = xml.querySelectorAll('rule');

        const regrasArray: Regra[] = [];
        rules.forEach(rule => {
          const id = rule.getAttribute('id') || '';
          const pattern = rule.querySelector('pattern')?.textContent || '';
          const suggestion = rule.querySelector('suggestion')?.textContent || '';
          const message = rule.querySelector('message')?.textContent || 'Erro gramatical';

          if (pattern && suggestion) {
            const busca = pattern.replace(/<[^>]*>/g, '').trim();
            const correcao = suggestion.replace(/\\(\d+)/g, '$$$1');
            regrasArray.push({ id, busca, flags: 'gi', correcao, mensagem: message });
          }
        });

        setRegras(regrasArray);
        toast({ title: 'Regras carregadas', description: `${regrasArray.length} regras ativas` });
      } catch {
        toast({ title: 'Erro', description: 'Falha ao carregar grammar-rules.xml', variant: 'destructive' });
      }
    };
    carregarGrammar();
  }, [toast]);

  // 2. CARREGA STOPWORDS
  useEffect(() => {
    fetch('/dict/stopwords-pt.txt')
      .then(r => r.text())
      .then(text => {
        const list = text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
        setStopwords(new Set(list));
      });
  }, []);

  // 3. WEB WORKER PARA DICIONÁRIO (320k palavras)
  useEffect(() => {
    const workerCode = `
      self.onmessage = async () => {
        const response = await fetch('/dict/ptwords.txt');
        const text = await response.text();
        const words = text.split('\\n').map(w => w.trim().toLowerCase()).filter(Boolean);
        self.postMessage(new Set(words));
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      setDicionario(e.data);
      toast({ title: 'Dicionário carregado', description: '320.000 palavras prontas!' });
    };

    workerRef.current.postMessage(null);

    return () => workerRef.current?.terminate();
  }, [toast]);

  // 4. APLICA REGRAS + ORTOGRAFIA
  const aplicarRegras = (textoOriginal: string): string => {
    if (!dicionario) return '<em class="text-muted-foreground">Aguarde o dicionário...</em>';

    let textoAtual = textoOriginal;

    // Gramática
    regras.forEach(regra => {
      try {
        const regex = new RegExp(regra.busca, regra.flags);
        textoAtual = textoAtual.replace(regex, (match, ...groups) => {
          let correcao = regra.correcao;
          groups.slice(0, -2).forEach((g, i) => {
            correcao = correcao.replace(`$${i + 1}`, g);
          });
          return `<span class="bg-yellow-200 text-yellow-900 px-1 rounded font-medium" title="${regra.mensagem}">${match}</span><span class="text-green-600 font-medium ml-1">→ ${correcao}</span>`;
        });
      } catch (e) {
        console.warn('Regra inválida:', regra);
      }
    });

    // Ortografia
    const palavrasUnicas = [...new Set(
      textoAtual
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .match(/\b[\wà-ú]+\b/g) || []
    )];

    palavrasUnicas.forEach(palavra => {
      if (
        palavra.length > 2 &&
        !dicionario.has(palavra) &&
        !stopwords.has(palavra)
      ) {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        textoAtual = textoAtual.replace(regex, `<span class="bg-red-200 text-red-800 px-1 rounded font-medium">${palavra}</span>`);
      }
    });

    return textoAtual || '<em class="text-muted-foreground">Nenhum erro encontrado.</em>';
  };

  const handleRevisar = () => {
    setIsRevisando(true);
    setTimeout(() => {
      const revisado = aplicarRegras(texto);
      setTextoRevisado(revisado);
      setIsRevisando(false);
    }, 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Revisor de Texto IA
          </h1>
          <p className="text-muted-foreground mt-1">Gramática + Ortografia em PT-BR com 320k palavras</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {regras.length} regras
          </Badge>
          <Badge variant={dicionario ? 'default' : 'secondary'}>
            {dicionario ? <CheckCircle className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
            {dicionario ? 'Dicionário OK' : 'Carregando...'}
          </Badge>
        </div>
      </div>

      {/* Cards de Entrada e Saída */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Texto Original */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Texto Original</CardTitle>
            <CardDescription>Cole ou digite o texto para revisar</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: O livro foi enviada para gráfica ontem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-64 resize-none font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Texto Revisado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Texto Revisado</CardTitle>
            <CardDescription>
              {textoRevisado ? 'Erros destacados' : 'Clique em Revisar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-64 p-4 bg-muted/50 rounded-lg prose prose-sm max-w-none overflow-auto font-mono text-sm"
              dangerouslySetInnerHTML={{ __html: textoRevisado || '<em class="text-muted-foreground">Aguardando revisão...</em>' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Botão de Ação */}
      <div className="flex justify-center">
        <Button
          onClick={handleRevisar}
          disabled={!dicionario || !texto.trim() || isRevisando}
          size="lg"
          className="w-full max-w-md"
        >
          {isRevisando ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Revisando...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-5 w-5" />
              Revisar com Gramática + Ortografia
            </>
          )}
        </Button>
      </div>

      {/* Legenda */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Legenda de Correções</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-5 bg-yellow-200 rounded"></span>
            <span>Erro gramatical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-5 bg-red-200 rounded"></span>
            <span>Erro ortográfico</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">→ correção</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
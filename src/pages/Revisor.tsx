// src/pages/Revisor.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // npm install axios
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // Assuma que você tem este componente
import { Loader2, CheckCircle, FileText, Zap } from 'lucide-react';

interface RegraLT { id: string; pattern: RegExp; message: string; suggestions: string[] }
interface Erro { start: number; end: number; message: string; suggestion?: string; source: 'offline' | 'api' }

export default function Revisor() {
  const [texto, setTexto] = useState('');
  const [erros, setErros] = useState<Erro[]>([]);
  const [regras, setRegras] = useState<RegraLT[]>([]);
  const [dicionario, setDicionario] = useState<Set<string> | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [usarAPI, setUsarAPI] = useState(false); // Novo: toggle para API
  const [apiKey] = useState(process.env.REACT_APP_LANGUAGETOOL_API_KEY || ''); // Chave do .env
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/dict/grammar.xml').then(r => r.text()),
      fetch('/dict/dicionario-completo.txt').then(r => r.text())
    ]).then(([xmlText, dictText]) => {
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const rules = xml.querySelectorAll('rule');
      const regrasCarregadas: RegraLT[] = [];

      rules.forEach(rule => {
        const id = rule.getAttribute('id') || '';
        const message = rule.querySelector('message')?.textContent || 'Erro';
        const tokens = Array.from(rule.querySelectorAll('pattern token'));
        const suggestion = rule.querySelector('suggestion')?.textContent || '';

        if (!tokens.length) return;

        let regexStr = '';
        tokens.forEach((t, i) => {
          let part = t.getAttribute('regexp') === 'yes' ? t.textContent! : t.textContent!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (t.getAttribute('negate') === 'yes') part = `(?!${part})\\b\\w+\\b`;
          regexStr += part + (i < tokens.length - 1 ? '\\s+' : '');
        });

        try {
          regrasCarregadas.push({
            id,
            pattern: new RegExp(`\\b${regexStr}\\b`, 'gi'),
            message: message.replace(/<suggestion>.*?<\/suggestion>/g, '').trim(),
            suggestions: suggestion ? [suggestion.replace(/\\(\d)/g, '$$$1')] : []
          });
        } catch (e) { console.warn('Regra inválida:', id); }
      });

      const palavras = new Set(dictText.split('\n').map(l => l.split('/')[0].trim().toLowerCase()).filter(Boolean));
      setRegras(regrasCarregadas);
      setDicionario(palavras);
      setCarregado(true);
      toast({ title: 'Carregado!', description: `${regrasCarregadas.length} regras + ${palavras.size} palavras` });
    }).catch(() => toast({ title: 'Erro', description: 'Verifique /public/dict/', variant: 'destructive' }));
  }, [toast]);

  // Nova: Revisão com API LanguageTool
  const revisarComAPI = async () => {
    if (!apiKey) {
      toast({ title: 'Erro API', description: 'Adicione REACT_APP_LANGUAGETOOL_API_KEY no .env', variant: 'destructive' });
      return;
    }

    try {
      const response = await axios.post('https://api.languagetool.org/v2/check', 
        `language=pt-BR&text=${encodeURIComponent(texto)}`, 
        { headers: { Authorization: `Key ${apiKey}` } }
      );
      const apiErros: Erro[] = response.data.matches.map((match: any) => ({
        start: match.offset,
        end: match.offset + match.length,
        message: match.message,
        suggestion: match.replacements[0]?.value || undefined,
        source: 'api' as const
      }));
      return apiErros;
    } catch (error) {
      console.error('API Error:', error);
      toast({ title: 'Erro API', description: 'Falha na LanguageTool. Usando offline.', variant: 'destructive' });
      return [];
    }
  };

  const revisar = async () => {
    if (!carregado || !texto.trim()) return;
    let novosErros: Erro[] = [];

    // Offline sempre
    regras.forEach(r => {
      for (const m of texto.matchAll(r.pattern)) {
        if (m.index === undefined) continue;
        novosErros.push({ start: m.index, end: m.index + m[0].length, message: r.message, suggestion: r.suggestions[0], source: 'offline' });
      }
    });

    if (dicionario) {
      const palavras = texto.toLowerCase().match(/\b[\wà-ú]+\b/g) || [];
      new Set(palavras).forEach(p => {
        if (p.length > 2 && !dicionario.has(p)) {
          const re = new RegExp(`\\b${p}\\b`, 'gi');
          let m;
          while ((m = re.exec(texto))) {
            novosErros.push({ start: m.index, end: m.index + m[0].length, message: 'Palavra não encontrada', source: 'offline' });
          }
        }
      });
    }

    // API se ativada
    if (usarAPI) {
      const apiErros = await revisarComAPI();
      novosErros = [...novosErros, ...apiErros];
    }

    novosErros.sort((a, b) => a.start - b.start);
    setErros(novosErros);
  };

  const escape = (t: string) => t.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

  const gerarHTML = () => {
    if (!erros.length) return texto ? escape(texto).replace(/\n/g, '<br>') : '<em class="text-gray-500">Clique em Revisar.</em>';

    let html = '', pos = 0;
    for (const e of erros) {
      html += escape(texto.slice(pos, e.start)).replace(/\n/g, '<br>');
      const textoErro = escape(texto.slice(e.start, e.end));
      const cor = e.source === 'api' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'; // Nova: cor por fonte
      const tooltip = e.suggestion ? `${e.message} → <strong>${escape(e.suggestion)}</strong>` : e.message;

      html += `<mark class="${cor} font-medium px-1 rounded cursor-help inline group">
        ${textoErro}
        <span class="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition z-50 pointer-events-none max-w-xs break-words whitespace-normal">
          ${tooltip} (${e.source})
        </span>
      </mark>`;
      pos = e.end;
    }
    html += escape(texto.slice(pos)).replace(/\n/g, '<br>');
    return html;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap');
        * { font-family: 'Outfit', sans-serif !important; }
        mark { display: inline !important; white-space: normal !important; line-height: inherit !important; }
        mark .absolute { opacity: 0 !important; transition: opacity .2s !important; }
        mark:hover .absolute { opacity: 1 !important; }
      `}</style>

      <div className="text-center space-y-2">
        <div className="flex justify-center items-center gap-3">
          <FileText className="h-9 w-9 text-gray-700" />
          <h1 className="text-3xl font-bold">Revisor</h1>
          <Zap className={`h-6 w-6 ${usarAPI ? 'text-blue-500' : 'text-gray-300'}`} title="Modo API" />
        </div>
        <p className="text-gray-600">Offline + API (LanguageTool)</p>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <Badge variant="outline">{regras.length} regras</Badge>
        <Badge variant="outline">{erros.length} erro{erros.length !== 1 ? 's' : ''}</Badge>
        <Badge variant={carregado ? "secondary" : "outline"}>
          {carregado ? <CheckCircle className="mr-1 h-3 w-3" /> : <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          {carregado ? 'Pronto' : 'Carregando...'}
        </Badge>
      </div>

      {/* Novo: Toggle API */}
      <div className="flex justify-center items-center gap-2">
        <Checkbox id="api" checked={usarAPI} onCheckedChange={setUsarAPI} />
        <label htmlFor="api" className="text-sm text-gray-600">Usar API LanguageTool (azul)</label>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span> Original
          </CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Digite seu texto..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              className="min-h-96 font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Revisado
          </CardTitle></CardHeader>
          <CardContent>
            <div
              className="min-h-96 p-5 bg-white rounded border font-mono text-sm overflow-auto"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.75' }}
              dangerouslySetInnerHTML={{ __html: gerarHTML() }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={revisar} disabled={!carregado || !texto.trim()} size="lg" className="px-12">
          Revisar Texto
        </Button>
      </div>
    </div>
  );
}
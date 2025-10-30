// src/pages/CalculadoraEditorial.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Copy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CalculadoraEditorial: React.FC = () => {
  const [tamanhoLivro, setTamanhoLivro] = useState<'16x23' | '14x21'>('16x23');
  const [numCaracteres, setNumCaracteres] = useState<string>('0');
  const [numImagensPequenas, setNumImagensPequenas] = useState<string>('0');
  const [numImagensMedias, setNumImagensMedias] = useState<string>('0');
  const [numImagensGrandes, setNumImagensGrandes] = useState<string>('0');
  const [numCapitulos, setNumCapitulos] = useState<string>('0');
  const [numAberturasParte, setNumAberturasParte] = useState<string>('0');
  const [numSubtitulos, setNumSubtitulos] = useState<string>('0');
  const [totalPaginas, setTotalPaginas] = useState<number>(0);
  const { toast } = useToast();

  const formatarNumero = (valor: string): string => {
    const numero = parseInt(valor.replace(/\D/g, '')) || 0;
    return numero.toLocaleString('pt-BR');
  };

  const handleInputChange = (
    valor: string,
    setState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    setState(apenasNumeros ? formatarNumero(apenasNumeros) : '0');
  };

  const calcularPaginas = () => {
    let paginasCalculadas = 0;
    const caracteresPorPagina = tamanhoLivro === '16x23' ? 1500 : 1000;
    paginasCalculadas += Math.ceil(
      (parseInt(numCaracteres.replace(/\D/g, '')) || 0) / caracteresPorPagina
    );
    paginasCalculadas += (parseInt(numImagensPequenas.replace(/\D/g, '')) || 0) * (1 / 3);
    paginasCalculadas += (parseInt(numImagensMedias.replace(/\D/g, '')) || 0) * (1 / 2);
    paginasCalculadas += parseInt(numjikagensGrandes.replace(/\D/g, '')) || 0;
    paginasCalculadas += (parseInt(numCapitulos.replace(/\D/g, '')) || 0) * 2;
    paginasCalculadas += (parseInt(numAberturasParte.replace(/\D/g, '')) || 0) * 2;
    paginasCalculadas += (parseInt(numSubtitulos.replace(/\D/g, '')) || 0) * (1 / 10);

    let paginasFinais = Math.ceil(paginasCalculadas);
    if (paginasFinais % 8 !== 0) {
      paginasFinais = paginasFinais + (8 - (paginasFinais % 8));
    }
    paginasFinais = Math.max(paginasFinais, 16);
    paginasFinais += 16;
    if (paginasFinais % 8 !== 0) {
      paginasFinais = paginasFinais + (8 - (paginasFinais % 8));
    }
    setTotalPaginas(paginasFinais);
  };

  const copiarInformacoes = () => {
    const texto = `
Tamanho do Livro: ${tamanhoLivro} (${tamanhoLivro === '16x23' ? '1500' : '1000'} caracteres/página)
Número de Caracteres: ${numCaracteres}
Total de Páginas Estimadas: ${totalPaginas.toLocaleString('pt-BR')}
    `.trim();
    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado!",
      description: "Informações copiadas para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calculadora Editorial</h1>
          <p className="text-muted-foreground">Calcule o número de páginas com base no conteúdo do livro</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Configurações do Livro
                </CardTitle>
                <CardDescription>
                  Preencha os campos abaixo para calcular o total de páginas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tamanho do Livro */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      Tamanho do Livro
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </label>
                    <Select value={tamanhoLivro} onValueChange={(v) => setTamanhoLivro(v as '16x23' | '14x21')}>
                      <SelectTrigger className="input-editorial">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16x23">16x23 (1500 caracteres/página)</SelectItem>
                        <SelectItem value="14x21">14x21 (1000 caracteres/página)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número de Caracteres */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Número de Caracteres</label>
                    <Input
                      type="text"
                      value={numCaracteres}
                      onChange={(e) => handleInputChange(e.target.value, setNumCaracteres)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Imagens Pequenas */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Imagens Pequenas (1/3 página)
                    </label>
                    <Input
                      type="text"
                      value={numImagensPequenas}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensPequenas)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Imagens Médias */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Imagens Médias (1/2 página)
                    </label>
                    <Input
                      type="text"
                      value={numImagensMedias}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensMedias)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Imagens Grandes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Imagens Grandes (1 página)
                    </label>
                    <Input
                      type="text"
                      value={numImagensGrandes}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensGrandes)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Capítulos */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Número de Capítulos (2 páginas cada)
                    </label>
                    <Input
                      type="text"
                      value={numCapitulos}
                      onChange={(e) => handleInputChange(e.target.value, setNumCapitulos)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Aberturas de Parte */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Aberturas de Parte (2 páginas cada)
                    </label>
                    <Input
                      type="text"
                      value={numAberturasParte}
                      onChange={(e) => handleInputChange(e.target.value, setNumAberturasParte)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>

                  {/* Subtítulos */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Subtítulos (1/10 página cada)
                    </label>
                    <Input
                      type="text"
                      value={numSubtitulos}
                      onChange={(e) => handleInputChange(e.target.value, setNumSubtitulos)}
                      placeholder="0"
                      className="input-editorial"
                    />
                  </div>
                </div>

                <Button
                  onClick={calcularPaginas}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Calcular Páginas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="space-y-6">
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>Total de páginas estimadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-sm text-muted-foreground">Tamanho do Livro</span>
                    <span className="font-medium">
                      {tamanhoLivro} ({tamanhoLivro === '16x23' ? '1500' : '1000'} car./pág.)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-sm text-muted-foreground">Caracteres</span>
                    <span className="font-medium">{numCaracteres}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-primary/5 rounded-lg px-4">
                    <span className="text-lg font-semibold text-foreground">Total de Páginas</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPaginas.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={copiarInformacoes}
                  variant="outline"
                  className="w-full"
                  disabled={totalPaginas === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Informações
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Observações:</strong><br />
                  • Mínimo de 16 páginas + 16 de miolo<br />
                  • Arredondamento para múltiplos de 8<br />
                  • Inclui capa, sumário e referências
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraEditorial;
import React, { useState } from 'react';

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
    paginasCalculadas += parseInt(numImagensGrandes.replace(/\D/g, '')) || 0;
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
    alert('Informações copiadas para a área de transferência!');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl w-full">
        {/* Formulário à esquerda */}
        <div className="flex flex-col gap-[10px] bg-white p-10 rounded-[25px] transition-all duration-400 ease-in-out shadow-[1px_2px_2px_rgba(0,0,0,0.4)] hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] hover:border hover:border-[#171717] hover:shadow-[10px_10px_0px_#666666] w-full md:w-1/2">
          <h2 className="text-black pb-8 text-center font-bold text-2xl">Calculadora Editorial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho do Livro:</label>
                <select
                  value={tamanhoLivro}
                  onChange={(e) => setTamanhoLivro(e.target.value as '16x23' | '14x21')}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                >
                  <option value="16x23">16x23 (1500 caracteres/página)</option>
                  <option value="14x21">14x21 (1000 caracteres/página)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Caracteres:</label>
                <input
                  type="text"
                  value={numCaracteres}
                  onChange={(e) => handleInputChange(e.target.value, setNumCaracteres)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagens Pequenas (1/3 de página):</label>
                <input
                  type="text"
                  value={numImagensPequenas}
                  onChange={(e) => handleInputChange(e.target.value, setNumImagensPequenas)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagens Médias (1/2 de página):</label>
                <input
                  type="text"
                  value={numImagensMedias}
                  onChange={(e) => handleInputChange(e.target.value, setNumImagensMedias)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagens Grandes (Página inteira):</label>
                <input
                  type="text"
                  value={numImagensGrandes}
                  onChange={(e) => handleInputChange(e.target.value, setNumImagensGrandes)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Capítulos (2 páginas/capítulo):</label>
                <input
                  type="text"
                  value={numCapitulos}
                  onChange={(e) => handleInputChange(e.target.value, setNumCapitulos)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Aberturas de Parte (2 páginas/abertura):</label>
                <input
                  type="text"
                  value={numAberturasParte}
                  onChange={(e) => handleInputChange(e.target.value, setNumAberturasParte)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Subtítulos (1/10 de página/subtítulo):</label>
                <input
                  type="text"
                  value={numSubtitulos}
                  onChange={(e) => handleInputChange(e.target.value, setNumSubtitulos)}
                  className="rounded-[5px] border border-[whitesmoke] bg-[whitesmoke] outline-none p-[0.7em] transition-all duration-400 ease-in-out hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] focus:bg-white focus:shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] w-full text-black"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calcularPaginas}
            className="mt-8 self-center px-4 py-[0.7em] rounded-[10px] border-none text-black transition-all duration-400 ease-in-out shadow-[1px_1px_1px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] active:translate-x-0 active:translate-y-0 active:shadow-none bg-black text-white hover:bg-[#ffb319]"
          >
            Calcular Páginas
          </button>
        </div>

        {/* Cards à direita */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <div className="bg-white p-6 rounded-[15px] shadow-[1px_2px_2px_rgba(0,0,0,0.4)] transition-all duration-400 ease-in-out hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] hover:border hover:border-[#171717] hover:shadow-[10px_10px_0px_#666666]">
            <h3 className="text-lg font-semibold text-black">Tamanho do Livro</h3>
            <p className="text-black">{tamanhoLivro} ({tamanhoLivro === '16x23' ? '1500' : '1000'} caracteres/página)</p>
          </div>

          <div className="bg-white p-6 rounded-[15px] shadow-[1px_2px_2px_rgba(0,0,0,0.4)] transition-all duration-400 ease-in-out hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] hover:border hover:border-[#171717] hover:shadow-[10px_10px_0px_#666666]">
            <h3 className="text-lg font-semibold text-black">Número de Caracteres</h3>
            <p className="text-black">{numCaracteres}</p>
          </div>

          <div className="bg-white p-6 rounded-[15px] shadow-[1px_2px_2px_rgba(0,0,0,0.4)] transition-all duration-400 ease-in-out hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] hover:border hover:border-[#171717] hover:shadow-[10px_10px_0px_#666666]">
            <h3 className="text-lg font-semibold text-black">Total de Páginas Estimadas</h3>
            <p className="text-black">{totalPaginas.toLocaleString('pt-BR')}</p>
          </div>

          <button
            onClick={copiarInformacoes}
            className="mt-4 px-4 py-[0.7em] rounded-[10px] border-none text-black transition-all duration-400 ease-in-out shadow-[1px_1px_1px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0px_#969696,-3px_-3px_10px_#ffffff] hover:-translate-x-[0.5em] hover:-translate-y-[0.5em] active:translate-x-0 active:translate-y-0 active:shadow-none bg-black text-white hover:bg-[#ffb319]"
          >
            Copiar Informações
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraEditorial;
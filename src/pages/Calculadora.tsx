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
    alert('Informações copiadas!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-500">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 bg-black-transparent bg-clip-text">
          Calculadora Editorial
        </h1>
        
        {/* Formulário e Resultados em abas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Entrada */}
          <div className="lg:col-span-2 space-y-6 bg-gray-50 p-6 rounded-2xl shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  label: 'Tamanho do Livro',
                  element: (
                    <select
                      value={tamanhoLivro}
                      onChange={(e) => setTamanhoLivro(e.target.value as '16x23' | '14x21')}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                    >
                      <option value="16x23">16x23 (1500 caracteres/página)</option>
                      <option value="14x21">14x21 (1000 caracteres/página)</option>
                    </select>
                  ),
                },
                {
                  label: 'Número de Caracteres',
                  element: (
                    <input
                      type="text"
                      value={numCaracteres}
                      onChange={(e) => handleInputChange(e.target.value, setNumCaracteres)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Imagens Pequenas (1/3)',
                  element: (
                    <input
                      type="text"
                      value={numImagensPequenas}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensPequenas)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Imagens Médias (1/2)',
                  element: (
                    <input
                      type="text"
                      value={numImagensMedias}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensMedias)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Imagens Grandes (100%)',
                  element: (
                    <input
                      type="text"
                      value={numImagensGrandes}
                      onChange={(e) => handleInputChange(e.target.value, setNumImagensGrandes)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Número de Capítulos (2 p)',
                  element: (
                    <input
                      type="text"
                      value={numCapitulos}
                      onChange={(e) => handleInputChange(e.target.value, setNumCapitulos)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Número de Aberturas de Parte (2 p)',
                  element: (
                    <input
                      type="text"
                      value={numAberturasParte}
                      onChange={(e) => handleInputChange(e.target.value, setNumAberturasParte)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
                {
                  label: 'Número de Subtítulos (1/10)',
                  element: (
                    <input
                      type="text"
                      value={numSubtitulos}
                      onChange={(e) => handleInputChange(e.target.value, setNumSubtitulos)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
                      placeholder="0"
                    />
                  ),
                },
              ].map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{field.label}</label>
                  {field.element}
                </div>
              ))}
            </div>
            <button
              onClick={calcularPaginas}
              className="w-full bg-amber-500 text-white p-3 rounded-xl font-semibold hover:bg-amber-600 hover:scale-105 active:scale-100 transition-all duration-300"
            >
              Calcular Páginas
            </button>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-amber-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tamanho do Livro</h3>
              <p className="text-gray-600">{tamanhoLivro} ({tamanhoLivro === '16x23' ? '1500' : '1000'} caracteres/página)</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Número de Caracteres</h3>
              <p className="text-gray-600">{numCaracteres}</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Páginas Estimadas</h3>
              <p className="text-2xl font-bold text-amber-600">{totalPaginas.toLocaleString('pt-BR')}</p>
            </div>
            <button
              onClick={copiarInformacoes}
              className="w-full bg-amber-500 text-white p-3 rounded-xl font-semibold hover:bg-amber-600 hover:scale-105 active:scale-100 transition-all duration-300"
            >
              Copiar Informações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraEditorial;
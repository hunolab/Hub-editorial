// src/pages/Calculadora.tsx ou src/components/ui/Calculadora.tsx
import React, { useState } from 'react';

const CalculadoraEditorial: React.FC = () => {
  const [tamanhoLivro, setTamanhoLivro] = useState<'16x23' | '14x21'>('16x23');
  const [numCaracteres, setNumCaracteres] = useState<number>(0);
  const [numImagensPequenas, setNumImagensPequenas] = useState<number>(0);
  const [numImagensMedias, setNumImagensMedias] = useState<number>(0);
  const [numImagensGrandes, setNumImagensGrandes] = useState<number>(0);
  const [numCapitulos, setNumCapitulos] = useState<number>(0);
  const [numAberturasParte, setNumAberturasParte] = useState<number>(0);
  const [numSubtitulos, setNumSubtitulos] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(0);

  const calcularPaginas = () => {
    let paginasCalculadas = 0;

    // Páginas baseadas em caracteres
    const caracteresPorPagina = tamanhoLivro === '16x23' ? 1500 : 1000;
    paginasCalculadas += Math.ceil(numCaracteres / caracteresPorPagina);

    // Imagens
    paginasCalculadas += numImagensPequenas * (1 / 3);
    paginasCalculadas += numImagensMedias * (1 / 2);
    paginasCalculadas += numImagensGrandes * 1;

    // Capítulos
    paginasCalculadas += numCapitulos * 2;

    // Abertura de Parte (2 páginas por abertura + 2 páginas por capítulo relacionado a essa parte)
    // Assumindo que cada Abertura de Parte *também* adiciona 2 páginas além dos capítulos que ela contém
    // Se for 2 páginas POR CAPÍTULO, e se cada abertura de parte contiver N capítulos, então:
    // Para simplificar, vou considerar 2 páginas por abertura de parte, independentemente dos capítulos nela,
    // e os capítulos são contados à parte. Se "Acrescenta 2 paginas por capitulo, então se tem 2 capitulos tem que colocar mais duas paginas mais abertura de parte + 2 ou seja 4 paginas a mais"
    // significa que cada abertura de parte custa 2 páginas E cada capítulo dentro dela custa mais 2.
    // Vamos usar a interpretação de 2 páginas por "Abertura de Parte" + 2 páginas adicionais POR CAPÍTULO relacionado à abertura.
    // Isso se torna um pouco complexo sem a estrutura exata de como Aberturas de Parte e Capítulos se relacionam hierarquicamente.
    // Vou assumir que "numAberturasParte" já considera o total de aberturas de partes distintas, e os capitulos são contagem total de capitulos no livro.
    paginasCalculadas += numAberturasParte * 2; // Páginas pela abertura da parte em si

    // Subtítulos
    paginasCalculadas += numSubtitulos * (1 / 10);

    // Arredondar para o próximo múltiplo de 8
    let paginasFinais = Math.ceil(paginasCalculadas);
    if (paginasFinais % 8 !== 0) {
      paginasFinais = paginasFinais + (8 - (paginasFinais % 8));
    }

    // Garantia de 16+ páginas
    paginasFinais = Math.max(paginasFinais, 16); // Se a calculadora resultar em menos de 16, força para 16. A garantia é "16+ páginas a mais", o que é um pouco ambíguo. Vou interpretar como "mínimo de 16 páginas extras".
    // Se você quer dizer "total + 16", então:
    // paginasFinais += 16;
    // E depois re-arredondar para o próximo múltiplo de 8, se necessário.
    // Por clareza, vou usar a interpretação de que o *resultado final* deve ter pelo menos 16 páginas, e o "a mais por garantia" significa um "colchão" que pode ser já incorporado ao total.
    // Se for um colchão de 16 páginas adicionais ao final, independentemente de tudo:
    paginasFinais += 16;
    if (paginasFinais % 8 !== 0) {
        paginasFinais = paginasFinais + (8 - (paginasFinais % 8));
    }


    setTotalPaginas(paginasFinais);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calculadora Editorial</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Tamanho do Livro:</label>
        <select
          value={tamanhoLivro}
          onChange={(e) => setTamanhoLivro(e.target.value as '16x23' | '14x21')}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="16x23">16x23 (1500 caracteres/página)</option>
          <option value="14x21">14x21 (1000 caracteres/página)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Número de Caracteres:</label>
        <input
          type="number"
          value={numCaracteres}
          onChange={(e) => setNumCaracteres(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Imagens Pequenas (1/3 de página):</label>
        <input
          type="number"
          value={numImagensPequenas}
          onChange={(e) => setNumImagensPequenas(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Imagens Médias (1/2 de página):</label>
        <input
          type="number"
          value={numImagensMedias}
          onChange={(e) => setNumImagensMedias(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Imagens Grandes (Página inteira):</label>
        <input
          type="number"
          value={numImagensGrandes}
          onChange={(e) => setNumImagensGrandes(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Número de Capítulos (2 páginas/capítulo):</label>
        <input
          type="number"
          value={numCapitulos}
          onChange={(e) => setNumCapitulos(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Número de Aberturas de Parte (2 páginas/abertura):</label>
        <input
          type="number"
          value={numAberturasParte}
          onChange={(e) => setNumAberturasParte(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Número de Subtítulos (1/10 de página/subtítulo):</label>
        <input
          type="number"
          value={numSubtitulos}
          onChange={(e) => setNumSubtitulos(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          min="0"
        />
      </div>


      <button
        onClick={calcularPaginas}
        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Calcular Páginas
      </button>

      {totalPaginas > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h3 className="text-xl font-semibold">Total de Páginas Estimadas: {totalPaginas}</h3>
        </div>
      )}
    </div>
  );
};

export default CalculadoraEditorial;
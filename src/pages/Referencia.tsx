import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

interface MaterialType {
  label: string;
  value: string;
  disabled?: boolean;
}

interface ReferenceStyle {
  label: string;
  value: string;
  title: string;
  external?: boolean;
}

interface ReferenceFields {
  [key: string]: string;
}

const materialTypes: MaterialType[] = [
  { label: "Livro", value: "book" },
  { label: "Capítulo de Livro", value: "book-chapter" },
  { label: "Artigo de Periódico", value: "article-or-section-of-periodical" },
  { label: "Monografia Acadêmica", value: "entire-monograph-academic" },
  { label: "Legislação", value: "legislation" },
  { label: "Website", value: "website" },
  { label: "Filme", value: "movies-and-videos" },
  { label: "Patente", value: "patent" },
  { label: "Software", value: "software" },
  { label: "Documento Cartográfico", value: "cartographic-document" },
  { label: "Documento Sonoro", value: "entire-sound-document" },
];

const referenceStyles: ReferenceStyle[] = [
  { label: "ABNT", value: "abnt", title: "Associação Brasileira de Normas Técnicas - NBR 6023:2018 e NBR 10520:2023" },
  { label: "Vancouver", value: "vancouver", title: "Estilo Vancouver" },
  { label: "NLM", value: "nlm", title: "National Library of Medicine" },
  { label: "MLA 8", value: "mla8", title: "Modern Language Association" },
  { label: "APA 7th", value: "apa7", title: "American Psychological Association 7th edition" },
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
  "entire-monograph-academic": {
    required: ["autor", "titulo", "tipo", "instituicao", "cidade", "ano"],
    optional: ["subtitulo", "orientador", "url"],
  },
  legislation: {
    required: ["jurisdicao", "tipo_legislacao", "numero", "data"],
    optional: ["titulo", "url"],
  },
  website: {
    required: ["autor", "titulo_pagina", "nome_site", "ano", "url"],
    optional: ["data_acesso"],
  },
  "movies-and-videos": {
    required: ["titulo", "diretor", "produtora", "ano", "formato"],
    optional: ["cidade", "url"],
  },
  patent: {
    required: ["inventor", "titulo", "numero_patente", "pais", "ano"],
    optional: ["data_emissao", "url"],
  },
  software: {
    required: ["autor", "titulo", "versao", "ano"],
    optional: ["cidade", "url"],
  },
  "cartographic-document": {
    required: ["autor", "titulo", "tipo", "cidade", "editora", "ano"],
    optional: ["escala", "url"],
  },
  "entire-sound-document": {
    required: ["autor", "titulo", "produtora", "ano", "formato"],
    optional: ["cidade", "url"],
  },
};

// Função para formatar nomes de autores conforme o estilo
const formatAuthorName = (author: string, style: string): string => {
  if (!author) return "";
  const authors = author.split(";").map((a) => a.trim());
  if (style === "abnt") {
    return authors
      .map((a) => {
        const [surname, name] = a.split(",").map((s) => s.trim());
        if (!surname || !name) return "";
        const initial = name.charAt(0).toUpperCase() + ".";
        return `${surname.toUpperCase()}, ${initial}`;
      })
      .filter((a) => a)
      .join("; ");
  } else if (style === "apa7") {
    return authors
      .map((a) => {
        const [surname, name] = a.split(",").map((s) => s.trim());
        if (!surname || !name) return "";
        const initial = name.charAt(0).toUpperCase() + ".";
        return `${surname}, ${initial}`;
      })
      .filter((a) => a)
      .join(", ");
  } else if (style === "vancouver" || style === "nlm") {
    return authors
      .map((a) => {
        const [surname, name] = a.split(",").map((s) => s.trim());
        if (!surname || !name) return "";
        const initial = name.charAt(0).toUpperCase();
        return `${surname} ${initial}`;
      })
      .filter((a) => a)
      .join(", ");
  } else if (style === "mla8") {
    return authors
      .map((a, index) => {
        const [surname, name] = a.split(",").map((s) => s.trim());
        if (!surname || !name) return "";
        if (index === 0) {
          return `${surname}, ${name}`;
        }
        return `${name} ${surname}`;
      })
      .filter((a) => a)
      .join(", ");
  }
  return author;
};

const formatReference = (fields: ReferenceFields, style: ReferenceStyle, type: MaterialType): string => {
  const { value: styleValue } = style;
  const { value: typeValue } = type;
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  switch (typeValue) {
    case "book":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo}. ${fields.cidade}: ${fields.editora}, ${fields.ano}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo}*. ${fields.editora}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo}. ${fields.cidade}: ${fields.editora}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo}. ${fields.cidade}: ${fields.editora}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. *${fields.titulo}*. ${fields.editora}, ${fields.ano}.`;
      break;
    case "book-chapter":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor_capitulo, "abnt")}. ${fields.titulo_capitulo}. In: ${formatAuthorName(fields.autor_livro, "abnt")}. ${fields.titulo_livro}. ${fields.cidade}: ${fields.editora}, ${fields.ano}. p. ${fields.paginas}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor_capitulo, "apa7")}. (${fields.ano}). ${fields.titulo_capitulo}. In ${formatAuthorName(fields.autor_livro, "apa7")} (Ed.), *${fields.titulo_livro}* (pp. ${fields.paginas}). ${fields.editora}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor_capitulo, "vancouver")}. ${fields.titulo_capitulo}. In: ${formatAuthorName(fields.autor_livro, "vancouver")}, editor. ${fields.titulo_livro}. ${fields.cidade}: ${fields.editora}; ${fields.ano}. p. ${fields.paginas}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor_capitulo, "nlm")}. ${fields.titulo_capitulo}. In: ${formatAuthorName(fields.autor_livro, "nlm")}, editor. ${fields.titulo_livro}. ${fields.cidade}: ${fields.editora}; ${fields.ano}. p. ${fields.paginas}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor_capitulo, "mla8")}. “${fields.titulo_capitulo}.” *${fields.titulo_livro}*, edited by ${formatAuthorName(fields.autor_livro, "mla8")}, ${fields.editora}, ${fields.ano}, pp. ${fields.paginas}.`;
      break;
    case "article-or-section-of-periodical":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo_artigo}. ${fields.titulo_periodico}, ${fields.cidade}, v. ${fields.volume}, n. ${fields.numero}, p. ${fields.paginas}, ${fields.ano}. ${fields.doi ? `DOI: ${fields.doi}` : ""}`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). ${fields.titulo_artigo}. *${fields.titulo_periodico}, ${fields.volume}*(${fields.numero}), ${fields.paginas}. ${fields.doi ? `https://doi.org/${fields.doi}` : ""}`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo_artigo}. ${fields.titulo_periodico}. ${fields.ano};${fields.volume}(${fields.numero}):${fields.paginas}. ${fields.doi ? `doi: ${fields.doi}.` : ""}`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo_artigo}. ${fields.titulo_periodico}. ${fields.ano};${fields.volume}(${fields.numero}):${fields.paginas}. ${fields.doi ? `doi: ${fields.doi}.` : ""}`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. “${fields.titulo_artigo}.” *${fields.titulo_periodico}*, vol. ${fields.volume}, no. ${fields.numero}, ${fields.ano}, pp. ${fields.paginas}, ${fields.doi ? `doi:${fields.doi}.` : ""}`;
      break;
    case "entire-monograph-academic":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo}. ${fields.ano}. ${fields.paginas} f. ${fields.tipo} – ${fields.instituicao}, ${fields.cidade}, ${fields.ano}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo}* (${fields.tipo.toLowerCase()}, ${fields.instituicao}). ${fields.url || ""}`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo} [${fields.tipo.toLowerCase()}]. ${fields.cidade}: ${fields.instituicao}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo} [${fields.tipo.toLowerCase()}]. ${fields.cidade}: ${fields.instituicao}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. *${fields.titulo}*. ${fields.ano}, ${fields.instituicao}, ${fields.tipo}, ${fields.url || ""}.`;
      break;
    case "legislation":
      if (styleValue === "abnt") return `${fields.jurisdicao.toUpperCase()}. ${fields.tipo_legislacao} nº ${fields.numero}, de ${fields.data}. ${fields.titulo || ""} Diário Oficial da União, ${fields.cidade}, ${fields.data}.`;
      if (styleValue === "apa7") return `${fields.jurisdicao}. (${fields.ano}). *${fields.tipo_legislacao} nº ${fields.numero}, ${fields.titulo || ""}* Diário Oficial da União. ${fields.url || ""}`;
      if (styleValue === "vancouver") return `${fields.jurisdicao}. ${fields.tipo_legislacao} nº ${fields.numero}, ${fields.titulo || ""} Diário Oficial da União. ${fields.data}.`;
      if (styleValue === "nlm") return `${fields.jurisdicao}. ${fields.tipo_legislacao} nº ${fields.numero}, ${fields.titulo || ""} ${fields.cidade}: Diário Oficial da União; ${fields.ano}.`;
      if (styleValue === "mla8") return `${fields.jurisdicao}. *${fields.tipo_legislacao} Nº ${fields.numero}, ${fields.titulo || ""}* Diário Oficial da União, ${fields.data}, ${fields.url || ""}.`;
      break;
    case "website":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo_pagina}. ${fields.nome_site}, ${fields.ano}. Disponível em: ${fields.url}. Acesso em: ${fields.data_acesso || currentDate}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo_pagina}*. ${fields.nome_site}. ${fields.url}`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo_pagina} [Internet]. ${fields.nome_site}; ${fields.ano} [acesso em ${fields.data_acesso || currentDate}]. Disponível em: ${fields.url}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo_pagina} [Internet]. ${fields.nome_site}; ${fields.ano} [cited ${fields.data_acesso || currentDate}]. Available from: ${fields.url}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. “${fields.titulo_pagina}.” *${fields.nome_site}*, ${fields.ano}, ${fields.url}.`;
      break;
    case "movies-and-videos":
      if (styleValue === "abnt") return `${formatAuthorName(fields.diretor, "abnt")} (Diretor). ${fields.titulo}. ${fields.produtora}, ${fields.ano}. ${fields.formato}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.diretor, "apa7")} (Director). (${fields.ano}). *${fields.titulo}* [Film]. ${fields.produtora}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.diretor, "vancouver")}, director. ${fields.titulo} [${fields.formato}]. ${fields.produtora}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.diretor, "nlm")}, director. ${fields.titulo} [film]. ${fields.produtora}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.diretor, "mla8")}, director. *${fields.titulo}*. ${fields.produtora}, ${fields.ano}.`;
      break;
    case "patent":
      if (styleValue === "abnt") return `${formatAuthorName(fields.inventor, "abnt")}. ${fields.titulo}. Patente ${fields.numero_patente}. ${fields.pais}, ${fields.ano}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.inventor, "apa7")}. (${fields.ano}). ${fields.titulo} (Patent No. ${fields.numero_patente}). ${fields.pais}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.inventor, "vancouver")}. ${fields.titulo}. Patent ${fields.numero_patente}. ${fields.pais}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.inventor, "nlm")}. ${fields.titulo}. Patent ${fields.numero_patente}. ${fields.pais}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.inventor, "mla8")}. *${fields.titulo}*. Patent ${fields.numero_patente}, ${fields.ano}.`;
      break;
    case "software":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo}. Versão ${fields.versao}. ${fields.ano}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo}* (Version ${fields.versao}) [Computer software]. ${fields.url || ""}`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo}. Version ${fields.versao}. ${fields.ano}. ${fields.url ? `Available from: ${fields.url}.` : ""}`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo}. Version ${fields.versao} [software]. ${fields.ano} ${fields.url ? `[cited ${currentDate}]. Available from: ${fields.url}.` : ""}`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. *${fields.titulo}*. Version ${fields.versao}, ${fields.ano}, ${fields.url || ""}.`;
      break;
    case "cartographic-document":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo}. ${fields.tipo}. ${fields.cidade}: ${fields.editora}, ${fields.ano}. ${fields.escala ? `Escala ${fields.escala}.` : ""}`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo}* [${fields.tipo}]. ${fields.editora}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo}. ${fields.cidade}: ${fields.editora}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo} [${fields.tipo}]. ${fields.cidade}: ${fields.editora}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. *${fields.titulo}*. ${fields.editora}, ${fields.ano}.`;
      break;
    case "entire-sound-document":
      if (styleValue === "abnt") return `${formatAuthorName(fields.autor, "abnt")}. ${fields.titulo}. ${fields.produtora}, ${fields.ano}. ${fields.formato}.`;
      if (styleValue === "apa7") return `${formatAuthorName(fields.autor, "apa7")}. (${fields.ano}). *${fields.titulo}* [Album]. ${fields.produtora}.`;
      if (styleValue === "vancouver") return `${formatAuthorName(fields.autor, "vancouver")}. ${fields.titulo} [${fields.formato}]. ${fields.produtora}; ${fields.ano}.`;
      if (styleValue === "nlm") return `${formatAuthorName(fields.autor, "nlm")}. ${fields.titulo} [album]. ${fields.produtora}; ${fields.ano}.`;
      if (styleValue === "mla8") return `${formatAuthorName(fields.autor, "mla8")}. *${fields.titulo}*. ${fields.produtora}, ${fields.ano}.`;
      break;
    default:
      return "Tipo de material não suportado.";
  }
  return "Estilo de referência não suportado.";
};

const Referencia: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MaterialType | null>(null);
  const [filtered, setFiltered] = useState<MaterialType[]>([]);
  const [style, setStyle] = useState<ReferenceStyle>(referenceStyles[0]);
  const [fields, setFields] = useState<ReferenceFields>({});
  const [formattedReference, setFormattedReference] = useState("");
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    const f = materialTypes.filter((m) =>
      m.label.toLowerCase().includes(value.toLowerCase())
    );
    setFiltered(f);
  };

  const handleSelect = (item: MaterialType) => {
    setSelected(item);
    setQuery(item.label);
    setFiltered([]);
    setFields({});
    setFormattedReference("");
  };

  const handleFieldChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const validateAuthorFormat = (author: string): boolean => {
    if (!author) return false;
    const authors = author.split(";").map((a) => a.trim());
    return authors.every((a) => {
      const parts = a.split(",").map((s) => s.trim());
      return parts.length === 2 && parts[0] && parts[1];
    });
  };

  const handleFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de material antes de formatar!",
        variant: "destructive",
      });
      return;
    }

    const requiredFields = fieldDefinitions[selected.value]?.required || [];
    const missingFields = requiredFields.filter((field) => !fields[field]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Preencha todos os campos obrigatórios: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validar formato dos campos de autor
    const authorFields = ["autor", "autor_capitulo", "autor_livro", "diretor", "inventor"];
    for (const field of authorFields) {
      if (fields[field] && !validateAuthorFormat(fields[field])) {
        toast({
          title: "Erro",
          description: `O campo ${field} deve estar no formato "Sobrenome, Prenome" (ex.: "Silva, Marcos; Ferreira, Roberto")`,
          variant: "destructive",
        });
        return;
      }
    }

    if (style.value === "apa7" && style.external) {
      window.open("https://cleverbib.com/pt-br/ref/apa7", "_blank");
      return;
    }

    const formatted = formatReference(fields, style, selected);
    setFormattedReference(formatted);

    toast({
      title: "Formatação concluída",
      description: `Referência formatada para ${selected.label} (${selected.value}) no estilo ${style.label}.`,
    });
  };

  const handleCopy = async () => {
    if (!formattedReference) return;

    try {
      await navigator.clipboard.writeText(formattedReference);
      toast({
        title: "Copiado!",
        description: "Referência formatada copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a referência. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocx = async () => {
    if (!formattedReference) return;

    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formattedReference,
                  size: 24,
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `referencia-${selected!.value}-${style.value}.docx`;
      saveAs(blob, fileName);

      toast({
        title: "Download iniciado",
        description: `Arquivo DOCX "${fileName}" está sendo baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar DOCX",
        description: "Não foi possível gerar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-soft-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="card-editorial w-full">
          <CardHeader>
            <CardTitle className="heading-lg text-foreground">
              Formatador de Referência Bibliográfica
            </CardTitle>
            <p className="body-md text-muted-foreground">
              Selecione o estilo, tipo de material, preencha os campos e formate.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estilo de Referência */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estilo de referência*
              </label>
              <Select
                value={style.value}
                onValueChange={(value) => {
                  const selectedStyle = referenceStyles.find((s) => s.value === value);
                  if (selectedStyle) setStyle(selectedStyle);
                }}
              >
                <SelectTrigger className="input-editorial w-full mt-2">
                  <SelectValue placeholder="Selecione um estilo" />
                </SelectTrigger>
                <SelectContent>
                  {referenceStyles.map((s) => (
                    <SelectItem key={s.value} value={s.value} title={s.title}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Material */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de material*
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="typeInput"
                  type="text"
                  value={query}
                  onChange={handleChange}
                  placeholder="Digite o tipo de material"
                  className="pl-9 input-editorial w-full"
                  aria-label="Buscar tipo de material"
                />
              </div>
              {filtered.length > 0 && (
                <Card className="mt-2 max-h-60 overflow-y-auto border border-muted">
                  <ul className="space-y-1 p-2">
                    {filtered.map((item) => (
                      <li
                        key={item.value}
                        className="p-2 rounded-md hover:bg-muted/20 transition-colors cursor-pointer text-foreground text-sm"
                        onClick={() => handleSelect(item)}
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Campos Dinâmicos */}
            {selected && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Campos da referência*
                </label>
                {fieldDefinitions[selected.value]?.required.map((field) => (
                  <div key={field}>
                    <label className="text-sm text-muted-foreground">
                      {field.replace(/_/g, " ")}*
                    </label>
                    <Input
                      value={fields[field] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={
                        field.includes("autor") || field === "diretor" || field === "inventor"
                          ? "Ex.: Silva, Marcos; Ferreira, Roberto"
                          : `Digite ${field.replace(/_/g, " ")}`
                      }
                      className="input-editorial w-full mt-1"
                      aria-label={`Campo ${field.replace(/_/g, " ")}`}
                    />
                  </div>
                ))}
                {fieldDefinitions[selected.value]?.optional.map((field) => (
                  <div key={field}>
                    <label className="text-sm text-muted-foreground">
                      {field.replace(/_/g, " ")}
                    </label>
                    <Input
                      value={fields[field] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={
                        field.includes("autor") || field === "diretor" || field === "inventor"
                          ? "Ex.: Silva, Marcos; Ferreira, Roberto (opcional)"
                          : `Digite ${field.replace(/_/g, " ")} (opcional)`
                      }
                      className="input-editorial w-full mt-1"
                      aria-label={`Campo ${field.replace(/_/g, " ")} (opcional)`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Botão de Formatar */}
            <Button
              onClick={handleFormat}
              disabled={!selected || !fieldDefinitions[selected?.value]?.required.every((f) => fields[f]?.trim())}
              className="w-full sm:w-auto"
            >
              Formatar
            </Button>

            {/* Referência Formatada */}
            {formattedReference && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Referência formatada
                  </label>
                  <Textarea
                    value={formattedReference}
                    readOnly
                    className="textarea-editorial w-full mt-2 bg-muted/20"
                    rows={4}
                    aria-label="Referência formatada"
                  />
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button
                    onClick={handleCopy}
                    disabled={!formattedReference}
                    className="w-full sm:w-auto"
                    variant="outline"
                    aria-label="Copiar referência formatada"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    onClick={handleDownloadDocx}
                    disabled={!formattedReference}
                    className="w-full sm:w-auto"
                    variant="outline"
                    aria-label="Baixar referência como DOCX"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar DOCX
                  </Button>
                </div>
              </div>
            )}

            {/* Feedback de Seleção */}
            {selected && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo selecionado
                  </label>
                  <Badge className="mt-1" variant="outline">
                    {selected.label} ({selected.value})
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estilo selecionado
                  </label>
                  <Badge className="mt-1" variant="outline">
                    {style.label}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referencia;
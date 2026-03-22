/**
 * pdf-extractor.ts
 * Port de worker/app/pipeline/pdf_reader.py + text_cleaner.py
 * Extrai e limpa texto de PDFs usando pdf-parse (sem API externa).
 */

import pdfParse from "pdf-parse";

// ─── Limpeza de encoding ──────────────────────────────────────────────────
const ENCODING_FIXES: [RegExp, string][] = [
  [/Ã£/g, "ã"],
  [/Ã¢/g, "â"],
  [/Ã /g, "à"],
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ãª/g, "ê"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ã´/g, "ô"],
  [/Ãº/g, "ú"],
  [/Ã§/g, "ç"],
  [/Ã\u0083/g, "Ã"],
  [/Ã\u0082/g, "Â"],
  [/â€œ/g, '"'],
  [/â€/g, '"'],
  [/â€™/g, "'"],
  [/â€"/g, "–"],
  [/â€"/g, "—"],
  [/\u00a0/g, " "], // non-breaking space
];

function fixEncoding(text: string): string {
  let result = text;
  for (const [pattern, replacement] of ENCODING_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── Remoção de cabeçalhos/rodapés repetidos ─────────────────────────────
function removeRepeatedHeadersFooters(pages: string[]): string[] {
  if (pages.length < 3) return pages;

  // Pega as 3 primeiras linhas de cada página para detectar cabeçalho
  const firstLines = pages.map((p) =>
    p
      .split("\n")
      .slice(0, 3)
      .join(" ")
      .trim()
      .slice(0, 80)
  );
  const lastLines = pages.map((p) =>
    p
      .split("\n")
      .slice(-3)
      .join(" ")
      .trim()
      .slice(0, 80)
  );

  // Se uma linha aparece em mais de 60% das páginas, é cabeçalho/rodapé
  const threshold = Math.ceil(pages.length * 0.6);

  const headerCandidates = new Map<string, number>();
  const footerCandidates = new Map<string, number>();

  for (const line of firstLines) {
    if (line.length > 5) {
      headerCandidates.set(line, (headerCandidates.get(line) ?? 0) + 1);
    }
  }
  for (const line of lastLines) {
    if (line.length > 5) {
      footerCandidates.set(line, (footerCandidates.get(line) ?? 0) + 1);
    }
  }

  const repeatedHeaders = new Set(
    [...headerCandidates.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([line]) => line)
  );
  const repeatedFooters = new Set(
    [...footerCandidates.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([line]) => line)
  );

  return pages.map((page) => {
    const lines = page.split("\n");
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      return !repeatedHeaders.has(trimmed.slice(0, 80)) &&
        !repeatedFooters.has(trimmed.slice(0, 80));
    });
    return filtered.join("\n");
  });
}

// ─── Normalização de espaços ──────────────────────────────────────────────
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")          // múltiplos espaços/tabs → um espaço
    .replace(/\n{3,}/g, "\n\n")       // mais de 2 quebras → 2
    .trim();
}

// ─── Validação de tipo via magic bytes ───────────────────────────────────
export function isPdfBuffer(buffer: Buffer): boolean {
  // PDF começa com %PDF-
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  );
}

// ─── Extração principal ───────────────────────────────────────────────────
export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  charsPerPage: number;
}

export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  if (!isPdfBuffer(buffer)) {
    throw new Error("Arquivo inválido: não é um PDF (magic bytes incorretos)");
  }

  const data = await pdfParse(buffer);
  const pageCount = data.numpages;

  // Divide por página para limpeza de cabeçalhos/rodapés
  // pdf-parse não separa por página nativamente — usamos o texto completo
  const rawText = data.text;

  // Aplicar pipeline de limpeza
  let text = fixEncoding(rawText);
  text = normalizeWhitespace(text);

  const charsPerPage = pageCount > 0 ? Math.floor(text.length / pageCount) : 0;

  // Se menos de 80 chars/página, o PDF provavelmente é scaneado (imagem)
  // Neste caso retornamos o texto que temos (sem OCR — futura melhoria)
  return { text, pageCount, charsPerPage };
}

// ─── Hash SHA-256 para deduplicação ──────────────────────────────────────
export async function sha256Hex(buffer: Buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

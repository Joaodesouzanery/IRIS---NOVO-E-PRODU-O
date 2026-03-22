/**
 * classifier.ts
 * Port exato de worker/app/pipeline/classifier.py
 * Classifica microtema e pauta interna por keywords determinísticas.
 */

// ─── Dicionário de microtemas ─────────────────────────────────────────────
const MICROTEMA_KEYWORDS: Record<string, string[]> = {
  tarifa: [
    "tarifa", "reajuste tarifário", "revisão tarifária", "reajuste de tarifa",
    "reequilíbrio tarifário", "reequilibrio tarifario", "preço público",
    "taxa de pedágio", "pedágio", "tarifa de pedágio",
  ],
  obras: [
    "obra", "obras", "construção", "reforma", "ampliação", "duplicação",
    "pavimentação", "infraestrutura viária", "melhorias", "investimento em obra",
    "projeto executivo", "prazo de obra",
  ],
  multa: [
    "multa", "penalidade", "infração", "autuação", "auto de infração",
    "penalização", "sanção", "aplicação de multa", "recurso de multa",
  ],
  contrato: [
    "contrato", "concessão", "aditivo", "aditamento", "termo aditivo",
    "prorrogação de contrato", "rescisão", "subconcessão", "subconcessionária",
  ],
  reequilibrio: [
    "reequilíbrio econômico", "reequilibrio economico", "equilíbrio econômico-financeiro",
    "desequilíbrio", "fato imprevisível", "caso fortuito", "força maior",
    "revisão extraordinária",
  ],
  fiscalizacao: [
    "fiscalização", "vistoria", "inspeção", "auditoria", "relatório de fiscalização",
    "irregularidade", "notificação", "descumprimento", "inadimplemento",
  ],
  seguranca: [
    "segurança", "acidente", "risco", "sinalização", "capacete", "cinto",
    "segurança viária", "condições de tráfego", "manutenção preventiva",
  ],
  ambiental: [
    "ambiental", "meio ambiente", "licença ambiental", "impacto ambiental",
    "compensação ambiental", "fauna", "flora", "sustentabilidade",
    "programa ambiental",
  ],
  desapropriacao: [
    "desapropriação", "desapropriacao", "indenização", "faixa de domínio",
    "servidão administrativa", "área afetada", "proprietário",
  ],
  usuario: [
    "usuário", "reclamação", "ouvidoria", "manifestação", "atendimento ao usuário",
    "queixa", "satisfação", "central de atendimento", "call center",
  ],
};

// ─── Classificação de microtema ───────────────────────────────────────────
export interface ClassificationResult {
  microtema: string;
  confidence: number;
}

export function classifyMicrotema(text: string): ClassificationResult {
  const textLower = text.toLowerCase();
  const scores = new Map<string, number>();

  for (const [tema, keywords] of Object.entries(MICROTEMA_KEYWORDS)) {
    let matches = 0;
    for (const kw of keywords) {
      // Word-boundary equivalente: verifica presença da keyword
      if (textLower.includes(kw.toLowerCase())) {
        matches++;
      }
    }
    if (matches > 0) {
      scores.set(tema, matches);
    }
  }

  if (scores.size === 0) {
    return { microtema: "outros", confidence: 0 };
  }

  const totalMatches = [...scores.values()].reduce((a, b) => a + b, 0);
  const [[bestTema, bestScore]] = [...scores.entries()].sort((a, b) => b[1] - a[1]);

  return {
    microtema: bestTema,
    confidence: bestScore / totalMatches,
  };
}

// ─── Classificação de pauta interna ──────────────────────────────────────
const PAUTA_INTERNA_KEYWORDS = [
  "pauta interna",
  "expediente interno",
  "assunto administrativo",
  "remuneração de diretores",
  "recursos humanos",
  "contratação de pessoal",
  "orçamento interno",
  "regimento interno",
  "resolução interna",
];

export function classifyPautaInterna(text: string): boolean {
  const textLower = text.toLowerCase();
  return PAUTA_INTERNA_KEYWORDS.some((kw) => textLower.includes(kw));
}

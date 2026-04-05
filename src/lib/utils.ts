import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function getMicrotemaLabel(microtema: string): string {
  const labels: Record<string, string> = {
    tarifa: "Tarifa",
    obras: "Obras",
    multa: "Multa",
    contrato: "Contrato",
    reequilibrio: "Reequilíbrio",
    fiscalizacao: "Fiscalização",
    seguranca: "Segurança",
    ambiental: "Ambiental",
    desapropriacao: "Desapropriação",
    adimplencia: "Adimplência",
    pessoal: "Pessoal",
    usuario: "Usuário",
    outros: "Outros",
  };
  return labels[microtema] ?? microtema;
}

export function getMicrotemaColor(microtema: string): string {
  const colors: Record<string, string> = {
    tarifa:         "#f97316", // brand orange — mantido
    obras:          "#60a5fa", // blue-400
    multa:          "#f87171", // red-400
    contrato:       "#a78bfa", // violet-400
    reequilibrio:   "#22d3ee", // cyan-400
    fiscalizacao:   "#34d399", // emerald-400
    seguranca:      "#fbbf24", // amber-400
    ambiental:      "#4ade80", // green-400
    desapropriacao: "#f472b6", // pink-400
    adimplencia:    "#38bdf8", // sky-400
    pessoal:        "#c084fc", // purple-400
    usuario:        "#818cf8", // indigo-400
    outros:         "#71717a", // zinc-500
  };
  return colors[microtema] ?? "#71717a";
}

export const CATEGORIAS_REGULATORIAS = [
  { id: "economico-financeiro",    label: "Econômico-Financeiro",      microtemas: ["tarifa", "reequilibrio"] as string[] },
  { id: "contratos-concessoes",    label: "Contratos e Concessões",    microtemas: ["contrato", "obras"] as string[] },
  { id: "controle-sancoes",        label: "Controle e Sanções",        microtemas: ["multa", "fiscalizacao", "adimplencia"] as string[] },
  { id: "seguranca-ambiente",      label: "Segurança e Ambiente",      microtemas: ["seguranca", "ambiental"] as string[] },
  { id: "usuarios-administrativo", label: "Usuários e Administrativo", microtemas: ["usuario", "desapropriacao", "pessoal", "outros"] as string[] },
];

export function getMicrotemaCategoria(microtema: string): string {
  return CATEGORIAS_REGULATORIAS.find((c) => c.microtemas.includes(microtema))?.id
    ?? "usuarios-administrativo";
}

export function getMicrotemaCategoriaLabel(microtema: string): string {
  return CATEGORIAS_REGULATORIAS.find((c) => c.microtemas.includes(microtema))?.label
    ?? "Usuários e Administrativo";
}

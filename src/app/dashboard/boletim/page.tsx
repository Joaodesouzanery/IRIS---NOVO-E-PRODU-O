"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DashboardOverview, MicrotemaStats, DiretorOverviewItem,
  Deliberacao, DeliberacaoPaginada, Agencia, BoletimSchedule, EmpresaStats,
} from "@/types";
import { getMicrotemaLabel, formatNumber, cn } from "@/lib/utils";
import {
  Mail, Copy, Printer, Plus, Trash2, CheckCircle,
  Calendar, Bell, FileText, Users, Tag, Building2, ShieldCheck,
  AlignLeft, Loader2, X,
} from "lucide-react";
import { ModuleTabs } from "@/components/ui/ModuleTabs";
import { CONFIG_TABS } from "@/lib/module-tabs";

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const PERIODOS = [
  { label: "Última semana",    value: "7d" },
  { label: "Último mês",      value: "30d" },
  { label: "Último trimestre",value: "90d" },
];

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: Section[] = [
  { id: "kpis",         label: "KPIs Principais",           icon: ShieldCheck },
  { id: "recentes",     label: "Deliberações Recentes",      icon: FileText },
  { id: "setores",      label: "Setores Mais Afetados",      icon: Tag },
  { id: "diretores",    label: "Diretores em Destaque",      icon: Users },
  { id: "empresas",     label: "Empresas Reguladas (Top 5)", icon: Building2 },
  { id: "consenso",     label: "Análise de Consenso",        icon: AlignLeft },
  { id: "governanca",   label: "Taxa de Governança",         icon: ShieldCheck },
];

// ── Newsletter HTML builder ────────────────────────────────────────────────

// Shared inline styles (light theme — maximum email client compatibility)
const S = {
  body:    "margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif",
  wrapper: "background:#f0f0f0;padding:24px 0",
  card:    "background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;padding:0",
  section: "padding:20px 28px;border-bottom:1px solid #f4f4f5",
  h2:      "margin:0 0 14px;font-size:11px;color:#f97316;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1.5px;font-weight:700",
  label:   "margin:0;font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px",
  value:   "margin:4px 0 0;font-size:22px;font-weight:700;color:#111111;font-family:Arial,Helvetica,sans-serif",
  muted:   "color:#71717a",
  text:    "font-size:12px;color:#374151",
};

function resultBadge(resultado: string | null) {
  if (!resultado) return `<span style="font-size:11px;color:#71717a">—</span>`;
  const isPos = resultado.toLowerCase().includes("deferido") && !resultado.toLowerCase().includes("inde");
  const color = isPos ? "#16a34a" : resultado.toLowerCase().includes("indeferido") ? "#dc2626" : "#d97706";
  const bg    = isPos ? "#f0fdf4" : resultado.toLowerCase().includes("indeferido") ? "#fef2f2" : "#fffbeb";
  return `<span style="display:inline-block;padding:1px 7px;border-radius:4px;font-size:11px;font-weight:600;color:${color};background:${bg};border:1px solid ${color}30">${resultado}</span>`;
}

function buildHtml(opts: {
  selectedSections: string[];
  periodo: string;
  overview: DashboardOverview | undefined;
  microtemas: MicrotemaStats[] | undefined;
  diretores: DiretorOverviewItem[] | undefined;
  deliberacoes: Deliberacao[];
  empresas: EmpresaStats[] | undefined;
  agencia: string;
}) {
  const { selectedSections: sel, periodo, overview, microtemas, diretores, deliberacoes, empresas, agencia } = opts;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const ag = agencia || "Todas as Agências";

  const sec = (id: string) => sel.includes(id);

  // ── Section: KPIs ──────────────────────────────────────────────────────────
  const kpisHtml = sec("kpis") && overview ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">KPIs Principais</p>
      <table width="100%" cellpadding="0" cellspacing="4"><tr>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:25%">
          <p style="${S.label}">Total</p>
          <p style="${S.value}">${formatNumber(overview.total_deliberacoes)}</p>
        </td>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;text-align:center;width:25%">
          <p style="${S.label}">Deferidos</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#16a34a;font-family:Arial,Helvetica,sans-serif">${formatNumber(overview.deferidos)}</p>
        </td>
        <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:12px;text-align:center;width:25%">
          <p style="${S.label}">Taxa Def.</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#f97316;font-family:Arial,Helvetica,sans-serif">${overview.taxa_deferimento}%</p>
        </td>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:25%">
          <p style="${S.label}">Reuniões</p>
          <p style="${S.value}">${formatNumber(overview.reunioes_unicas)}</p>
        </td>
      </tr></table>
    </td></tr>` : "";

  // ── Section: Deliberações Recentes ────────────────────────────────────────
  const recentesHtml = sec("recentes") && deliberacoes.length ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Deliberações Recentes</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${deliberacoes.slice(0, 5).map((d) => {
          const assunto = (d as any).assunto ?? (d as any).resumo_pleito ?? d.microtema ?? "";
          return `
        <tr><td style="padding:10px 0;border-bottom:1px solid #f4f4f5">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0;font-size:13px;color:#111111;font-weight:600">${d.numero_deliberacao ?? "—"} &mdash; ${d.interessado ?? "Sem interessado"}</p>
              <p style="margin:3px 0 0;font-size:12px;color:#6b7280">${assunto}</p>
            </td>
            <td align="right" style="vertical-align:top;padding-left:12px;white-space:nowrap">
              ${resultBadge(d.resultado ?? null)}
            </td>
          </tr></table>
        </td></tr>`;
        }).join("")}
      </table>
    </td></tr>` : "";

  // ── Section: Setores Mais Afetados ────────────────────────────────────────
  const setoresHtml = sec("setores") && microtemas?.length ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Setores Mais Afetados</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <th style="text-align:left;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Microtema</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Total</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">% Deferido</th>
        </tr>
        ${[...(microtemas ?? [])].sort((a,b) => b.total - a.total).slice(0, 6).map((m) => `
        <tr>
          <td style="padding:7px 0;font-size:12px;color:#374151;border-bottom:1px solid #f9fafb">${getMicrotemaLabel(m.microtema)}</td>
          <td style="padding:7px 0;font-size:12px;color:#111111;font-weight:700;text-align:right;border-bottom:1px solid #f9fafb">${formatNumber(m.total)}</td>
          <td style="padding:7px 0;font-size:12px;color:#16a34a;font-weight:600;text-align:right;border-bottom:1px solid #f9fafb">${m.pct_deferido.toFixed(0)}%</td>
        </tr>`).join("")}
      </table>
    </td></tr>` : "";

  // ── Section: Diretores em Destaque ────────────────────────────────────────
  const diretoresHtml = sec("diretores") && diretores?.length ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Diretores em Destaque</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <th style="text-align:left;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Diretor(a)</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Votos</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">% Favorável</th>
        </tr>
        ${diretores.slice(0, 5).map((d) => `
        <tr>
          <td style="padding:7px 0;font-size:12px;color:#374151;border-bottom:1px solid #f9fafb">${d.diretor_nome}</td>
          <td style="padding:7px 0;font-size:12px;color:#111111;font-weight:700;text-align:right;border-bottom:1px solid #f9fafb">${formatNumber(d.total)}</td>
          <td style="padding:7px 0;font-size:12px;color:#16a34a;font-weight:600;text-align:right;border-bottom:1px solid #f9fafb">${d.pct_favor.toFixed(0)}%</td>
        </tr>`).join("")}
      </table>
    </td></tr>` : "";

  // ── Section: Empresas Reguladas ───────────────────────────────────────────
  const empresasHtml = sec("empresas") && empresas?.length ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Empresas Reguladas — Top 5</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <th style="text-align:left;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Empresa</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">Deliberações</th>
          <th style="text-align:right;font-size:10px;color:#9ca3af;font-weight:600;padding-bottom:8px;border-bottom:1px solid #f4f4f5">% Deferido</th>
        </tr>
        ${[...empresas].sort((a,b) => b.total_deliberacoes - a.total_deliberacoes).slice(0, 5).map((e) => `
        <tr>
          <td style="padding:7px 0;font-size:12px;color:#374151;border-bottom:1px solid #f9fafb">${e.nome.length > 40 ? e.nome.slice(0, 38) + "…" : e.nome}</td>
          <td style="padding:7px 0;font-size:12px;color:#111111;font-weight:700;text-align:right;border-bottom:1px solid #f9fafb">${formatNumber(e.total_deliberacoes)}</td>
          <td style="padding:7px 0;font-size:12px;color:#16a34a;font-weight:600;text-align:right;border-bottom:1px solid #f9fafb">${e.pct_deferido.toFixed(0)}%</td>
        </tr>`).join("")}
      </table>
    </td></tr>` : "";

  // ── Section: Análise de Consenso ──────────────────────────────────────────
  const consensoHtml = sec("consenso") && diretores?.length ? (() => {
    const avgFavor = diretores.reduce((s, d) => s + d.pct_favor, 0) / Math.max(1, diretores.length);
    const totalVotos = diretores.reduce((s, d) => s + d.total, 0);
    const divCount = diretores.filter((d) => d.divergente > 0).length;
    return `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Análise de Consenso</p>
      <table width="100%" cellpadding="0" cellspacing="4"><tr>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:33%">
          <p style="${S.label}">Média Favorável</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#16a34a;font-family:Arial,Helvetica,sans-serif">${avgFavor.toFixed(1)}%</p>
        </td>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:33%">
          <p style="${S.label}">Total Votos</p>
          <p style="${S.value}">${formatNumber(totalVotos)}</p>
        </td>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:33%">
          <p style="${S.label}">Com divergência</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:${divCount > 0 ? "#d97706" : "#16a34a"};font-family:Arial,Helvetica,sans-serif">${divCount} dir.</p>
        </td>
      </tr></table>
    </td></tr>`;
  })() : "";

  // ── Section: Taxa de Governança ───────────────────────────────────────────
  const governancaHtml = sec("governanca") && overview ? `
    <tr><td style="${S.section}">
      <p style="${S.h2}">Taxa de Governança</p>
      <table width="100%" cellpadding="0" cellspacing="4"><tr>
        <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:12px;text-align:center;width:50%">
          <p style="${S.label}">Taxa de Deferimento</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f97316;font-family:Arial,Helvetica,sans-serif">${overview.taxa_deferimento}%</p>
        </td>
        <td style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:6px;padding:12px;text-align:center;width:50%">
          <p style="${S.label}">Confiança IA</p>
          <p style="${S.value}">${overview.avg_confidence ? (overview.avg_confidence * 100).toFixed(0) + "%" : "—"}</p>
        </td>
      </tr></table>
    </td></tr>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boletim IRIS Regulação</title>
</head>
<body style="${S.body}">
<table width="100%" cellpadding="0" cellspacing="0" style="${S.wrapper}">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="${S.card}">

  <!-- Header -->
  <tr><td style="background:#f97316;padding:22px 28px;border-radius:8px 8px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif">IRIS Regulação</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,Helvetica,sans-serif">Boletim Regulatório · ${ag}</p>
      </td>
      <td align="right">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.8);font-family:Arial,Helvetica,sans-serif">${today}</p>
        <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.8);font-family:Arial,Helvetica,sans-serif">${PERIODOS.find(p => p.value === periodo)?.label ?? periodo}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- Sections -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${kpisHtml}
      ${recentesHtml}
      ${setoresHtml}
      ${diretoresHtml}
      ${empresasHtml}
      ${consensoHtml}
      ${governancaHtml}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e4e4e7;border-radius:0 0 8px 8px">
    <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;font-family:Arial,Helvetica,sans-serif">
      Gerado automaticamente pelo IRIS Regulação &middot; ${today}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function BoletimPage() {
  const queryClient = useQueryClient();

  // Builder state
  const [selectedSections, setSelectedSections] = useState<string[]>(["kpis", "recentes", "setores"]);
  const [periodo, setPeriodo]                   = useState("30d");
  const [agenciaId, setAgenciaId]               = useState("");
  const [copied, setCopied]                     = useState(false);

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedFreq, setSchedFreq]               = useState<BoletimSchedule["frequencia"]>("semanal");
  const [schedDiaSemana, setSchedDiaSemana]     = useState<number>(1);
  const [schedDiaMes, setSchedDiaMes]           = useState<number>(1);
  const [schedEmailInput, setSchedEmailInput]   = useState("");
  const [schedEmails, setSchedEmails]           = useState<string[]>([]);
  const [schedEmailError, setSchedEmailError]   = useState("");

  const previewRef = useRef<HTMLDivElement>(null);

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });
  const { data: overview } = useQuery({
    queryKey: ["dashboard", "overview", agenciaId],
    queryFn: () => api.get<DashboardOverview>(`/dashboard/overview${agenciaId ? `?agencia_id=${agenciaId}` : ""}`),
  });
  const { data: microtemas } = useQuery({
    queryKey: ["dashboard", "microtemas", agenciaId],
    queryFn: () => api.get<MicrotemaStats[]>(`/dashboard/microtemas${agenciaId ? `?agencia_id=${agenciaId}` : ""}`),
  });
  const { data: diretores } = useQuery({
    queryKey: ["dashboard", "diretores-overview", agenciaId],
    queryFn: () => api.get<DiretorOverviewItem[]>(`/dashboard/diretores/overview${agenciaId ? `?agencia_id=${agenciaId}` : ""}`),
  });
  const { data: deliberacoesPag } = useQuery({
    queryKey: ["deliberacoes-boletim", agenciaId],
    queryFn: () => api.get<DeliberacaoPaginada>(`/deliberacoes?limit=10${agenciaId ? `&agencia_id=${agenciaId}` : ""}`),
  });
  const deliberacoes: Deliberacao[] = deliberacoesPag?.data ?? [];

  const { data: empresas } = useQuery({
    queryKey: ["empresas", agenciaId],
    queryFn: () => api.get<EmpresaStats[]>(`/empresas${agenciaId ? `?agencia_id=${agenciaId}` : ""}`),
  });

  const { data: schedulesData, isLoading: loadSchedules } = useQuery({
    queryKey: ["boletim", "schedules"],
    queryFn: () => api.get<{ schedules: BoletimSchedule[] }>("/boletim/schedule"),
  });
  const schedules = schedulesData?.schedules ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boletim/schedule?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boletim", "schedules"] }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Partial<BoletimSchedule>) =>
      api.post<{ schedule: BoletimSchedule }>("/boletim/schedule", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boletim", "schedules"] });
      setShowScheduleForm(false);
      setSchedEmails([]);
      setSchedEmailInput("");
    },
  });

  // ── Derived HTML ──────────────────────────────────────────────────────────

  const html = buildHtml({
    selectedSections, periodo, overview, microtemas, diretores, deliberacoes, empresas,
    agencia: (agencias ?? []).find((a) => a.id === agenciaId)?.sigla ?? "",
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  function toggleSection(id: string) {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  }

  function openEmail() {
    const plain = [
      "Boletim IRIS Regulação",
      "=".repeat(40),
      overview ? `Total: ${overview.total_deliberacoes} deliberações | Taxa deferimento: ${overview.taxa_deferimento}%` : "",
      "",
      deliberacoes.slice(0, 5).map((d) => `• ${d.numero_deliberacao ?? "?"} — ${d.interessado ?? "—"}`).join("\n"),
    ].join("\n");
    window.location.href = `mailto:?subject=Boletim%20IRIS%20Regulação&body=${encodeURIComponent(plain)}`;
  }

  function printPreview() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  }

  // ── Schedule form ─────────────────────────────────────────────────────────

  function addEmail() {
    const e = schedEmailInput.trim();
    if (!EMAIL_RE.test(e)) { setSchedEmailError("E-mail inválido"); return; }
    if (schedEmails.includes(e)) { setSchedEmailError("E-mail já adicionado"); return; }
    setSchedEmails((prev) => [...prev, e]);
    setSchedEmailInput("");
    setSchedEmailError("");
  }

  function nextSendDate(freq: BoletimSchedule["frequencia"], diaSemana: number, diaMes: number) {
    const d = new Date();
    if (freq === "semanal") {
      const diff = (diaSemana - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (freq === "quinzenal") {
      d.setDate(d.getDate() + 14);
    } else if (freq === "mensal") {
      d.setMonth(d.getMonth() + 1, diaMes);
    } else {
      d.setDate(d.getDate() + 7);
    }
    return d.toISOString();
  }

  function submitSchedule() {
    if (!schedEmails.length) { setSchedEmailError("Adicione ao menos um destinatário"); return; }
    createMutation.mutate({
      frequencia:    schedFreq,
      dia_semana:    schedFreq === "semanal" ? (schedDiaSemana as 0|1|2|3|4|5|6) : undefined,
      dia_mes:       schedFreq === "mensal"  ? schedDiaMes    : undefined,
      proximo_envio: nextSendDate(schedFreq, schedDiaSemana, schedDiaMes),
      destinatarios: schedEmails,
      secoes:        selectedSections,
      agencia_id:    agenciaId || null,
      ativo:         true,
    });
  }

  const FREQ_LABELS: Record<BoletimSchedule["frequencia"], string> = {
    semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", personalizado: "Personalizado",
  };
  const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleTabs tabs={CONFIG_TABS} />
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Boletim Regulatório</h1>
          <p className="text-sm text-text-muted mt-1">Crie e agende boletins com os dados que desejar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input text-sm h-9 py-0" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)}>
            <option value="">Todas as agências</option>
            {(agencias ?? []).map((a) => <option key={a.id} value={a.id}>{a.sigla}</option>)}
          </select>
          <select className="input text-sm h-9 py-0" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ── Builder Panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card">
            <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-3">
              Seções do Boletim
            </p>
            <div className="space-y-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = selectedSections.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors border",
                      active ? "bg-brand/10 border-brand/30" : "border-transparent hover:bg-bg-hover"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSection(s.id)}
                      className="w-4 h-4 accent-brand"
                    />
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-brand" : "text-text-muted")} />
                    <span className={cn("text-sm", active ? "text-text-primary" : "text-text-secondary")}>
                      {s.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="card space-y-2">
            <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Exportar</p>
            <button onClick={copyHtml} className={cn("btn-secondary w-full flex items-center justify-center gap-2", copied && "text-success")}>
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "HTML copiado!" : "Copiar HTML"}
            </button>
            <button onClick={openEmail} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Abrir no Email
            </button>
            <button onClick={printPreview} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Baixar / Imprimir
            </button>
          </div>
        </div>

        {/* ── Preview Panel ──────────────────────────────────────────────── */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-hover">
            <p className="text-xs text-text-muted font-mono uppercase tracking-wider">Preview do Boletim</p>
            <span className="text-xs text-text-label font-mono">{selectedSections.length} seção(ões) selecionada(s)</span>
          </div>
          <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
            <iframe
              srcDoc={html}
              className="w-full border-0"
              style={{ height: "65vh", minHeight: 400 }}
              title="preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* ── Schedule Section ───────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand" />
            <p className="text-sm font-medium text-text-secondary">Agendamentos</p>
          </div>
          <button
            onClick={() => setShowScheduleForm((v) => !v)}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo agendamento
          </button>
        </div>

        {/* Schedule Form */}
        {showScheduleForm && (
          <div className="border border-border/60 rounded-lg p-4 space-y-4 bg-bg-hover">
            <p className="text-xs text-text-muted font-mono uppercase tracking-wider">Novo Agendamento</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-label font-mono uppercase tracking-wider">Frequência</label>
                <select className="input" value={schedFreq} onChange={(e) => setSchedFreq(e.target.value as BoletimSchedule["frequencia"])}>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
              {schedFreq === "semanal" && (
                <div className="space-y-1">
                  <label className="text-xs text-text-label font-mono uppercase tracking-wider">Dia da Semana</label>
                  <select className="input" value={schedDiaSemana} onChange={(e) => setSchedDiaSemana(+e.target.value)}>
                    {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {schedFreq === "mensal" && (
                <div className="space-y-1">
                  <label className="text-xs text-text-label font-mono uppercase tracking-wider">Dia do Mês</label>
                  <select className="input" value={schedDiaMes} onChange={(e) => setSchedDiaMes(+e.target.value)}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Destinatários</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={schedEmailInput}
                  onChange={(e) => { setSchedEmailInput(e.target.value); setSchedEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addEmail()}
                />
                <button onClick={addEmail} className="btn-secondary px-3">Adicionar</button>
              </div>
              {schedEmailError && <p className="text-xs text-error">{schedEmailError}</p>}
              <div className="flex flex-wrap gap-1.5">
                {schedEmails.map((e) => (
                  <span key={e} className="badge badge-gray flex items-center gap-1 text-xs">
                    {e}
                    <button onClick={() => setSchedEmails((prev) => prev.filter((x) => x !== e))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowScheduleForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={submitSchedule}
                disabled={createMutation.isPending}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar agendamento
              </button>
            </div>
          </div>
        )}

        {/* Schedules list */}
        {loadSchedules ? (
          <p className="text-sm text-text-muted">Carregando agendamentos...</p>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum agendamento criado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-bg-hover transition-colors">
                <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{FREQ_LABELS[s.frequencia]}</p>
                  <p className="text-xs text-text-muted truncate">
                    Próximo: {new Date(s.proximo_envio).toLocaleDateString("pt-BR")} · {s.destinatarios.join(", ")} · {s.secoes.length} seção(ões)
                  </p>
                </div>
                <span className={cn("badge text-xs", s.ativo ? "badge-green" : "badge-gray")}>
                  {s.ativo ? "Ativo" : "Inativo"}
                </span>
                <button
                  onClick={() => deleteMutation.mutate(s.id)}
                  disabled={deleteMutation.isPending}
                  className="w-7 h-7 flex items-center justify-center rounded text-text-label hover:text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

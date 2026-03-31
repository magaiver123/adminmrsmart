"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useStore } from "@/components/admin/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock3,
  ListFilter,
  Printer,
  RefreshCcw,
  Save,
  TestTube2,
  XCircle,
} from "lucide-react";
import {
  fetchStorePrintJobs,
  fetchStoreTotemPrinters,
  saveTotemPrinterConfig,
  triggerStoreTestPrint,
} from "@/src/services/printingStore.service";

type PrinterBrand = "Epson" | "Bematech";
type TotemPrimaryStatus = "printed" | "failed" | "in_progress" | "no_history";
type StatusFilter = "all" | TotemPrimaryStatus;

type TotemPrinter = {
  id: string;
  totem_id: string;
  ip: string;
  port: number;
  brand: string | null;
  model: string;
  escpos_profile: string;
  paper_width_mm: number;
  is_active: boolean;
  last_heartbeat_at: string | null;
  last_status: string | null;
  last_error: string | null;
  agent_version: string | null;
};

type TotemWithPrinter = {
  id: string;
  name: string | null;
  status: "active" | "inactive";
  device_id: string | null;
  maintenance_mode: boolean;
  health_status?: string;
  pending_jobs?: number;
  failed_jobs?: number;
  printer: TotemPrinter | null;
};

type PrintJob = {
  id: string;
  totem_id: string;
  order_id: string;
  status: string;
  attempts: number;
  created_at: string;
  printed_at: string | null;
  last_error: string | null;
};

type Defaults = {
  default_port: number;
  default_escpos_profile: string;
  default_paper_width_mm: number;
};

type Draft = {
  ip: string;
  port: string;
  brand: PrinterBrand | "";
  model: string;
  escpos_profile: string;
  paper_width_mm: "58" | "76" | "80" | "82";
  is_active: boolean;
};

const BRAND_OPTIONS: PrinterBrand[] = ["Bematech", "Epson"];

const MODELS_BY_BRAND: Record<PrinterBrand, string[]> = {
  Bematech: ["MP-4200 TH", "MP-2800 TH", "MP-2500 TH", "MP-4000 TH"],
  Epson: ["TM-T20III", "TM-T88VI", "TM-m30II", "EU-m30"],
};

function parseDateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "nunca";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "nunca";
  return date.toLocaleString("pt-BR");
}

function truncateText(value: string, maxLength = 140): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function createEmptyDraft(defaults: Defaults): Draft {
  return {
    ip: "",
    port: String(defaults.default_port || 9100),
    brand: "",
    model: "",
    escpos_profile: defaults.default_escpos_profile || "generic",
    paper_width_mm: String(defaults.default_paper_width_mm || 80) as Draft["paper_width_mm"],
    is_active: true,
  };
}

function inferBrandFromModel(model: string | null | undefined): PrinterBrand | "" {
  const normalized = (model || "").trim().toUpperCase();
  if (!normalized) return "";

  for (const brand of BRAND_OPTIONS) {
    const hasMatch = MODELS_BY_BRAND[brand].some((entry) => {
      const normalizedEntry = entry.toUpperCase();
      return normalized === normalizedEntry || normalized.includes(normalizedEntry);
    });
    if (hasMatch) return brand;
  }

  if (normalized.includes("TM-") || normalized.includes("EU-M30")) return "Epson";
  if (normalized.includes("MP-")) return "Bematech";
  return "";
}

function resolveBrand(
  rawBrand: string | null | undefined,
  model: string | null | undefined
): Draft["brand"] {
  if (rawBrand === "Epson" || rawBrand === "Bematech") return rawBrand;
  return inferBrandFromModel(model);
}

function toDraft(totem: TotemWithPrinter, defaults: Defaults): Draft {
  const printer = totem.printer;
  if (!printer) {
    return createEmptyDraft(defaults);
  }

  return {
    ip: printer.ip || "",
    port: String(printer.port || defaults.default_port || 9100),
    brand: resolveBrand(printer.brand, printer.model),
    model: printer.model || "",
    escpos_profile: printer.escpos_profile || defaults.default_escpos_profile || "generic",
    paper_width_mm: String(
      printer.paper_width_mm || defaults.default_paper_width_mm || 80
    ) as Draft["paper_width_mm"],
    is_active: printer.is_active !== false,
  };
}

function jobStatusBadge(status: string) {
  if (status === "printed") return <Badge className="bg-green-600">Impresso</Badge>;
  if (status === "pending") return <Badge variant="secondary">Pendente</Badge>;
  if (status === "claimed") return <Badge className="bg-blue-600">Em andamento</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">{status || "Desconhecido"}</Badge>;
}


function getTotemPrimaryStatus(recentJobs: PrintJob[]): TotemPrimaryStatus {
  if (recentJobs.length === 0) return "no_history";

  const latest = recentJobs[0];
  if (latest.status === "pending" || latest.status === "claimed") {
    return "in_progress";
  }
  if (latest.status === "printed") return "printed";
  if (latest.status === "failed") return "failed";

  const latestConcluded = recentJobs.find(
    (job) => job.status === "printed" || job.status === "failed"
  );

  if (latestConcluded?.status === "printed") return "printed";
  if (latestConcluded?.status === "failed") return "failed";

  return "no_history";
}

function toFilterLabel(statusFilter: StatusFilter): string {
  if (statusFilter === "all") return "Todos";
  if (statusFilter === "printed") return "Impresso";
  if (statusFilter === "failed") return "Falhou";
  if (statusFilter === "in_progress") return "Em andamento";
  return "Sem histórico";
}

function primaryStatusBadge(status: TotemPrimaryStatus) {
  if (status === "printed") {
    return (
      <Badge className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Última impressão ok
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3.5 w-3.5" />
        Última impressão falhou
      </Badge>
    );
  }

  if (status === "in_progress") {
    return (
      <Badge className="gap-1 bg-blue-600">
        <Clock3 className="h-3.5 w-3.5" />
        Impressão em andamento
      </Badge>
    );
  }

  return <Badge variant="outline">Sem histórico de impressão</Badge>;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function ImpressorasPage() {
  const { store } = useStore();
  const activeStoreId = store?.id ?? null;
  const [totems, setTotems] = useState<TotemWithPrinter[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [defaults, setDefaults] = useState<Defaults>({
    default_port: 9100,
    default_escpos_profile: "generic",
    default_paper_width_mm: 80,
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [savingByTotem, setSavingByTotem] = useState<Record<string, boolean>>({});
  const [testingByTotem, setTestingByTotem] = useState<Record<string, boolean>>({});
  const [showAllJobsByTotem, setShowAllJobsByTotem] = useState<Record<string, boolean>>({});
  const [expandedTotemErrorById, setExpandedTotemErrorById] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedJobErrorById, setExpandedJobErrorById] = useState<Record<string, boolean>>({});

  async function loadData(activeStoreId: string) {
    const [printerData, jobData] = await Promise.all([
      fetchStoreTotemPrinters(activeStoreId),
      fetchStorePrintJobs(activeStoreId, 40),
    ]);

    const loadedTotems = Array.isArray(printerData?.totems)
      ? (printerData.totems as TotemWithPrinter[])
      : [];
    const loadedJobs = Array.isArray(jobData?.jobs) ? (jobData.jobs as PrintJob[]) : [];
    const loadedDefaults = (printerData?.defaults as Defaults) || defaults;

    setDefaults(loadedDefaults);
    setTotems(loadedTotems);
    setJobs(loadedJobs);

    const nextDrafts: Record<string, Draft> = {};
    for (const totem of loadedTotems) {
      nextDrafts[totem.id] = toDraft(totem, loadedDefaults);
    }
    setDrafts(nextDrafts);

    return { totems: loadedTotems, jobs: loadedJobs };
  }

  async function refreshData(activeStoreId: string) {
    try {
      await loadData(activeStoreId);
    } catch (error: any) {
      setFeedback({
        type: "error",
        text: error?.message || "Erro ao carregar o módulo de impressoras.",
      });
    }
  }

  useEffect(() => {
    if (!activeStoreId) return;
    startTransition(async () => {
      await refreshData(activeStoreId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId]);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = setTimeout(() => {
      setFeedback(null);
    }, 7000);

    return () => clearTimeout(timeoutId);
  }, [feedback]);

  const jobsByTotem = useMemo(() => {
    const buckets = new Map<string, PrintJob[]>();
    for (const job of jobs) {
      const bucket = buckets.get(job.totem_id) || [];
      bucket.push(job);
      buckets.set(job.totem_id, bucket);
    }

    for (const [, bucket] of buckets) {
      bucket.sort((a, b) => parseDateValue(b.created_at) - parseDateValue(a.created_at));
    }

    return buckets;
  }, [jobs]);

  const primaryStatusByTotemId = useMemo(() => {
    const statusMap: Record<string, TotemPrimaryStatus> = {};

    for (const totem of totems) {
      const recentJobs = jobsByTotem.get(totem.id) || [];
      statusMap[totem.id] = getTotemPrimaryStatus(recentJobs);
    }

    return statusMap;
  }, [totems, jobsByTotem]);

  const filteredTotems =
    statusFilter === "all"
      ? totems
      : totems.filter((totem) => primaryStatusByTotemId[totem.id] === statusFilter);

  if (!store || !activeStoreId) {
    return (
      <AdminLayout title="Impressoras">
        <p className="text-muted-foreground">
          Selecione uma loja para configurar impressoras por totem.
        </p>
      </AdminLayout>
    );
  }

  function updateDraft(totemId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [totemId]: {
        ...(prev[totemId] || createEmptyDraft(defaults)),
        ...patch,
      },
    }));
  }

  function handleBrandChange(totemId: string, value: string) {
    const selectedBrand = (value === "__none" ? "" : value) as Draft["brand"];
    const currentDraft = drafts[totemId] || createEmptyDraft(defaults);

    if (!selectedBrand) {
      updateDraft(totemId, { brand: "", model: "" });
      return;
    }

    const availableModels = MODELS_BY_BRAND[selectedBrand] || [];
    const keepModel = availableModels.includes(currentDraft.model) ? currentDraft.model : "";

    updateDraft(totemId, {
      brand: selectedBrand,
      model: keepModel,
    });
  }

  async function savePrinter(totem: TotemWithPrinter) {
    const draft = drafts[totem.id];
    if (!draft) return;

    if (!draft.model) {
      setFeedback({
        type: "error",
        text: "Selecione uma marca e um modelo antes de salvar.",
      });
      return;
    }

    setSavingByTotem((prev) => ({ ...prev, [totem.id]: true }));
    setFeedback(null);

    try {
      await saveTotemPrinterConfig({
        store_id: activeStoreId!,
        totem_id: totem.id,
        ip: draft.ip,
        port: Number.parseInt(draft.port, 10),
        brand: draft.brand || undefined,
        model: draft.model,
        escpos_profile: draft.escpos_profile,
        paper_width_mm: Number.parseInt(draft.paper_width_mm, 10),
        is_active: draft.is_active,
      });

      setFeedback({
        type: "success",
        text: `Impressora salva para o totem ${totem.name || totem.id.slice(0, 8)}.`,
      });
      await loadData(activeStoreId!);
    } catch (error: any) {
      setFeedback({
        type: "error",
        text: error?.message || "Erro ao salvar a impressora.",
      });
    } finally {
      setSavingByTotem((prev) => ({ ...prev, [totem.id]: false }));
    }
  }

  async function pollTotemStatusAfterTest(activeStoreId: string, totemId: string) {
    for (let attempt = 0; attempt < 10; attempt++) {
      await wait(3000);

      try {
        const latest = await loadData(activeStoreId);
        const totemJobs = latest.jobs
          .filter((job) => job.totem_id === totemId)
          .sort((a, b) => parseDateValue(b.created_at) - parseDateValue(a.created_at));

        const status = getTotemPrimaryStatus(totemJobs);
        if (status === "printed" || status === "failed") {
          return;
        }
      } catch {
        return;
      }
    }
  }

  async function testPrint(totem: TotemWithPrinter) {
    setTestingByTotem((prev) => ({ ...prev, [totem.id]: true }));
    setFeedback(null);

    try {
      await triggerStoreTestPrint({
        store_id: activeStoreId!,
        totem_id: totem.id,
      });
      setFeedback({
        type: "success",
        text: `Teste enviado para o totem ${totem.name || totem.id.slice(0, 8)}.`,
      });

      await loadData(activeStoreId!);
      void pollTotemStatusAfterTest(activeStoreId!, totem.id);
    } catch (error: any) {
      setFeedback({
        type: "error",
        text: error?.message || "Erro ao enviar o teste de impressão.",
      });
    } finally {
      setTestingByTotem((prev) => ({ ...prev, [totem.id]: false }));
    }
  }

  return (
    <AdminLayout title="Impressoras">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Operação por loja - {store.name}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Vincule uma impressora por totem e acompanhe os últimos jobs.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="store-status-filter" className="text-sm">
                  Filtro
                </Label>
              </div>
              <select
                id="store-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">{toFilterLabel("all")}</option>
                <option value="in_progress">{toFilterLabel("in_progress")}</option>
                <option value="printed">{toFilterLabel("printed")}</option>
                <option value="failed">{toFilterLabel("failed")}</option>
                <option value="no_history">{toFilterLabel("no_history")}</option>
              </select>
              <Button
                variant="outline"
                onClick={() => startTransition(async () => refreshData(activeStoreId!))}
                disabled={isPending}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {feedback ? (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  feedback.type === "success"
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {feedback.text}
              </div>
            ) : null}

            <div className="space-y-4">
              {filteredTotems.map((totem) => {
                const draft = drafts[totem.id] || createEmptyDraft(defaults);
                const recentJobs = jobsByTotem.get(totem.id) || [];
                const primaryStatus = primaryStatusByTotemId[totem.id] || "no_history";
                const lastPrinted =
                  recentJobs.find((job) => job.status === "printed")?.printed_at || null;
                const modelsByBrand = draft.brand ? MODELS_BY_BRAND[draft.brand] : [];
                const showAllJobs = showAllJobsByTotem[totem.id] === true;
                const visibleJobs = showAllJobs ? recentJobs.slice(0, 10) : recentJobs.slice(0, 3);
                const printerError = totem.printer?.last_error || "";
                const expandedPrinterError = expandedTotemErrorById[totem.id] === true;

                return (
                  <Card key={totem.id} className="border border-border">
                    <CardContent className="space-y-4 pt-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-medium">
                            {totem.name || `Totem ${totem.id.slice(0, 8)}`}
                          </Badge>
                          <Badge variant={totem.status === "active" ? "default" : "secondary"}>
                            {totem.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                          {totem.maintenance_mode ? (
                            <Badge variant="destructive">Manutenção</Badge>
                          ) : null}
                          {primaryStatusBadge(primaryStatus)}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
                            <Label className="text-sm">Ativa</Label>
                            <Switch
                              checked={draft.is_active !== false}
                              onCheckedChange={(value) => updateDraft(totem.id, { is_active: value })}
                            />
                          </div>

                          <Button
                            className="gap-2"
                            onClick={() => savePrinter(totem)}
                            disabled={savingByTotem[totem.id] === true}
                          >
                            <Save className="h-4 w-4" />
                            {savingByTotem[totem.id] ? "Salvando..." : "Salvar"}
                          </Button>

                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => testPrint(totem)}
                            disabled={testingByTotem[totem.id] === true}
                          >
                            <TestTube2 className="h-4 w-4" />
                            {testingByTotem[totem.id] ? "Enviando..." : "Testar impressão"}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1">
                          <Label>IP</Label>
                          <Input
                            value={draft.ip}
                            placeholder="192.168.0.50"
                            onChange={(event) => updateDraft(totem.id, { ip: event.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Porta</Label>
                          <Input
                            value={draft.port}
                            placeholder={String(defaults.default_port)}
                            onChange={(event) => updateDraft(totem.id, { port: event.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Marca</Label>
                          <Select
                            value={draft.brand || "__none"}
                            onValueChange={(value) => handleBrandChange(totem.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">Selecione a marca</SelectItem>
                              {BRAND_OPTIONS.map((brand) => (
                                <SelectItem key={brand} value={brand}>
                                  {brand}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Modelo</Label>
                          <Select
                            value={draft.model || "__none"}
                            onValueChange={(value) =>
                              updateDraft(totem.id, {
                                model: value === "__none" ? "" : value,
                              })
                            }
                            disabled={!draft.brand}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  draft.brand ? "Selecione o modelo" : "Escolha a marca primeiro"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">
                                {draft.brand ? "Selecione o modelo" : "Escolha a marca primeiro"}
                              </SelectItem>
                              {modelsByBrand.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <details className="rounded-md border border-border bg-muted/30 px-3 py-2">
                        <summary className="cursor-pointer list-none text-sm font-medium">
                          Dados avançados e diagnóstico
                        </summary>

                        <div className="mt-3 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label>Device</Label>
                              <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                                {totem.device_id || "Não vinculado"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <Label>Fila</Label>
                              <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                                pendentes: {totem.pending_jobs ?? 0} | falhas: {totem.failed_jobs ?? 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Última impressão: {formatDateTime(lastPrinted)}</span>
                          </div>

                          {printerError ? (
                            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
                              <p className="text-sm font-medium text-red-700">Último erro</p>
                              <p className="mt-1 text-xs text-red-700">
                                {expandedPrinterError ? printerError : truncateText(printerError)}
                              </p>
                              {printerError.length > 140 ? (
                                <button
                                  type="button"
                                  className="mt-1 text-xs font-medium underline"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setExpandedTotemErrorById((prev) => ({
                                      ...prev,
                                      [totem.id]: !(prev[totem.id] === true),
                                    }));
                                  }}
                                >
                                  {expandedPrinterError ? "Mostrar menos" : "Mostrar erro completo"}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </details>

                      <div className="space-y-2">
                        <Label className="text-sm">Últimos jobs deste totem</Label>

                        {recentJobs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum job recente.</p>
                        ) : (
                          <>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pedido</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Tentativas</TableHead>
                                  <TableHead>Criado em</TableHead>
                                  <TableHead>Erro</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {visibleJobs.map((job) => {
                                  const expandedJobError = expandedJobErrorById[job.id] === true;
                                  const jobError = job.last_error || "-";
                                  const isLongError = jobError.length > 120;

                                  return (
                                    <TableRow key={job.id}>
                                      <TableCell className="font-mono text-xs">{job.order_id}</TableCell>
                                      <TableCell>{jobStatusBadge(job.status)}</TableCell>
                                      <TableCell>{job.attempts}</TableCell>
                                      <TableCell>{formatDateTime(job.created_at)}</TableCell>
                                      <TableCell className="text-xs text-red-600">
                                        <div className="space-y-1">
                                          <p>{expandedJobError ? jobError : truncateText(jobError, 120)}</p>
                                          {isLongError ? (
                                            <button
                                              type="button"
                                              className="text-xs font-medium underline"
                                              onClick={() =>
                                                setExpandedJobErrorById((prev) => ({
                                                  ...prev,
                                                  [job.id]: !(prev[job.id] === true),
                                                }))
                                              }
                                            >
                                              {expandedJobError ? "Mostrar menos" : "Mostrar erro completo"}
                                            </button>
                                          ) : null}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>

                            {recentJobs.length > 3 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowAllJobsByTotem((prev) => ({
                                    ...prev,
                                    [totem.id]: !(prev[totem.id] === true),
                                  }))
                                }
                              >
                                {showAllJobs ? "Ver menos jobs" : "Ver mais jobs"}
                              </Button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTotems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum totem encontrado para o filtro selecionado.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}




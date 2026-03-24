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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, RefreshCcw, Save, TestTube2 } from "lucide-react";
import {
  fetchStorePrintJobs,
  fetchStoreTotemPrinters,
  saveTotemPrinterConfig,
  triggerStoreTestPrint,
} from "@/src/services/printingStore.service";

type TotemPrinter = {
  id: string;
  totem_id: string;
  ip: string;
  port: number;
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
  model: string;
  escpos_profile: string;
  paper_width_mm: "58" | "76" | "80" | "82";
  is_active: boolean;
};

function toDraft(totem: TotemWithPrinter, defaults: Defaults): Draft {
  const printer = totem.printer;
  if (!printer) {
    return {
      ip: "",
      port: String(defaults.default_port || 9100),
      model: "",
      escpos_profile: defaults.default_escpos_profile || "generic",
      paper_width_mm: String(defaults.default_paper_width_mm || 80) as Draft["paper_width_mm"],
      is_active: true,
    };
  }

  return {
    ip: printer.ip || "",
    port: String(printer.port || defaults.default_port || 9100),
    model: printer.model || "",
    escpos_profile: printer.escpos_profile || defaults.default_escpos_profile || "generic",
    paper_width_mm: String(
      printer.paper_width_mm || defaults.default_paper_width_mm || 80
    ) as Draft["paper_width_mm"],
    is_active: printer.is_active !== false,
  };
}

function statusBadge(status: string) {
  if (status === "printed") return <Badge className="bg-green-600">Impresso</Badge>;
  if (status === "pending") return <Badge variant="secondary">Pendente</Badge>;
  if (status === "claimed") return <Badge className="bg-blue-600">Em andamento</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function healthBadge(status: string | undefined) {
  if (status === "online") return <Badge className="bg-green-600">Online</Badge>;
  if (status === "offline") return <Badge variant="secondary">Offline</Badge>;
  if (status === "degraded") return <Badge className="bg-yellow-600">Instavel</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falhou</Badge>;
  if (status === "no_printer") return <Badge className="bg-slate-600">Sem impressora</Badge>;
  if (status === "maintenance") return <Badge className="bg-amber-700">Manutencao</Badge>;
  if (status === "disabled") return <Badge variant="outline">Desativada</Badge>;
  return <Badge variant="outline">Desconhecido</Badge>;
}

export default function ImpressorasPage() {
  const { store } = useStore();
  const [totems, setTotems] = useState<TotemWithPrinter[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [defaults, setDefaults] = useState<Defaults>({
    default_port: 9100,
    default_escpos_profile: "generic",
    default_paper_width_mm: 80,
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [savingByTotem, setSavingByTotem] = useState<Record<string, boolean>>({});
  const [testingByTotem, setTestingByTotem] = useState<Record<string, boolean>>({});

  async function loadData(activeStoreId: string) {
    const [printerData, jobData] = await Promise.all([
      fetchStoreTotemPrinters(activeStoreId),
      fetchStorePrintJobs(activeStoreId, 40),
    ]);

    const loadedTotems = Array.isArray(printerData?.totems)
      ? (printerData.totems as TotemWithPrinter[])
      : [];
    const loadedDefaults = (printerData?.defaults as Defaults) || defaults;
    setDefaults(loadedDefaults);
    setTotems(loadedTotems);
    setJobs(Array.isArray(jobData?.jobs) ? (jobData.jobs as PrintJob[]) : []);

    const nextDrafts: Record<string, Draft> = {};
    for (const totem of loadedTotems) {
      nextDrafts[totem.id] = toDraft(totem, loadedDefaults);
    }
    setDrafts(nextDrafts);
  }

  useEffect(() => {
    if (!store?.id) return;
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        await loadData(store.id);
      } catch (e: any) {
        setError(e?.message || "Erro ao carregar modulo de impressoras.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const jobsByTotem = useMemo(() => {
    const buckets = new Map<string, PrintJob[]>();
    for (const job of jobs) {
      const bucket = buckets.get(job.totem_id) || [];
      bucket.push(job);
      buckets.set(job.totem_id, bucket);
    }
    return buckets;
  }, [jobs]);

  const filteredTotems =
    healthFilter === "all"
      ? totems
      : totems.filter((totem) => (totem.health_status || "unknown") === healthFilter);

  if (!store) {
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
        ...(prev[totemId] || toDraft({} as TotemWithPrinter, defaults)),
        ...patch,
      },
    }));
  }

  async function savePrinter(totem: TotemWithPrinter) {
    const draft = drafts[totem.id];
    if (!draft) return;

    setSavingByTotem((prev) => ({ ...prev, [totem.id]: true }));
    setError("");
    setMessage("");

    try {
      await saveTotemPrinterConfig({
        store_id: store.id,
        totem_id: totem.id,
        ip: draft.ip,
        port: Number.parseInt(draft.port, 10),
        model: draft.model,
        escpos_profile: draft.escpos_profile,
        paper_width_mm: Number.parseInt(draft.paper_width_mm, 10),
        is_active: draft.is_active,
      });

      setMessage(`Impressora salva para o totem ${totem.name}.`);
      await loadData(store.id);
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar impressora.");
    } finally {
      setSavingByTotem((prev) => ({ ...prev, [totem.id]: false }));
    }
  }

  async function testPrint(totem: TotemWithPrinter) {
    setTestingByTotem((prev) => ({ ...prev, [totem.id]: true }));
    setError("");
    setMessage("");

    try {
      await triggerStoreTestPrint({
        store_id: store.id,
        totem_id: totem.id,
      });
      setMessage(`Teste enviado para o totem ${totem.name}.`);
      await loadData(store.id);
    } catch (e: any) {
      setError(e?.message || "Erro ao enviar teste.");
    } finally {
      setTestingByTotem((prev) => ({ ...prev, [totem.id]: false }));
    }
  }

  return (
    <AdminLayout title="Impressoras">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Operacao por Loja - {store.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Vincule 1 impressora por totem e acompanhe os ultimos jobs.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => loadData(store.id)}
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {message && <p className="text-sm text-green-600 mb-4">{message}</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="mb-4 flex items-center gap-2">
              <Label htmlFor="store-health-filter">Filtro de status</Label>
              <select
                id="store-health-filter"
                value={healthFilter}
                onChange={(event) => setHealthFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="degraded">Instavel</option>
                <option value="failed">Falhou</option>
                <option value="no_printer">Sem impressora</option>
                <option value="maintenance">Manutencao</option>
                <option value="disabled">Desativada</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredTotems.map((totem) => {
                const draft = drafts[totem.id];
                const recentJobs = jobsByTotem.get(totem.id) || [];
                const lastPrinted = recentJobs.find((job) => job.status === "printed")?.printed_at || null;

                return (
                  <Card key={totem.id} className="border border-border">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{totem.name || `Totem ${totem.id.slice(0, 8)}`}</Badge>
                        <Badge variant={totem.status === "active" ? "default" : "secondary"}>
                          {totem.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        {totem.maintenance_mode ? (
                          <Badge variant="destructive">Manutencao</Badge>
                        ) : null}
                        {healthBadge(totem.health_status)}
                        <span className="text-xs text-muted-foreground">
                          Device: {totem.device_id || "Nao vinculado"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Fila: pend {totem.pending_jobs ?? 0} | fail {totem.failed_jobs ?? 0}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-5">
                        <div className="space-y-1">
                          <Label>IP</Label>
                          <Input
                            value={draft?.ip || ""}
                            placeholder="192.168.0.50"
                            onChange={(e) => updateDraft(totem.id, { ip: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Porta</Label>
                          <Input
                            value={draft?.port || ""}
                            placeholder={String(defaults.default_port)}
                            onChange={(e) => updateDraft(totem.id, { port: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Modelo</Label>
                          <Input
                            value={draft?.model || ""}
                            placeholder="Bematech MP-4200 TH"
                            onChange={(e) => updateDraft(totem.id, { model: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Perfil ESC/POS</Label>
                          <Input
                            value={draft?.escpos_profile || ""}
                            placeholder={defaults.default_escpos_profile}
                            onChange={(e) =>
                              updateDraft(totem.id, { escpos_profile: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Largura</Label>
                          <select
                            value={draft?.paper_width_mm || "80"}
                            onChange={(e) =>
                              updateDraft(totem.id, {
                                paper_width_mm: e.target.value as Draft["paper_width_mm"],
                              })
                            }
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="58">58 mm</option>
                            <option value="76">76 mm</option>
                            <option value="80">80 mm</option>
                            <option value="82">82 mm</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Ativa</Label>
                          <Switch
                            checked={draft?.is_active !== false}
                            onCheckedChange={(value) =>
                              updateDraft(totem.id, { is_active: value })
                            }
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
                          {testingByTotem[totem.id] ? "Enviando..." : "Testar impressao"}
                        </Button>

                        <span className="text-xs text-muted-foreground">
                          Heartbeat: {totem.printer?.last_heartbeat_at || "nunca"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ultima impressao: {lastPrinted ? new Date(lastPrinted).toLocaleString("pt-BR") : "nunca"}
                        </span>
                        {totem.printer?.last_error ? (
                          <span className="text-xs text-red-600">
                            Ultimo erro: {totem.printer.last_error}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <Label className="text-sm">Ultimos jobs deste totem</Label>
                        {recentJobs.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-2">
                            Nenhum job recente.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Pedido</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tentativas</TableHead>
                                <TableHead>Criado</TableHead>
                                <TableHead>Erro</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentJobs.slice(0, 5).map((job) => (
                                <TableRow key={job.id}>
                                  <TableCell className="font-mono text-xs">{job.order_id}</TableCell>
                                  <TableCell>{statusBadge(job.status)}</TableCell>
                                  <TableCell>{job.attempts}</TableCell>
                                  <TableCell>{new Date(job.created_at).toLocaleString("pt-BR")}</TableCell>
                                  <TableCell className="text-xs text-red-600">
                                    {job.last_error || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTotems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum totem encontrado para o filtro atual.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCcw, Save, Settings2, Activity } from "lucide-react";
import {
  fetchPrintGlobalSettings,
  fetchPrintGlobalStatus,
  savePrintGlobalSettings,
} from "@/src/services/printingGlobal.service";

type GlobalSettings = {
  default_connection_type: "tcp";
  default_port: number;
  default_escpos_profile: string;
  default_paper_width_mm: number;
  queue_claim_interval_ms: number;
  heartbeat_interval_ms: number;
  max_retry_attempts: number;
};

type GlobalStatusSummary = {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  error: number;
  unknown: number;
  disabled: number;
  noPrinter?: number;
  maintenance?: number;
  failed?: number;
  pendingQueue?: number;
};

type GlobalStatusItem = {
  printer_id: string | null;
  store_name: string;
  totem_name: string | null;
  totem_status: string | null;
  maintenance_mode?: boolean;
  device_id: string | null;
  model: string | null;
  ip: string | null;
  port: number | null;
  escpos_profile: string | null;
  is_active: boolean;
  health_status: string;
  last_heartbeat_at: string | null;
  last_status: string | null;
  last_error: string | null;
  pending_jobs: number;
  failed_jobs: number;
  last_printed_at?: string | null;
  updated_at: string;
};

function healthBadge(value: string) {
  if (value === "online") return <Badge className="bg-green-600">Online</Badge>;
  if (value === "offline") return <Badge variant="secondary">Offline</Badge>;
  if (value === "degraded") return <Badge className="bg-yellow-600">Instavel</Badge>;
  if (value === "failed") return <Badge variant="destructive">Falhou</Badge>;
  if (value === "no_printer") return <Badge className="bg-slate-600">Sem impressora</Badge>;
  if (value === "maintenance") return <Badge className="bg-amber-700">Manutencao</Badge>;
  if (value === "error") return <Badge variant="destructive">Erro</Badge>;
  if (value === "disabled") return <Badge variant="outline">Desativada</Badge>;
  return <Badge variant="outline">Desconhecido</Badge>;
}

export default function ImpressorasGlobalPage() {
  const [settings, setSettings] = useState<GlobalSettings>({
    default_connection_type: "tcp",
    default_port: 9100,
    default_escpos_profile: "generic",
    default_paper_width_mm: 80,
    queue_claim_interval_ms: 2500,
    heartbeat_interval_ms: 10000,
    max_retry_attempts: 5,
  });
  const [summary, setSummary] = useState<GlobalStatusSummary>({
    total: 0,
    online: 0,
    offline: 0,
    degraded: 0,
    error: 0,
    unknown: 0,
    disabled: 0,
  });
  const [items, setItems] = useState<GlobalStatusItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    const [settingsData, statusData] = await Promise.all([
      fetchPrintGlobalSettings(),
      fetchPrintGlobalStatus(250),
    ]);

    if (settingsData?.settings) {
      setSettings(settingsData.settings as GlobalSettings);
    }
    setSummary((statusData?.summary || summary) as GlobalStatusSummary);
    setItems(Array.isArray(statusData?.items) ? (statusData.items as GlobalStatusItem[]) : []);
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        await loadData();
      } catch (e: any) {
        setError(e?.message || "Erro ao carregar modulo global de impressoras.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        await savePrintGlobalSettings(settings);
        setMessage("Configuracao global salva com sucesso.");
        await loadData();
      } catch (e: any) {
        setError(e?.message || "Erro ao salvar configuracao global.");
      }
    });
  }

  const filteredItems =
    healthFilter === "all"
      ? items
      : items.filter((item) => item.health_status === healthFilter);

  return (
    <AdminLayout title="Impressoras Global">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configuracoes Globais de Impressao
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => loadData()}
                disabled={isPending}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button onClick={handleSave} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && <p className="text-sm text-green-600">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Conexao padrao</Label>
                <Input value="tcp" disabled />
              </div>
              <div className="space-y-1">
                <Label>Porta padrao</Label>
                <Input
                  value={settings.default_port}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      default_port: Number.parseInt(e.target.value, 10) || 9100,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Perfil ESC/POS padrao</Label>
                <Input
                  value={settings.default_escpos_profile}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      default_escpos_profile: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Largura padrao (mm)</Label>
                <select
                  value={String(settings.default_paper_width_mm)}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      default_paper_width_mm: Number.parseInt(e.target.value, 10) || 80,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="58">58</option>
                  <option value="76">76</option>
                  <option value="80">80</option>
                  <option value="82">82</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Intervalo da fila (ms)</Label>
                <Input
                  value={settings.queue_claim_interval_ms}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      queue_claim_interval_ms: Number.parseInt(e.target.value, 10) || 2500,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Intervalo heartbeat (ms)</Label>
                <Input
                  value={settings.heartbeat_interval_ms}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heartbeat_interval_ms: Number.parseInt(e.target.value, 10) || 10000,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Maximo de tentativas</Label>
                <Input
                  value={settings.max_retry_attempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      max_retry_attempts: Number.parseInt(e.target.value, 10) || 5,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Global das Impressoras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-semibold">{summary.total}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Online</p><p className="text-xl font-semibold text-green-600">{summary.online}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Offline</p><p className="text-xl font-semibold">{summary.offline}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Instavel</p><p className="text-xl font-semibold text-yellow-600">{summary.degraded}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Falhou</p><p className="text-xl font-semibold text-red-600">{summary.failed ?? summary.error}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Sem impressora</p><p className="text-xl font-semibold">{summary.noPrinter ?? 0}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Desconhecido</p><p className="text-xl font-semibold">{summary.unknown}</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Desativada</p><p className="text-xl font-semibold">{summary.disabled}</p></CardContent></Card>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="global-health-filter">Filtro de status</Label>
              <select
                id="global-health-filter"
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Totem</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Rede</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fila</TableHead>
                  <TableHead>Heartbeat</TableHead>
                  <TableHead>Ultima impressao</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={`${item.totem_name || item.device_id || "totem"}-${item.printer_id || "none"}`}>
                    <TableCell>{item.store_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{item.totem_name || "Totem sem nome"}</span>
                        <span className="text-xs text-muted-foreground">{item.device_id || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.model || "Sem impressora"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.ip && item.port ? `${item.ip}:${item.port}` : "-"}
                    </TableCell>
                    <TableCell>{healthBadge(item.health_status)}</TableCell>
                    <TableCell className="text-xs">
                      pend: {item.pending_jobs} | fail: {item.failed_jobs}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.last_heartbeat_at
                        ? new Date(item.last_heartbeat_at).toLocaleString("pt-BR")
                        : "nunca"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.last_printed_at
                        ? new Date(item.last_printed_at).toLocaleString("pt-BR")
                        : "nunca"}
                    </TableCell>
                    <TableCell className="text-xs text-red-600">
                      {item.last_error || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma impressora configurada no ambiente global.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

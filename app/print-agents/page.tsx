"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCcw, ShieldCheck, QrCode, Ban, TestTube2 } from "lucide-react";
import {
  createPrintAgentEnrollment,
  fetchPrintAgentDevices,
  revokePrintAgentDevice,
} from "@/src/services/printingAgent.service";
import { triggerStoreTestPrint } from "@/src/services/printingStore.service";

type StoreItem = {
  id: string;
  name: string;
};

type TotemItem = {
  id: string;
  name: string;
  store_id: string;
  status: "active" | "inactive" | string;
  device_id: string | null;
  maintenance_mode: boolean;
};

type AgentDeviceItem = {
  id: string;
  device_id: string;
  agent_id: string;
  status: string;
  health_status: string;
  last_seen_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_agent_version: string | null;
  totem: {
    id: string;
    name: string | null;
    status: string | null;
    maintenance_mode: boolean;
    store_id: string | null;
    store_name: string | null;
  } | null;
};

type EnrollmentPayload = {
  v: number;
  type: string;
  token: string;
  deviceId: string;
  agentId: string;
  apiBaseUrl: string;
  expiresAt: string;
  signature: string;
};

function statusBadge(status: string) {
  if (status === "online") return <Badge className="bg-green-600">Online</Badge>;
  if (status === "degraded") return <Badge className="bg-yellow-600">Instavel</Badge>;
  if (status === "offline") return <Badge variant="secondary">Offline</Badge>;
  if (status === "disabled") return <Badge variant="outline">Desativado</Badge>;
  if (status === "revoked") return <Badge variant="destructive">Revogado</Badge>;
  return <Badge variant="outline">{status || "unknown"}</Badge>;
}

function formatRemainingMs(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function PrintAgentsPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [totems, setTotems] = useState<TotemItem[]>([]);
  const [selectedTotemId, setSelectedTotemId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const [ttlMinutes, setTtlMinutes] = useState<number>(15);
  const [devices, setDevices] = useState<AgentDeviceItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [enrollmentPayload, setEnrollmentPayload] = useState<EnrollmentPayload | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [countdownNow, setCountdownNow] = useState<number>(Date.now());
  const [isPending, startTransition] = useTransition();
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedTotem = useMemo(
    () => totems.find((totem) => totem.id === selectedTotemId) ?? null,
    [totems, selectedTotemId],
  );

  const expired = useMemo(() => {
    if (!enrollmentPayload?.expiresAt) return false;
    const ts = new Date(enrollmentPayload.expiresAt).getTime();
    if (!Number.isFinite(ts)) return true;
    return ts <= countdownNow;
  }, [enrollmentPayload?.expiresAt, countdownNow]);

  const remainingMs = useMemo(() => {
    if (!enrollmentPayload?.expiresAt) return 0;
    const ts = new Date(enrollmentPayload.expiresAt).getTime();
    if (!Number.isFinite(ts)) return 0;
    return Math.max(0, ts - countdownNow);
  }, [enrollmentPayload?.expiresAt, countdownNow]);

  const offlineCount = useMemo(
    () => devices.filter((device) => device.health_status === "offline").length,
    [devices],
  );

  async function loadStores() {
    const res = await fetch("/api/admin/stores", { cache: "no-store" });
    const body = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error("Erro ao carregar lojas.");
    }
    const loadedStores = Array.isArray(body) ? (body as StoreItem[]) : [];
    setStores(loadedStores);
    if (!selectedStoreId && loadedStores.length > 0) {
      setSelectedStoreId(loadedStores[0].id);
    }
  }

  async function loadTotems(storeId: string) {
    if (!storeId) {
      setTotems([]);
      setSelectedTotemId("");
      return;
    }
    const res = await fetch(`/api/admin/totems?store_id=${storeId}`, { cache: "no-store" });
    const body = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error(body?.error || "Erro ao carregar totens.");
    }
    const loadedTotems = Array.isArray(body) ? (body as TotemItem[]) : [];
    setTotems(loadedTotems);
    if (!loadedTotems.some((totem) => totem.id === selectedTotemId)) {
      setSelectedTotemId(loadedTotems[0]?.id ?? "");
    }
  }

  async function loadDevices() {
    const response = await fetchPrintAgentDevices(250);
    setSummary(response.summary ?? null);
    setDevices(Array.isArray(response.items) ? (response.items as AgentDeviceItem[]) : []);
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        setError("");
        await loadStores();
        await loadDevices();
      } catch (e: any) {
        setError(e?.message || "Erro ao carregar modulo de print agents.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startTransition(async () => {
      try {
        setError("");
        await loadTotems(selectedStoreId);
      } catch (e: any) {
        setError(e?.message || "Erro ao carregar totens.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDevices().catch(() => null);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedTotem) {
      setAgentId("");
      return;
    }
    const defaultAgentId =
      selectedTotem.device_id && selectedTotem.device_id.trim() !== ""
        ? `tablet-${selectedTotem.device_id.slice(0, 8)}`
        : `totem-${selectedTotem.id.slice(0, 8)}`;
    setAgentId(defaultAgentId);
  }, [selectedTotem?.id, selectedTotem?.device_id]);

  async function handleGenerateEnrollment() {
    if (!selectedStoreId || !selectedTotemId) return;
    try {
      setMessage("");
      setError("");
      const response = await createPrintAgentEnrollment({
        store_id: selectedStoreId,
        totem_id: selectedTotemId,
        agent_id: agentId || undefined,
        ttl_minutes: ttlMinutes,
      });
      setEnrollmentPayload((response?.qr_payload as EnrollmentPayload) ?? null);
      setMessage("Enrollment gerado. Escaneie o QR no tablet para ativar.");
      await loadDevices();
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar enrollment.");
    }
  }

  async function handleRevoke(deviceId: string) {
    try {
      setMessage("");
      setError("");
      await revokePrintAgentDevice({ device_id: deviceId });
      setMessage(`Dispositivo ${deviceId} revogado.`);
      await loadDevices();
    } catch (e: any) {
      setError(e?.message || "Erro ao revogar dispositivo.");
    }
  }

  async function handleTestPrint(device: AgentDeviceItem) {
    const storeId = device.totem?.store_id;
    const totemId = device.totem?.id;
    if (!storeId || !totemId) {
      setError("Este dispositivo nao esta vinculado a um totem configurado.");
      return;
    }
    try {
      setMessage("");
      setError("");
      await triggerStoreTestPrint({ store_id: storeId, totem_id: totemId });
      setMessage(`Teste de impressao enfileirado para ${device.totem?.name || totemId}.`);
    } catch (e: any) {
      setError(e?.message || "Erro ao enfileirar teste de impressao.");
    }
  }

  async function copyPayload() {
    if (!enrollmentPayload) return;
    await navigator.clipboard.writeText(JSON.stringify(enrollmentPayload));
    setMessage("Payload do enrollment copiado.");
  }

  function downloadQr() {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) {
      setError("Nao foi possivel encontrar o QR para download.");
      return;
    }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `print-agent-enrollment-${selectedTotemId || "totem"}.png`;
    link.click();
  }

  return (
    <AdminLayout title="Print Agents">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Ativacao por QR
            </CardTitle>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                startTransition(async () => {
                  await loadDevices();
                });
              }}
              disabled={isPending}
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {offlineCount > 0 ? (
              <p className="text-sm text-amber-700">
                Alerta: {offlineCount} dispositivo(s) offline no momento.
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Loja</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Totem</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedTotemId}
                  onChange={(event) => setSelectedTotemId(event.target.value)}
                >
                  {totems.map((totem) => (
                    <option key={totem.id} value={totem.id}>
                      {totem.name} ({totem.device_id || "sem device"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Agent ID</Label>
                <Input
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  placeholder="tablet-a11-01"
                />
              </div>

              <div className="space-y-1">
                <Label>TTL (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={ttlMinutes}
                  onChange={(event) => setTtlMinutes(Number.parseInt(event.target.value, 10) || 15)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleGenerateEnrollment} disabled={!selectedStoreId || !selectedTotemId}>
                Gerar QR de Ativacao
              </Button>
              {enrollmentPayload ? (
                <>
                  <Button variant="outline" onClick={copyPayload}>
                    Copiar Payload
                  </Button>
                  <Button variant="outline" onClick={downloadQr}>
                    Baixar QR
                  </Button>
                </>
              ) : null}
            </div>

            {enrollmentPayload ? (
              <div className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start gap-6">
                  <div ref={qrContainerRef} className="rounded-lg border border-border bg-white p-3">
                    <QRCodeCanvas
                      value={JSON.stringify(enrollmentPayload)}
                      size={220}
                      includeMargin
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Device ID:</strong> {enrollmentPayload.deviceId}
                    </p>
                    <p>
                      <strong>Agent ID:</strong> {enrollmentPayload.agentId}
                    </p>
                    <p>
                      <strong>Expira em:</strong>{" "}
                      {expired ? (
                        <span className="text-red-600">expirado</span>
                      ) : (
                        <span className="text-amber-700">{formatRemainingMs(remainingMs)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Escaneie este QR no APK. Se expirar, gere um novo enrollment.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Dispositivos do Print Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{summary?.total ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Online</p>
                  <p className="text-xl font-semibold text-green-600">{summary?.online ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Instavel</p>
                  <p className="text-xl font-semibold text-yellow-600">{summary?.degraded ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Offline</p>
                  <p className="text-xl font-semibold">{summary?.offline ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Revogado</p>
                  <p className="text-xl font-semibold text-red-600">{summary?.revoked ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Desativado</p>
                  <p className="text-xl font-semibold">{summary?.disabled ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Loja / Totem</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Versao</TableHead>
                  <TableHead>Ultimo erro</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>{statusBadge(device.health_status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{device.totem?.store_name || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {device.totem?.name || "Sem totem vinculado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{device.device_id}</TableCell>
                    <TableCell className="font-mono text-xs">{device.agent_id}</TableCell>
                    <TableCell className="text-xs">{device.last_agent_version || "-"}</TableCell>
                    <TableCell className="text-xs text-red-600">
                      {device.last_error || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleTestPrint(device)}
                          disabled={!device.totem?.id || !device.totem?.store_id}
                        >
                          <TestTube2 className="h-3 w-3" />
                          Teste
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleRevoke(device.device_id)}
                        >
                          <Ban className="h-3 w-3" />
                          Revogar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

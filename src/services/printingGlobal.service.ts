export type PrintGlobalSettingsInput = {
  default_connection_type: "tcp";
  default_port: number;
  default_escpos_profile: string;
  default_paper_width_mm: number;
  queue_claim_interval_ms: number;
  heartbeat_interval_ms: number;
  max_retry_attempts: number;
};

export async function fetchPrintGlobalSettings() {
  const res = await fetch("/api/admin/printing/global-settings", {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar configuracao global.");
  }
  return body;
}

export async function savePrintGlobalSettings(input: PrintGlobalSettingsInput) {
  const res = await fetch("/api/admin/printing/global-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao salvar configuracao global.");
  }
  return body;
}

export async function fetchPrintGlobalStatus(limit = 200) {
  const res = await fetch(`/api/admin/printing/global-status?limit=${limit}`, {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar status global.");
  }
  return body;
}

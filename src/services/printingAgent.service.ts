export type AgentEnrollmentCreateInput = {
  store_id: string;
  totem_id: string;
  agent_id?: string;
  ttl_minutes?: number;
  api_base_url?: string;
};

export async function fetchPrintAgentDevices(limit = 200) {
  const res = await fetch(`/api/admin/printing/agent-devices?limit=${limit}`, {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar dispositivos de print agent.");
  }
  return body;
}

export async function createPrintAgentEnrollment(input: AgentEnrollmentCreateInput) {
  const res = await fetch("/api/admin/printing/agent-enrollment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao gerar enrollment.");
  }
  return body;
}

export async function revokePrintAgentDevice(input: { device_id: string }) {
  const res = await fetch("/api/admin/printing/agent-enrollment/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao revogar dispositivo.");
  }
  return body;
}

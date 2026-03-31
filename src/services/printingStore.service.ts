export type TotemPrinterConfigInput = {
  store_id: string;
  totem_id: string;
  ip: string;
  port: number;
  brand?: string;
  model: string;
  escpos_profile: string;
  paper_width_mm: number;
  is_active: boolean;
};

export async function fetchStoreTotemPrinters(storeId: string) {
  const res = await fetch(`/api/admin/printing/totem-printers?store_id=${storeId}`, {
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar impressoras da loja.");
  }

  return body;
}

export async function saveTotemPrinterConfig(input: TotemPrinterConfigInput) {
  const res = await fetch("/api/admin/printing/totem-printers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao salvar impressora do totem.");
  }

  return body;
}

export async function triggerStoreTestPrint(input: {
  store_id: string;
  totem_id: string;
}) {
  const res = await fetch("/api/admin/printing/test-print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao enviar teste de impressao.");
  }

  return body;
}

export async function fetchStorePrintJobs(storeId: string, limit = 40) {
  const res = await fetch(
    `/api/admin/printing/jobs?store_id=${storeId}&limit=${limit}`,
    { cache: "no-store" }
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar jobs de impressao.");
  }

  return body;
}

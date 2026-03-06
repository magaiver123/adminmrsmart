export async function fetchKioskSlides(storeId: string) {
  const res = await fetch(`/api/admin/kiosk-slides?store_id=${storeId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar slides.");
  }

  return res.json();
}

export async function createKioskSlide({
  storeId,
  file,
  duration,
  active,
}: {
  storeId: string;
  file: File;
  duration: number;
  active: boolean;
}) {
  const formData = new FormData();
  formData.append("store_id", storeId);
  formData.append("duration", String(duration));
  formData.append("active", String(active));
  formData.append("file", file);

  const res = await fetch("/api/admin/kiosk-slides", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao criar slide.");
  }
}

export async function reorderKioskSlides(storeId: string, orderedIds: string[]) {
  const res = await fetch("/api/admin/kiosk-slides", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reorder",
      store_id: storeId,
      ordered_ids: orderedIds,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao reordenar slides.");
  }
}

export async function toggleKioskSlide(
  storeId: string,
  id: string,
  active: boolean
) {
  const res = await fetch("/api/admin/kiosk-slides", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggle",
      store_id: storeId,
      id,
      active,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao atualizar slide.");
  }
}

export async function deleteKioskSlide(storeId: string, id: string) {
  const res = await fetch(
    `/api/admin/kiosk-slides?store_id=${storeId}&id=${id}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao excluir slide.");
  }
}

import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

function mapStatusItemToSnake(item: any) {
  return {
    printer_id: item?.printerId ?? null,
    store_id: item?.storeId ?? null,
    store_name: item?.storeName ?? "Loja",
    totem_id: item?.totemId ?? null,
    totem_name: item?.totemName ?? null,
    totem_status: item?.totemStatus ?? null,
    maintenance_mode: item?.maintenanceMode ?? false,
    device_id: item?.deviceId ?? null,
    model: item?.model ?? "Nao configurada",
    ip: item?.ip ?? null,
    port: item?.port ?? null,
    escpos_profile: item?.escposProfile ?? null,
    is_active: item?.isActive ?? false,
    health_status: item?.healthStatus ?? "unknown",
    last_heartbeat_at: item?.lastHeartbeatAt ?? null,
    last_status: item?.lastStatus ?? null,
    last_error: item?.lastError ?? null,
    agent_version: item?.agentVersion ?? null,
    pending_jobs: item?.pendingJobs ?? 0,
    failed_jobs: item?.failedJobs ?? 0,
    last_printed_at: item?.lastPrintedAt ?? null,
    updated_at: item?.updatedAt ?? null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  const result = await callPrintingBackend({
    path: "/api/print/admin/global-status",
    query: { limit: limit ?? undefined },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  const items = Array.isArray(result.data?.items)
    ? result.data.items.map(mapStatusItemToSnake)
    : [];

  return NextResponse.json({
    settings: result.data?.settings ?? null,
    summary: result.data?.summary ?? {
      total: 0,
      online: 0,
      offline: 0,
      degraded: 0,
      error: 0,
      unknown: 0,
      disabled: 0,
      noPrinter: 0,
      maintenance: 0,
      failed: 0,
      pendingQueue: 0,
    },
    items,
  });
}

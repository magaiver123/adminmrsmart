import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

function mapAgentDeviceToSnake(item: any) {
  return {
    id: item?.id ?? null,
    device_id: item?.deviceId ?? null,
    agent_id: item?.agentId ?? null,
    key_id: item?.keyId ?? null,
    status: item?.status ?? null,
    health_status: item?.healthStatus ?? "unknown",
    min_supported_version: item?.minSupportedVersion ?? null,
    last_seen_at: item?.lastSeenAt ?? null,
    last_status: item?.lastStatus ?? null,
    last_error: item?.lastError ?? null,
    last_agent_version: item?.lastAgentVersion ?? null,
    revoked_at: item?.revokedAt ?? null,
    created_at: item?.createdAt ?? null,
    updated_at: item?.updatedAt ?? null,
    totem: item?.totem
      ? {
          id: item.totem?.id ?? null,
          name: item.totem?.name ?? null,
          status: item.totem?.status ?? null,
          maintenance_mode: Boolean(item.totem?.maintenanceMode),
          store_id: item.totem?.storeId ?? null,
          store_name: item.totem?.storeName ?? null,
          printer: item.totem?.printer
            ? {
                is_active: Boolean(item.totem.printer?.isActive),
                ip: item.totem.printer?.ip ?? null,
                port: item.totem.printer?.port ?? null,
                model: item.totem.printer?.model ?? null,
                escpos_profile: item.totem.printer?.escposProfile ?? null,
                last_heartbeat_at: item.totem.printer?.lastHeartbeatAt ?? null,
                last_status: item.totem.printer?.lastStatus ?? null,
                last_error: item.totem.printer?.lastError ?? null,
                agent_version: item.totem.printer?.agentVersion ?? null,
              }
            : null,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  const result = await callPrintingBackend({
    path: "/api/print/admin/agent-devices",
    query: {
      limit: limit ?? undefined,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: Boolean(result.data?.success),
    code: result.data?.code ?? "PRINT_AGENT_DEVICES_LISTED",
    summary: result.data?.summary ?? {
      total: 0,
      online: 0,
      degraded: 0,
      offline: 0,
      disabled: 0,
      revoked: 0,
      unknown: 0,
    },
    items: Array.isArray(result.data?.items)
      ? result.data.items.map(mapAgentDeviceToSnake)
      : [],
  });
}

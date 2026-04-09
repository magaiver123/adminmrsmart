export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/src/services/dashboard.service";
import {
  callFridgeBackend,
  fridgeBackendErrorResponse,
} from "../fridges/_proxy";

type FridgeRow = {
  id?: string;
  status?: string;
};

type FridgeInventoryProduct = {
  in_mix?: boolean;
  quantity?: number;
};

function countLowStockProducts(products: unknown) {
  if (!Array.isArray(products)) return 0;

  return (products as FridgeInventoryProduct[]).filter((product) => {
    if (product?.in_mix !== true) return false;
    const quantity = Number(product?.quantity ?? 0);
    return quantity >= 1 && quantity <= 5;
  }).length;
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id é obrigatório." },
        { status: 400 }
      );
    }

    const data = await getDashboardData(supabase, storeId);

    const fridgesResult = await callFridgeBackend({
      path: "/api/admin/fridges",
      query: { storeId },
    });
    if (!fridgesResult.ok) return fridgeBackendErrorResponse(fridgesResult);

    const fridges = Array.isArray(fridgesResult.data?.fridges)
      ? (fridgesResult.data.fridges as FridgeRow[])
      : [];

    const activeFridgeIds = fridges
      .filter((fridge) => fridge?.status === "active")
      .map((fridge) => (typeof fridge?.id === "string" ? fridge.id.trim() : ""))
      .filter((fridgeId) => fridgeId.length > 0);

    if (activeFridgeIds.length === 0) {
      data.metrics.lowStock = 0;
      return NextResponse.json(data);
    }

    const inventoryResults = await Promise.all(
      activeFridgeIds.map((fridgeId) =>
        callFridgeBackend({
          path: "/api/admin/fridge-inventory",
          query: {
            storeId,
            fridge_id: fridgeId,
            mode: "products",
          },
        })
      )
    );

    const inventoryError = inventoryResults.find((result) => !result.ok);
    if (inventoryError) return fridgeBackendErrorResponse(inventoryError);

    data.metrics.lowStock = inventoryResults.reduce((acc, result) => {
      return acc + countLowStockProducts(result.data?.products);
    }, 0);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[DASHBOARD API ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}

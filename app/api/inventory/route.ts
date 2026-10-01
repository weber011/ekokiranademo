import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory-service";
import { ProductRepository } from "@/lib/db/repositories/product-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, LOW, OUT

    const [summary, allProducts] = await Promise.all([
      InventoryService.getInventorySummary(),
      ProductRepository.getProducts(),
    ]);

    let items = allProducts;
    if (filter === "LOW") {
      items = allProducts.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
    } else if (filter === "OUT") {
      items = allProducts.filter((p) => p.stock <= 0);
    }

    return NextResponse.json({
      success: true,
      summary,
      count: items.length,
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, newStock } = body;

    if (!productId || newStock === undefined) {
      return NextResponse.json({ success: false, error: "productId and newStock are required" }, { status: 400 });
    }

    const updated = await InventoryService.adjustStock(productId, Number(newStock));
    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "All";
    const stockFilter = searchParams.get("stock") || "ALL";

    let products = await ProductRepository.getProducts({ query, category });

    if (stockFilter === "LOW") {
      products = products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
    } else if (stockFilter === "OUT") {
      products = products.filter((p) => p.stock <= 0);
    }

    // Get categories from DB
    let categories: string[] = [];
    try {
      if (process.env.DATABASE_URL) {
        const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
        categories = cats.map((c) => c.name);
      }
    } catch (e) {}

    if (categories.length === 0) {
      categories = Array.from(new Set(products.map((p) => p.category))).sort();
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      categories: ["All", ...categories],
      products,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.price) {
      return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 });
    }

    const id = body.id || `prod-${Date.now().toString().slice(-6)}`;
    const product = {
      id,
      name: body.name,
      category: body.category || "General",
      brand: body.brand || "Local",
      unit: body.unit || "1 unit",
      price: Number(body.price),
      mrp: Number(body.mrp || body.price),
      stock: Number(body.stock || 0),
      reorderLevel: Number(body.reorderLevel || 5),
      image: body.image || "📦",
      description: body.description || "",
      isAvailable: Number(body.stock || 0) > 0,
      tags: body.tags || [body.name.toLowerCase()],
    };

    const saved = await ProductRepository.saveProduct(product);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    const existing = await ProductRepository.getProductById(body.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      price: Number(body.price ?? existing.price),
      mrp: Number(body.mrp ?? existing.mrp),
      stock: Number(body.stock ?? existing.stock),
      reorderLevel: Number(body.reorderLevel ?? existing.reorderLevel),
      isAvailable: Number(body.stock ?? existing.stock) > 0,
    };

    const saved = await ProductRepository.saveProduct(updated);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    try {
      if (process.env.DATABASE_URL) {
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    // Fallback
    const { db } = await import("@/lib/db/store");
    const success = db.deleteProduct(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

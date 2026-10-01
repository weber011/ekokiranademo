import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    let customers: any[] = [];

    try {
      if (process.env.DATABASE_URL) {
        const whereClause: any = { shopId: "shop-default-01" };
        if (query) {
          whereClause.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { mobile: { contains: query } },
            { address: { contains: query, mode: "insensitive" } },
          ];
        }

        const records = await prisma.customer.findMany({
          where: whereClause,
          include: {
            orders: {
              select: { id: true, total: true, createdAt: true, orderStatus: true },
              orderBy: { createdAt: "desc" },
            },
            khaataAccount: {
              select: { balance: true, creditLimit: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        customers = records.map((c) => ({
          id: c.id,
          name: c.name,
          mobile: c.mobile,
          address: c.address,
          totalOrders: c.orders.length,
          totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
          lastOrderDate: c.orders[0]?.createdAt.toISOString() || null,
          khaataBalance: c.khaataAccount?.balance ?? 0,
          creditLimit: c.khaataAccount?.creditLimit ?? 10000,
        }));

        return NextResponse.json({ success: true, count: customers.length, customers });
      }
    } catch (e) {
      console.warn("Prisma customers fallback:", e);
    }

    // In-memory fallback
    const { db } = await import("@/lib/db/store");
    let fallbackCustomers = db.getCustomers();
    if (query) {
      fallbackCustomers = fallbackCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.mobile.includes(query) ||
          c.address.toLowerCase().includes(query)
      );
    }
    return NextResponse.json({ success: true, count: fallbackCustomers.length, customers: fallbackCustomers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile, address } = body;
    if (!name || !mobile) {
      return NextResponse.json({ success: false, error: "Name and mobile are required" }, { status: 400 });
    }

    try {
      if (process.env.DATABASE_URL) {
        const customer = await prisma.customer.upsert({
          where: { shopId_mobile: { shopId: "shop-default-01", mobile } },
          update: { name, address: address || "" },
          create: {
            shopId: "shop-default-01",
            name,
            mobile,
            address: address || "",
            khaataAccount: {
              create: { balance: 0, creditLimit: 10000 },
            },
          },
          include: { khaataAccount: true },
        });
        return NextResponse.json({ success: true, customer });
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

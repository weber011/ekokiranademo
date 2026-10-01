import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - 6);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Run all aggregation queries in parallel
      // Fetch base data in a small, resilient batch
      const [allOrders, customerCount, allInventory] = await Promise.all([
        prisma.order.findMany({
          where: { orderStatus: { not: "CANCELLED" } },
          include: {
            items: { include: { product: { include: { category: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.customer.count({ where: { shopId: "shop-default-01" } }),
        prisma.inventory.findMany(),
      ]);

      // Calculate time-based aggregates in memory from allOrders
      const todayOrderList = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);
      const todaySales = todayOrderList.reduce((sum, o) => sum + o.total, 0);
      const todayOrdersCount = todayOrderList.length;

      const thisWeekSales = allOrders
        .filter((o) => new Date(o.createdAt) >= weekStart)
        .reduce((sum, o) => sum + o.total, 0);

      const thisMonthSales = allOrders
        .filter((o) => new Date(o.createdAt) >= monthStart)
        .reduce((sum, o) => sum + o.total, 0);

      const pendingPayments = allOrders.filter((o) => o.paymentStatus === "INITIATED").length;

      // Compute top products from order items
      const productMap = new Map<string, { name: string; quantitySold: number; revenue: number }>();
      for (const order of allOrders) {
        for (const item of order.items) {
          const current = productMap.get(item.productId) || { name: item.name, quantitySold: 0, revenue: 0 };
          current.quantitySold += item.quantity;
          current.revenue += item.totalPrice;
          productMap.set(item.productId, current);
        }
      }
      const topProducts = Array.from(productMap.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      // Build last 7 days chart data
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const salesLast7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(todayStart.getDate() - i);
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);
        const dayName = i === 0 ? "Today" : dayNames[d.getDay()];
        const formattedDate = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

        const dayOrders = allOrders.filter((o) => {
          const t = new Date(o.createdAt);
          return t >= d && t < nextDay;
        });

        salesLast7Days.push({
          day: dayName,
          date: formattedDate,
          sales: dayOrders.reduce((s, o) => s + o.total, 0),
          orders: dayOrders.length,
        });
      }

      // Category distribution
      const categorySalesMap = new Map<string, number>();
      let totalCategorizedRevenue = 0;
      allOrders.forEach((o) => {
        o.items.forEach((it) => {
          const cat = it.product?.category?.name || "Other";
          categorySalesMap.set(cat, (categorySalesMap.get(cat) || 0) + it.totalPrice);
          totalCategorizedRevenue += it.totalPrice;
        });
      });

      const topCategories = Array.from(categorySalesMap.entries())
        .map(([name, amount]) => ({
          name,
          share: `${totalCategorizedRevenue > 0 ? Math.round((amount / totalCategorizedRevenue) * 100) : 0}%`,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      // Inventory summary
      const inStock = allInventory.filter((i) => i.stock > i.reorderLevel).length;
      const lowStock = allInventory.filter((i) => i.stock > 0 && i.stock <= i.reorderLevel).length;
      const outOfStock = allInventory.filter((i) => i.stock <= 0).length;

      const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
      const avgOrderValue = allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0;

      return NextResponse.json({
        success: true,
        kpis: {
          todaySales,
          todayOrders: todayOrdersCount,
          pendingPayments,
          lowStock,
          outOfStock,
          thisWeekSales,
          thisMonthSales,
          totalOrders: allOrders.length,
          averageOrderValue: avgOrderValue,
          paymentSuccessRate:
            allOrders.length > 0
              ? Math.round(
                  (allOrders.filter((o) => o.paymentStatus === "SUCCESS").length / allOrders.length) * 100 * 10
                ) / 10
              : 0,
          totalCustomers: customerCount,
        },
        salesLast7Days,
        topCategories:
          topCategories.length > 0
            ? topCategories
            : [
                { name: "Dairy", share: "35%", amount: 0 },
                { name: "Grains", share: "30%", amount: 0 },
                { name: "Snacks", share: "20%", amount: 0 },
              ],
        topProducts,
      });
    }
  } catch (err: any) {
    console.warn("Prisma analytics fallback:", err);
  }

  // In-memory fallback
  const { db } = await import("@/lib/db/store");
  const orders = db.getOrders();
  const products = db.getProducts();
  const customers = db.getCustomers();

  const validOrders = orders.filter((o) => o.paymentStatus === "SUCCESS" || o.orderStatus !== "CANCELLED");
  const todaySales = validOrders
    .filter((o) => o.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, o) => sum + o.total, 0);

  return NextResponse.json({
    success: true,
    kpis: {
      todaySales,
      todayOrders: 0,
      pendingPayments: orders.filter((o) => o.paymentStatus === "PENDING").length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
      thisWeekSales: 0,
      thisMonthSales: 0,
      totalOrders: validOrders.length,
      averageOrderValue: 0,
      paymentSuccessRate: 0,
      totalCustomers: customers.length,
    },
    salesLast7Days: [],
    topCategories: [],
    topProducts: [],
  });
}

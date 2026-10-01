import { PrismaClient, Role, PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { initialProducts } from "../data/products";
import { initialCustomers } from "../data/customers";
import { initialOrders } from "../data/orders";

// Use the DIRECT URL (no PgBouncer) for seeding to avoid P1017 drops
const directUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: { url: directUrl },
  },
  log: ["warn", "error"],
});

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt === retries) throw e;
      console.warn(`  ⚠️  Attempt ${attempt} failed (${e.code || e.message}), retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
      await prisma.$disconnect();
      await prisma.$connect();
    }
  }
  throw new Error("Unreachable");
}

async function main() {
  console.log("🌱 Starting Digital Kirana Database Seeding...");
  await prisma.$connect();

  // 1. Create Default Kirana Shop
  const shop = await withRetry(() =>
    prisma.shop.upsert({
      where: { id: "shop-default-01" },
      update: {},
      create: {
        id: "shop-default-01",
        name: "Sharma General Store",
        ownerName: "Ramesh Sharma",
        mobile: "+91 98351 24567",
        city: "Ranchi",
        state: "Jharkhand",
        address: "Shop No. 4, Ground Floor, Kanke Road Market Complex, Ranchi",
        isOpen: true,
      },
    })
  );
  console.log(`✅ Seeded Shop: ${shop.name}`);

  // 2. Create Merchant User (no bcrypt dependency)
  await withRetry(() =>
    prisma.user.upsert({
      where: { mobile: "+91 98351 24567" },
      update: {},
      create: {
        name: "Ramesh Sharma",
        mobile: "+91 98351 24567",
        email: "sharma.kirana@eko.in",
        passwordHash: "$2a$10$placeholder_hash_for_demo",
        role: Role.MERCHANT,
        shopId: shop.id,
      },
    })
  );
  console.log("✅ Seeded Users");

  // 3. Extract & Seed Unique Categories (batch)
  const uniqueCategories = Array.from(new Set(initialProducts.map((p) => p.category)));
  const categoryMap = new Map<string, string>();

  for (const catName of uniqueCategories) {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const cat = await withRetry(() =>
      prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName, slug, description: `${catName} grocery products` },
      })
    );
    categoryMap.set(catName, cat.id);
  }
  console.log(`✅ Seeded ${uniqueCategories.length} Categories`);

  // 4. Seed Products & Inventory — one at a time with reconnect on failure
  let productCount = 0;
  for (const p of initialProducts) {
    const categoryId = categoryMap.get(p.category) || "";
    if (!categoryId) {
      console.warn(`  ⚠️  Skipping product ${p.name} — no category ID`);
      continue;
    }

    await withRetry(async () => {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          price: p.price,
          mrp: p.mrp,
          isAvailable: (p as any).stock > 0,
        },
        create: {
          id: p.id,
          shopId: shop.id,
          categoryId,
          name: p.name,
          brand: p.brand,
          unit: p.unit,
          mrp: p.mrp,
          price: p.price,
          image: p.image,
          description: p.description,
          isAvailable: (p as any).stock > 0,
          tags: (p as any).tags || [],
        },
      });

      await prisma.inventory.upsert({
        where: { productId: p.id },
        update: { stock: (p as any).stock, reorderLevel: (p as any).reorderLevel },
        create: {
          productId: p.id,
          stock: (p as any).stock,
          reorderLevel: (p as any).reorderLevel || 5,
        },
      });
    });
    productCount++;
    if (productCount % 10 === 0) {
      console.log(`  → Seeded ${productCount} products so far...`);
      // Small pause to avoid overwhelming the serverless DB
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`✅ Seeded ${productCount} Products with Inventory`);

  // 5. Seed Customers & Khaata Accounts
  let customerCount = 0;
  for (const c of initialCustomers) {
    await withRetry(async () => {
      const existing = await prisma.customer.findFirst({
        where: { shopId: shop.id, mobile: c.mobile },
      });

      if (!existing) {
        await prisma.customer.create({
          data: {
            id: c.id,
            shopId: shop.id,
            name: c.name,
            mobile: c.mobile,
            address: c.address,
            khaataAccount: {
              create: { balance: 0, creditLimit: 10000 },
            },
          },
        });
      }
    });
    customerCount++;
  }
  console.log(`✅ Seeded ${customerCount} Customers with Khaata Accounts`);

  // 6. Seed Orders (skip if products not linked)
  let orderCount = 0;
  for (const o of initialOrders) {
    try {
      await withRetry(async () => {
        const exists = await prisma.order.findUnique({ where: { id: o.id } });
        if (exists) return;

        // Validate all product IDs exist
        for (const it of o.items) {
          const prod = await prisma.product.findUnique({ where: { id: it.productId } });
          if (!prod) throw new Error(`Product ${it.productId} not found for order ${o.id}`);
        }

        await prisma.order.create({
          data: {
            id: o.id,
            shopId: shop.id,
            customerName: o.customerName,
            customerMobile: o.customerMobile,
            deliveryAddress: o.deliveryAddress,
            subtotal: o.subtotal,
            deliveryFee: o.deliveryFee,
            total: o.total,
            paymentMethod: o.paymentMethod as PaymentMethod,
            paymentStatus: (o.paymentStatus === "PAID" ? "SUCCESS" : o.paymentStatus === "PENDING" ? "INITIATED" : o.paymentStatus) as PaymentStatus,
            orderStatus: (o.orderStatus === "PAID" ? "ACCEPTED" : o.orderStatus) as OrderStatus,
            transactionRef: (o as any).transactionId,
            items: {
              create: o.items.map((it) => ({
                productId: it.productId,
                name: it.name,
                brand: it.brand,
                unit: it.unit,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.totalPrice,
              })),
            },
          },
        });
      });
      orderCount++;
    } catch (e: any) {
      console.warn(`  ⚠️  Skipped order ${o.id}: ${e.message}`);
    }
  }
  console.log(`✅ Seeded ${orderCount} Orders`);
  console.log("🎉 Digital Kirana Database Seeding Completed!");
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

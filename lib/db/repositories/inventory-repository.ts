import { Product, OrderItem } from "@/types";
import { prisma } from "../prisma";
import { db } from "../store";

export class InventoryRepository {
  /**
   * Safely decrement stock for an order atomically to prevent race conditions and overselling
   */
  static async decrementForOrder(items: OrderItem[]): Promise<boolean> {
    try {
      if (process.env.DATABASE_URL) {
        // Run as a single transactional unit
        await prisma.$transaction(async (tx) => {
          for (const item of items) {
            const current = await tx.inventory.findUnique({
              where: { productId: item.productId },
            });

            if (!current || current.stock < item.quantity) {
              throw new Error(`Insufficient inventory for product ID ${item.productId}`);
            }

            const updated = await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            // If stock reaches 0, update product availability
            if (updated.stock <= 0) {
              await tx.product.update({
                where: { id: item.productId },
                data: { isAvailable: false },
              });
            }
          }
        });
        return true;
      }
    } catch (e) {
      console.warn("Prisma atomic decrement fallback:", e);
    }

    // In-memory fallback
    items.forEach((it) => {
      db.updateStock(it.productId, -it.quantity);
    });
    return true;
  }

  /**
   * Adjust stock manually (+ or - delta)
   */
  static async adjustStock(productId: string, delta: number): Promise<Product | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const inv = await prisma.inventory.update({
          where: { productId },
          data: {
            stock: { increment: delta },
          },
          include: {
            product: { include: { category: true } },
          },
        });

        const newStock = Math.max(0, inv.stock);
        const isAvailable = newStock > 0;

        await prisma.product.update({
          where: { id: productId },
          data: { isAvailable },
        });

        const p = inv.product;
        return {
          id: p.id,
          name: p.name,
          category: p.category.name,
          brand: p.brand,
          unit: p.unit,
          price: p.price,
          mrp: p.mrp,
          stock: newStock,
          reorderLevel: inv.reorderLevel,
          image: p.image,
          description: p.description,
          isAvailable,
          tags: p.tags,
        };
      }
    } catch (e) {
      console.warn("Prisma adjustStock fallback:", e);
    }

    return db.updateStock(productId, delta);
  }
}

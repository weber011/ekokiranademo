import { Product } from "@/types";
import { InventoryRepository } from "@/lib/db/repositories/inventory-repository";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { prisma } from "@/lib/db/prisma";
import { db } from "@/lib/db/store";

export class InventoryService {
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      if (process.env.DATABASE_URL) {
        const records = await prisma.inventory.findMany({
          where: { stock: { gt: 0, lte: prisma.inventory.fields.reorderLevel as any } },
          include: { product: { include: { category: true, inventory: true } } },
        });
        // Simpler: fetch all and filter
        const all = await ProductRepository.getProducts();
        return all.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
      }
    } catch (e) {
      console.warn("Prisma getLowStock fallback:", e);
    }
    return db.getProducts().filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
  }

  static async getOutOfStockProducts(): Promise<Product[]> {
    try {
      if (process.env.DATABASE_URL) {
        const all = await ProductRepository.getProducts();
        return all.filter((p) => p.stock <= 0);
      }
    } catch (e) {
      console.warn("Prisma getOutOfStock fallback:", e);
    }
    return db.getProducts().filter((p) => p.stock <= 0);
  }

  static async getInventorySummary() {
    try {
      if (process.env.DATABASE_URL) {
        const products = await ProductRepository.getProducts();
        const totalItems = products.length;
        const inStock = products.filter((p) => p.stock > p.reorderLevel).length;
        const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length;
        const outOfStock = products.filter((p) => p.stock <= 0).length;
        const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
        return { totalItems, inStock, lowStock, outOfStock, totalInventoryValue };
      }
    } catch (e) {
      console.warn("Prisma getInventorySummary fallback:", e);
    }
    const products = db.getProducts();
    return {
      totalItems: products.length,
      inStock: products.filter((p) => p.stock > p.reorderLevel).length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
      totalInventoryValue: products.reduce((acc, p) => acc + p.price * p.stock, 0),
    };
  }

  static async adjustStock(productId: string, newStock: number): Promise<Product | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const current = await prisma.inventory.findUnique({ where: { productId } });
        if (current) {
          const delta = newStock - current.stock;
          return InventoryRepository.adjustStock(productId, delta);
        }
      }
    } catch (e) {
      console.warn("Prisma adjustStock fallback:", e);
    }
    const product = db.getProductById(productId);
    if (!product) return undefined;
    product.stock = Math.max(0, newStock);
    product.isAvailable = product.stock > 0;
    return db.saveProduct(product);
  }

  static async decrementForOrder(items: { productId: string; quantity: number }[]): Promise<void> {
    await InventoryRepository.decrementForOrder(items as any);
  }

  static async restoreForOrder(items: { productId: string; quantity: number }[]): Promise<void> {
    for (const item of items) {
      await InventoryRepository.adjustStock(item.productId, item.quantity);
    }
  }
}

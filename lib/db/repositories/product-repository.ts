import { Product } from "@/types";
import { prisma } from "../prisma";
import { db } from "../store";

export interface ProductFilterOptions {
  query?: string;
  category?: string;
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class ProductRepository {
  /**
   * Fetch all products with search, category filtering, and inventory status
   */
  static async getProducts(options: ProductFilterOptions = {}): Promise<Product[]> {
    try {
      if (process.env.DATABASE_URL) {
        const whereClause: any = { isActive: true };

        if (options.category && options.category !== "All") {
          whereClause.category = { name: { equals: options.category, mode: "insensitive" } };
        }

        if (options.query && options.query.trim()) {
          const q = options.query.trim();
          whereClause.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ];
        }

        const records = await prisma.product.findMany({
          where: whereClause,
          include: { category: true, inventory: true },
          take: options.limit || 100,
          skip: options.offset || 0,
          orderBy: { name: "asc" },
        });

        return records.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category.name,
          brand: p.brand,
          unit: p.unit,
          price: p.price,
          mrp: p.mrp,
          stock: p.inventory?.stock ?? 0,
          reorderLevel: p.inventory?.reorderLevel ?? 5,
          image: p.image,
          description: p.description,
          isAvailable: (p.inventory?.stock ?? 0) > 0,
          tags: p.tags,
        }));
      }
    } catch (e) {
      console.warn("Prisma query failed, utilizing store fallback:", e);
    }

    // Fallback / In-Memory
    return db.searchProducts(options.query || "", options.category);
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id: string): Promise<Product | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const p = await prisma.product.findUnique({
          where: { id },
          include: { category: true, inventory: true },
        });

        if (p) {
          return {
            id: p.id,
            name: p.name,
            category: p.category.name,
            brand: p.brand,
            unit: p.unit,
            price: p.price,
            mrp: p.mrp,
            stock: p.inventory?.stock ?? 0,
            reorderLevel: p.inventory?.reorderLevel ?? 5,
            image: p.image,
            description: p.description,
            isAvailable: (p.inventory?.stock ?? 0) > 0,
            tags: p.tags,
          };
        }
      }
    } catch (e) {
      console.warn("Prisma getProductById fallback:", e);
    }

    return db.getProductById(id);
  }

  /**
   * Save or Update product
   */
  static async saveProduct(product: Product): Promise<Product> {
    try {
      if (process.env.DATABASE_URL) {
        // Upsert Category
        const category = await prisma.category.upsert({
          where: { name: product.category },
          update: {},
          create: { name: product.category, slug: product.category.toLowerCase().replace(/\s+/g, "-") },
        });

        // Upsert Product & Inventory
        const saved = await prisma.product.upsert({
          where: { id: product.id },
          update: {
            name: product.name,
            brand: product.brand,
            unit: product.unit,
            price: product.price,
            mrp: product.mrp,
            image: product.image,
            description: product.description,
            isAvailable: product.stock > 0,
            tags: product.tags || [],
            categoryId: category.id,
          },
          create: {
            id: product.id,
            shopId: "shop-default-01",
            categoryId: category.id,
            name: product.name,
            brand: product.brand,
            unit: product.unit,
            price: product.price,
            mrp: product.mrp,
            image: product.image,
            description: product.description,
            isAvailable: product.stock > 0,
            tags: product.tags || [],
          },
        });

        await prisma.inventory.upsert({
          where: { productId: saved.id },
          update: {
            stock: product.stock,
            reorderLevel: product.reorderLevel,
          },
          create: {
            productId: saved.id,
            stock: product.stock,
            reorderLevel: product.reorderLevel,
          },
        });
      }
    } catch (e) {
      console.warn("Prisma saveProduct fallback:", e);
    }

    return db.saveProduct(product);
  }
}

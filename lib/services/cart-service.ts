import { prisma } from "@/lib/db/prisma";
import { db } from "@/lib/db/store";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { Cart, CartItem } from "@/types";

// Helper to map Prisma cart to our Cart type
async function mapPrismaCart(
  cartRecord: { id: string; sessionId: string; subtotal: number; deliveryFee: number; total: number; updatedAt: Date; createdAt: Date; items: any[] }
): Promise<Cart> {
  return {
    id: cartRecord.sessionId,
    items: cartRecord.items.map((ci: any) => ({
      productId: ci.productId,
      product: {
        id: ci.productId,
        name: ci.product?.name || ci.productId,
        category: ci.product?.category?.name || "General",
        brand: ci.product?.brand || "",
        unit: ci.product?.unit || "",
        price: ci.unitPrice,
        mrp: ci.product?.mrp || ci.unitPrice,
        stock: ci.product?.inventory?.stock || 0,
        reorderLevel: ci.product?.inventory?.reorderLevel || 5,
        image: ci.product?.image || "📦",
        description: ci.product?.description || "",
        isAvailable: (ci.product?.inventory?.stock || 0) > 0,
        tags: ci.product?.tags || [],
      },
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      totalPrice: ci.totalPrice,
    })),
    subtotal: cartRecord.subtotal,
    deliveryFee: cartRecord.deliveryFee,
    total: cartRecord.total,
    updatedAt: cartRecord.updatedAt.toISOString(),
  };
}

function computeTotals(items: { unitPrice: number; quantity: number }[]) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = subtotal > 0 && subtotal < 500 ? 30 : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export class CartService {
  static async getCart(cartId: string): Promise<Cart> {
    try {
      if (process.env.DATABASE_URL) {
        const cart = await prisma.cart.upsert({
          where: { sessionId: cartId },
          update: {},
          create: {
            sessionId: cartId,
            subtotal: 0,
            deliveryFee: 0,
            total: 0,
          },
          include: {
            items: {
              include: {
                product: {
                  include: { category: true, inventory: true },
                },
              },
            },
          },
        });
        return mapPrismaCart(cart);
      }
    } catch (e) {
      console.warn("Prisma getCart fallback:", e);
    }
    return db.getCart(cartId);
  }

  static async addToCart(
    cartId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{ cart: Cart; message: string; success: boolean; addedQuantity: number }> {
    const product = await ProductRepository.getProductById(productId);
    if (!product) {
      const fallbackCart = await this.getCart(cartId);
      return { cart: fallbackCart, message: "Product not found", success: false, addedQuantity: 0 };
    }

    if (product.stock <= 0) {
      const fallbackCart = await this.getCart(cartId);
      return {
        cart: fallbackCart,
        message: `${product.name} is currently out of stock.`,
        success: false,
        addedQuantity: 0,
      };
    }

    try {
      if (process.env.DATABASE_URL) {
        // Ensure cart exists
        const cart = await prisma.cart.upsert({
          where: { sessionId: cartId },
          update: {},
          create: { sessionId: cartId, subtotal: 0, deliveryFee: 0, total: 0 },
          include: { items: true },
        });

        const existingItem = cart.items.find((i) => i.productId === productId);
        const currentQty = existingItem ? existingItem.quantity : 0;
        const requestedTotal = currentQty + quantity;

        let actualToAdd = quantity;
        let message = `Added ${quantity} ${product.unit} of ${product.name} to cart.`;

        if (requestedTotal > product.stock) {
          const allowed = product.stock - currentQty;
          if (allowed <= 0) {
            const fullCart = await this.getCart(cartId);
            return {
              cart: fullCart,
              message: `Cannot add more. Only ${product.stock} units of ${product.name} available.`,
              success: false,
              addedQuantity: 0,
            };
          }
          actualToAdd = allowed;
          message = `Only ${product.stock} units available. Added ${allowed} to reach maximum stock.`;
        }

        const newQty = currentQty + actualToAdd;
        const totalPrice = product.price * newQty;

        await prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId } },
          update: { quantity: newQty, totalPrice },
          create: {
            cartId: cart.id,
            productId,
            quantity: newQty,
            unitPrice: product.price,
            totalPrice,
          },
        });

        // Recompute cart totals
        const updatedItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        const totals = computeTotals(updatedItems);
        await prisma.cart.update({
          where: { id: cart.id },
          data: totals,
        });

        const fullCart = await this.getCart(cartId);
        return { cart: fullCart, message, success: true, addedQuantity: actualToAdd };
      }
    } catch (e) {
      console.warn("Prisma addToCart fallback:", e);
    }

    // In-memory fallback
    const existingCart = db.getCart(cartId);
    const existingIndex = existingCart.items.findIndex((item) => item.productId === productId);
    const currentQtyInCart = existingIndex >= 0 ? existingCart.items[existingIndex].quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;
    let actualToAdd = quantity;
    let message = `Added ${quantity} ${product.unit} of ${product.name} to cart.`;
    if (requestedTotal > product.stock) {
      const allowed = product.stock - currentQtyInCart;
      if (allowed <= 0) {
        return { cart: existingCart, message: `Only ${product.stock} units available.`, success: false, addedQuantity: 0 };
      }
      actualToAdd = allowed;
      message = `Only ${product.stock} units available. Added ${allowed} to reach maximum stock.`;
    }
    if (existingIndex >= 0) {
      existingCart.items[existingIndex].quantity += actualToAdd;
      existingCart.items[existingIndex].totalPrice = existingCart.items[existingIndex].quantity * existingCart.items[existingIndex].unitPrice;
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity: actualToAdd,
        unitPrice: product.price,
        totalPrice: actualToAdd * product.price,
      };
      existingCart.items.push(newItem);
    }
    const updatedCart = db.saveCart(existingCart);
    return { cart: updatedCart, message, success: true, addedQuantity: actualToAdd };
  }

  static async updateQuantity(
    cartId: string,
    productId: string,
    quantity: number
  ): Promise<{ cart: Cart; message: string; success: boolean }> {
    if (quantity <= 0) {
      return this.removeFromCart(cartId, productId);
    }

    try {
      if (process.env.DATABASE_URL) {
        const cart = await prisma.cart.findUnique({ where: { sessionId: cartId }, include: { items: true } });
        if (!cart) {
          return { cart: await this.getCart(cartId), message: "Cart not found", success: false };
        }
        const existingItem = cart.items.find((i) => i.productId === productId);
        if (!existingItem) {
          return { cart: await this.getCart(cartId), message: "Item not found in cart", success: false };
        }

        const product = await ProductRepository.getProductById(productId);
        const clampedQty = product ? Math.min(quantity, product.stock) : quantity;

        await prisma.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId } },
          data: { quantity: clampedQty, totalPrice: existingItem.unitPrice * clampedQty },
        });

        const updatedItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        const totals = computeTotals(updatedItems);
        await prisma.cart.update({ where: { id: cart.id }, data: totals });

        const fullCart = await this.getCart(cartId);
        return { cart: fullCart, message: "Cart updated", success: true };
      }
    } catch (e) {
      console.warn("Prisma updateQuantity fallback:", e);
    }

    const cart = db.getCart(cartId);
    const existingIndex = cart.items.findIndex((item) => item.productId === productId);
    if (existingIndex < 0) return { cart, message: "Item not found in cart", success: false };
    cart.items[existingIndex].quantity = quantity;
    cart.items[existingIndex].totalPrice = quantity * cart.items[existingIndex].unitPrice;
    return { cart: db.saveCart(cart), message: "Cart updated", success: true };
  }

  static async removeFromCart(
    cartId: string,
    productId: string
  ): Promise<{ cart: Cart; message: string; success: boolean }> {
    try {
      if (process.env.DATABASE_URL) {
        const cart = await prisma.cart.findUnique({ where: { sessionId: cartId } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
          const updatedItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
          const totals = computeTotals(updatedItems);
          await prisma.cart.update({ where: { id: cart.id }, data: totals });
        }
        return { cart: await this.getCart(cartId), message: "Item removed from cart", success: true };
      }
    } catch (e) {
      console.warn("Prisma removeFromCart fallback:", e);
    }
    const cart = db.getCart(cartId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return { cart: db.saveCart(cart), message: "Item removed from cart", success: true };
  }

  static async clearCart(cartId: string): Promise<Cart> {
    try {
      if (process.env.DATABASE_URL) {
        const cart = await prisma.cart.findUnique({ where: { sessionId: cartId } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
          await prisma.cart.update({
            where: { id: cart.id },
            data: { subtotal: 0, deliveryFee: 0, total: 0 },
          });
        }
        return this.getCart(cartId);
      }
    } catch (e) {
      console.warn("Prisma clearCart fallback:", e);
    }
    return db.clearCart(cartId);
  }
}

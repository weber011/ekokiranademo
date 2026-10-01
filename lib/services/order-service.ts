import { Invoice, Order, OrderItem, PaymentMethod } from "@/types";
import { OrderRepository } from "@/lib/db/repositories/order-repository";
import { ProductRepository } from "@/lib/db/repositories/product-repository";
import { InventoryRepository } from "@/lib/db/repositories/inventory-repository";

export interface CreateOrderInput {
  cartId: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
}

export class OrderService {
  static async getOrders(statusFilter?: string): Promise<Order[]> {
    return OrderRepository.getOrders(statusFilter);
  }

  static async getOrder(orderId: string): Promise<Order | undefined> {
    return OrderRepository.getOrderById(orderId);
  }

  static async createOrder(
    items: OrderItem[],
    input: Omit<CreateOrderInput, "cartId">
  ): Promise<{ order: Order; message: string; success: boolean }> {
    if (!items || items.length === 0) {
      throw new Error("Cannot create order from an empty cart.");
    }

    // Validate stock and verify prices server-side
    const validatedItems: OrderItem[] = [];
    for (const cartItem of items) {
      const prod = await ProductRepository.getProductById(cartItem.productId);
      if (!prod) {
        throw new Error(`Product ${cartItem.name} is no longer available.`);
      }
      if (prod.stock < cartItem.quantity) {
        throw new Error(
          `Insufficient stock for ${prod.name}. Requested: ${cartItem.quantity}, Available: ${prod.stock}`
        );
      }
      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        brand: prod.brand,
        unit: prod.unit,
        quantity: cartItem.quantity,
        unitPrice: prod.price,
        totalPrice: prod.price * cartItem.quantity,
      });
    }

    const subtotal = validatedItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const deliveryFee = subtotal > 0 && subtotal < 500 ? 30 : 0;
    const total = subtotal + deliveryFee;

    // Generate sequential Order ID: DK-1049, DK-1050...
    let highestNum = 1048;
    try {
      if (process.env.DATABASE_URL) {
        const { prisma } = await import("@/lib/db/prisma");
        const lastOrder = await prisma.order.findFirst({
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (lastOrder) {
          const match = lastOrder.id.match(/^DK-(\d+)$/);
          if (match) highestNum = parseInt(match[1], 10);
        }
      }
    } catch (e) {}
    if (highestNum === 1048) {
      const { db } = await import("@/lib/db/store");
      const allOrders = db.getOrders();
      highestNum = allOrders.reduce((max, o) => {
        const match = o.id.match(/^DK-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 1048);
    }
    const newOrderId = `DK-${highestNum + 1}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const newOrder: Order = {
      id: newOrderId,
      customerName: input.customerName.trim() || "Walk-in Guest",
      customerMobile: input.customerMobile.trim() || "+91 98351 00000",
      deliveryAddress: input.deliveryAddress.trim() || "Sharma General Store Local Delivery",
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      createdAt: now.toISOString(),
      timeline: [
        {
          title: "Order Placed",
          time: timeStr,
          done: true,
          description: `Placed via Digital Kirana Store (${input.paymentMethod})`,
        },
        {
          title: "Payment Received",
          time: "Pending",
          done: false,
          description: "Awaiting financial settlement",
        },
        {
          title: "Order Confirmed",
          time: "Pending",
          done: false,
          description: "Store acceptance",
        },
        {
          title: "Preparing Items",
          time: "Pending",
          done: false,
          description: "Packing grocery basket",
        },
        {
          title: "Out for Delivery",
          time: "Pending",
          done: false,
          description: "Delivery executive assignment",
        },
        {
          title: "Delivered",
          time: "Pending",
          done: false,
          description: "Handover to customer",
        },
      ],
    };

    // If COD, immediately decrement inventory
    if (input.paymentMethod === "COD") {
      await InventoryRepository.decrementForOrder(validatedItems);
    }

    const saved = await OrderRepository.saveOrder(newOrder);
    return { order: saved, message: "Order created successfully", success: true };
  }

  static async updateOrderStatus(
    orderId: string,
    orderStatus: Order["orderStatus"],
    paymentStatus?: Order["paymentStatus"],
    transactionId?: string,
    note?: string
  ): Promise<Order | undefined> {
    return OrderRepository.updateOrderStatus(
      orderId,
      orderStatus as any,
      paymentStatus as any,
      transactionId,
      note
    );
  }

  static async generateInvoice(orderId: string): Promise<Invoice | null> {
    const order = await OrderRepository.getOrderById(orderId);
    if (!order) return null;

    const invNum = `INV-${order.id.replace("DK-", "")}`;
    return {
      invoiceNumber: invNum,
      orderId: order.id,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transactionRef: order.transactionId || `WB-DK-${order.id}`,
      date: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }
}

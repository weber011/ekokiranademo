import { Order, OrderStatus, PaymentStatus } from "@/types";
import { prisma } from "../prisma";
import { db } from "../store";

function toPrismaPaymentStatus(status?: string) {
  if (!status) return "INITIATED" as const;
  if (status === "PAID" || status === "SUCCESS") return "SUCCESS" as const;
  if (status === "FAILED") return "FAILED" as const;
  if (status === "REFUNDED") return "REFUNDED" as const;
  if (status === "PROCESSING") return "PROCESSING" as const;
  return "INITIATED" as const;
}

function toPrismaOrderStatus(status?: string) {
  if (!status) return "PENDING" as const;
  if (status === "PAID") return "ACCEPTED" as const;
  return status as any;
}

export class OrderRepository {
  static async getOrders(statusFilter?: string): Promise<Order[]> {
    try {
      if (process.env.DATABASE_URL) {
        const whereClause: any = {};
        if (statusFilter && statusFilter !== "ALL") {
          whereClause.orderStatus = statusFilter as any;
        }

        const orders = await prisma.order.findMany({
          where: whereClause,
          include: {
            items: true,
            statusHistory: { orderBy: { timestamp: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        });

        return orders.map((o) => ({
          id: o.id,
          customerName: o.customerName,
          customerMobile: o.customerMobile,
          deliveryAddress: o.deliveryAddress,
          items: o.items.map((it) => ({
            productId: it.productId,
            name: it.name,
            brand: it.brand,
            unit: it.unit,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          })),
          subtotal: o.subtotal,
          deliveryFee: o.deliveryFee,
          total: o.total,
          paymentMethod: o.paymentMethod as any,
          paymentStatus: o.paymentStatus as any,
          orderStatus: o.orderStatus as any,
          transactionId: o.transactionRef || undefined,
          createdAt: o.createdAt.toISOString(),
          timeline: o.statusHistory.map((h) => ({
            title: h.status.replace(/_/g, " "),
            time: h.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            done: true,
            description: h.note || undefined,
          })),
        }));
      }
    } catch (e) {
      console.warn("Prisma getOrders fallback:", e);
    }

    const orders = db.getOrders();
    if (!statusFilter || statusFilter === "ALL") return orders;
    return orders.filter((o) => o.orderStatus.toLowerCase() === statusFilter.toLowerCase());
  }

  static async getOrderById(orderId: string): Promise<Order | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const o = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            statusHistory: { orderBy: { timestamp: "asc" } },
          },
        });

        if (o) {
          return {
            id: o.id,
            customerName: o.customerName,
            customerMobile: o.customerMobile,
            deliveryAddress: o.deliveryAddress,
            items: o.items.map((it) => ({
              productId: it.productId,
              name: it.name,
              brand: it.brand,
              unit: it.unit,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
            })),
            subtotal: o.subtotal,
            deliveryFee: o.deliveryFee,
            total: o.total,
            paymentMethod: o.paymentMethod as any,
            paymentStatus: o.paymentStatus as any,
            orderStatus: o.orderStatus as any,
            transactionId: o.transactionRef || undefined,
            createdAt: o.createdAt.toISOString(),
            timeline: o.statusHistory.map((h) => ({
              title: h.status.replace(/_/g, " "),
              time: h.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              done: true,
              description: h.note || undefined,
            })),
          };
        }
      }
    } catch (e) {
      console.warn("Prisma getOrderById fallback:", e);
    }

    return db.getOrderById(orderId);
  }

  static async saveOrder(order: Order): Promise<Order> {
    try {
      if (process.env.DATABASE_URL) {
        const pStatus = toPrismaPaymentStatus(order.paymentStatus);
        const oStatus = toPrismaOrderStatus(order.orderStatus);

        await prisma.order.upsert({
          where: { id: order.id },
          update: {
            orderStatus: oStatus,
            paymentStatus: pStatus,
            transactionRef: order.transactionId,
          },
          create: {
            id: order.id,
            shopId: "shop-default-01",
            customerName: order.customerName,
            customerMobile: order.customerMobile,
            deliveryAddress: order.deliveryAddress,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            total: order.total,
            paymentMethod: order.paymentMethod as any,
            paymentStatus: pStatus,
            orderStatus: oStatus,
            transactionRef: order.transactionId,
            items: {
              create: order.items.map((it) => ({
                productId: it.productId,
                name: it.name,
                brand: it.brand,
                unit: it.unit,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.totalPrice,
              })),
            },
            statusHistory: {
              create: {
                status: oStatus,
                note: `Order placed (${order.paymentMethod})`,
                changedBy: "CUSTOMER",
              },
            },
          },
        });
      }
    } catch (e) {
      console.warn("Prisma saveOrder fallback:", e);
    }

    return db.saveOrder(order);
  }

  static async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    paymentStatus?: PaymentStatus,
    transactionId?: string,
    note?: string
  ): Promise<Order | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const oStatus = toPrismaOrderStatus(orderStatus);
        const pStatus = paymentStatus ? toPrismaPaymentStatus(paymentStatus) : undefined;

        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            orderStatus: oStatus,
            ...(pStatus ? { paymentStatus: pStatus } : {}),
            ...(transactionId ? { transactionRef: transactionId } : {}),
            statusHistory: {
              create: {
                status: oStatus,
                note: note || `Status transitioned to ${orderStatus}`,
                changedBy: "MERCHANT",
              },
            },
          },
          include: { items: true, statusHistory: true },
        });

        if (updated) {
          return this.getOrderById(orderId);
        }
      }
    } catch (e) {
      console.warn("Prisma updateOrderStatus fallback:", e);
    }

    return db.updateOrderStatus(orderId, orderStatus as any, paymentStatus as any, transactionId);
  }
}

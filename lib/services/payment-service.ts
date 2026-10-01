import { PaymentMethod, PaymentStatus, PaymentTransaction } from "@/types";
import { prisma } from "@/lib/db/prisma";
import { db } from "@/lib/db/store";
import { getEkoAdapter, isDemoEnvironment } from "@/lib/eko/eko-service";
import { OrderService } from "./order-service";
import { InventoryRepository } from "@/lib/db/repositories/inventory-repository";
import { OrderRepository } from "@/lib/db/repositories/order-repository";

export interface CreatePaymentInput {
  orderId: string;
  customerName: string;
  customerMobile: string;
  amount: number;
  paymentMethod: PaymentMethod;
  simulateFailure?: boolean;
}

export interface PaymentExecutionResult {
  success: boolean;
  internalTransactionId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  provider: "Eko";
  adapter: "MockEkoAdapter" | "EkoAdapter";
  environment: "Demo" | "Production";
  message: string;
  upiIntentUrl?: string;
  qrPayload?: string;
  timestamp: string;
}

export class PaymentService {
  static async createPayment(input: CreatePaymentInput): Promise<PaymentExecutionResult> {
    const order = await OrderRepository.getOrderById(input.orderId);
    if (!order) {
      throw new Error(`Order ${input.orderId} not found.`);
    }

    // Generate internal transaction reference: WB-DK-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderNum = input.orderId.replace(/\D/g, "");
    const internalTransactionId = `WB-DK-${dateStr}-${orderNum}`;

    const ekoAdapter = getEkoAdapter();
    const isDemo = isDemoEnvironment();

    // Call Eko Adapter Layer (Mock or Real)
    const ekoResponse = await ekoAdapter.createPayment({
      internalTransactionId,
      orderId: input.orderId,
      customerName: input.customerName,
      customerMobile: input.customerMobile,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      metadata: {
        simulateFailure: input.simulateFailure === true,
      },
    });

    const orderNum4 = input.orderId.replace(/\D/g, "");
    const paymentId = `pay-${orderNum4}`;

    // Persist to Neon PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        await prisma.paymentTransaction.upsert({
          where: { internalTransactionId: ekoResponse.transactionReference },
          update: {
            status: ekoResponse.status as any,
            updatedAt: new Date(),
          },
          create: {
            internalTransactionId: ekoResponse.transactionReference,
            orderId: input.orderId,
            shopId: "shop-default-01",
            customerName: input.customerName,
            amount: input.amount,
            provider: "Eko",
            adapter: isDemo ? "MockEkoAdapter" : "EkoAdapter",
            environment: isDemo ? "Demo" : "Production",
            method: input.paymentMethod as any,
            status: ekoResponse.status as any,
            upiIntentUrl: ekoResponse.upiIntentUrl,
            qrPayload: ekoResponse.qrPayload,
            note: isDemo ? "Powered through Eko Adapter — Demo Mode" : "Production Eko Gateway",
          },
        });
      }
    } catch (e) {
      console.warn("Prisma payment persist fallback:", e);
    }

    // In-memory fallback record
    const paymentRecord: PaymentTransaction = {
      id: paymentId,
      internalTransactionId: ekoResponse.transactionReference,
      orderId: input.orderId,
      customerName: input.customerName,
      amount: input.amount,
      provider: "Eko",
      adapter: isDemo ? "MockEkoAdapter" : "EkoAdapter",
      environment: isDemo ? "Demo" : "Production",
      method: input.paymentMethod,
      status: ekoResponse.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: isDemo ? "Powered through Eko Adapter — Demo Mode" : "Production Eko Gateway",
    };
    db.savePayment(paymentRecord);

    // Update order status based on payment result
    if (ekoResponse.status === "SUCCESS") {
      await this.settleOrderPayment(input.orderId, ekoResponse.transactionReference, order.items);
    } else if (ekoResponse.status === "FAILED") {
      await OrderService.updateOrderStatus(input.orderId, "CANCELLED", "FAILED", ekoResponse.transactionReference);
    } else {
      await OrderService.updateOrderStatus(input.orderId, "PENDING", "PENDING", ekoResponse.transactionReference);
    }

    return {
      success: ekoResponse.status !== "FAILED",
      internalTransactionId: ekoResponse.transactionReference,
      orderId: input.orderId,
      status: ekoResponse.status,
      amount: input.amount,
      provider: "Eko",
      adapter: isDemo ? "MockEkoAdapter" : "EkoAdapter",
      environment: isDemo ? "Demo" : "Production",
      message: ekoResponse.message,
      upiIntentUrl: ekoResponse.upiIntentUrl,
      qrPayload: ekoResponse.qrPayload,
      timestamp: ekoResponse.timestamp,
    };
  }

  static async confirmPaymentSettlement(
    transactionReference: string
  ): Promise<{ success: boolean; status: PaymentStatus; transaction: PaymentTransaction | null }> {
    let payment = db.getPaymentByInternalId(transactionReference);

    // Also check Prisma
    try {
      if (process.env.DATABASE_URL) {
        const prismaPayment = await prisma.paymentTransaction.findUnique({
          where: { internalTransactionId: transactionReference },
        });
        if (prismaPayment && !payment) {
          payment = {
            id: prismaPayment.id,
            internalTransactionId: prismaPayment.internalTransactionId,
            orderId: prismaPayment.orderId,
            customerName: prismaPayment.customerName,
            amount: prismaPayment.amount,
            provider: "Eko",
            adapter: prismaPayment.adapter as any,
            environment: prismaPayment.environment as any,
            method: prismaPayment.method as any,
            status: prismaPayment.status as any,
            createdAt: prismaPayment.createdAt.toISOString(),
            updatedAt: prismaPayment.updatedAt.toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("Prisma confirmPayment fallback:", e);
    }

    if (!payment) {
      return { success: false, status: "FAILED", transaction: null };
    }

    const ekoAdapter = getEkoAdapter();
    const statusResponse = await ekoAdapter.getPaymentStatus(transactionReference);

    payment.status = statusResponse.status;
    payment.updatedAt = new Date().toISOString();
    db.savePayment(payment);

    // Update Prisma
    try {
      if (process.env.DATABASE_URL) {
        await prisma.paymentTransaction.update({
          where: { internalTransactionId: transactionReference },
          data: { status: statusResponse.status as any, updatedAt: new Date() },
        });
      }
    } catch (e) {
      console.warn("Prisma payment status update fallback:", e);
    }

    if (statusResponse.status === "SUCCESS") {
      const order = await OrderRepository.getOrderById(payment.orderId);
      await this.settleOrderPayment(payment.orderId, transactionReference, order?.items || []);
    } else if (statusResponse.status === "FAILED") {
      await OrderService.updateOrderStatus(payment.orderId, "CANCELLED", "FAILED", transactionReference);
    }

    return {
      success: statusResponse.status === "SUCCESS",
      status: statusResponse.status,
      transaction: payment,
    };
  }

  private static async settleOrderPayment(
    orderId: string,
    transactionReference: string,
    items: { productId: string; quantity: number }[]
  ) {
    await OrderService.updateOrderStatus(orderId, "ACCEPTED", "SUCCESS", transactionReference);

    const order = await OrderRepository.getOrderById(orderId);
    if (order && order.paymentMethod !== "COD") {
      await InventoryRepository.decrementForOrder(items as any);
    }
  }

  static async getPayments(): Promise<PaymentTransaction[]> {
    try {
      if (process.env.DATABASE_URL) {
        const records = await prisma.paymentTransaction.findMany({
          orderBy: { createdAt: "desc" },
        });
        return records.map((r) => ({
          id: r.id,
          internalTransactionId: r.internalTransactionId,
          orderId: r.orderId,
          customerName: r.customerName,
          amount: r.amount,
          provider: "Eko",
          adapter: r.adapter as any,
          environment: r.environment as any,
          method: r.method as any,
          status: r.status as any,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          note: r.note || undefined,
        }));
      }
    } catch (e) {
      console.warn("Prisma getPayments fallback:", e);
    }
    return db.getPayments();
  }

  static async getPaymentByReference(ref: string): Promise<PaymentTransaction | undefined> {
    try {
      if (process.env.DATABASE_URL) {
        const r = await prisma.paymentTransaction.findUnique({
          where: { internalTransactionId: ref },
        });
        if (r) {
          return {
            id: r.id,
            internalTransactionId: r.internalTransactionId,
            orderId: r.orderId,
            customerName: r.customerName,
            amount: r.amount,
            provider: "Eko",
            adapter: r.adapter as any,
            environment: r.environment as any,
            method: r.method as any,
            status: r.status as any,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            note: r.note || undefined,
          };
        }
      }
    } catch (e) {
      console.warn("Prisma getPaymentByReference fallback:", e);
    }
    return db.getPaymentByInternalId(ref);
  }
}

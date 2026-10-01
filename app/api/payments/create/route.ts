import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, customerName, customerMobile, amount, paymentMethod, simulateFailure } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ success: false, error: "orderId and amount are required" }, { status: 400 });
    }

    const result = await PaymentService.createPayment({
      orderId,
      customerName: customerName || "Customer",
      customerMobile: customerMobile || "+91 98351 00000",
      amount: Number(amount),
      paymentMethod: paymentMethod || "UPI",
      simulateFailure: simulateFailure === true,
    });

    return NextResponse.json({
      success: result.success,
      payment: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

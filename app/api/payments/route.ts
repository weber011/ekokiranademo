import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    let payments = await PaymentService.getPayments();
    if (status !== "ALL") {
      payments = payments.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

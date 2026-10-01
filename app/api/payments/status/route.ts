import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/payment-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ success: false, error: "Transaction reference is required" }, { status: 400 });
    }

    const result = await PaymentService.confirmPaymentSettlement(ref);
    return NextResponse.json({
      success: result.success,
      status: result.status,
      transaction: result.transaction,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

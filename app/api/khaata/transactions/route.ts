import { NextRequest, NextResponse } from "next/server";
import { KhaataRepository } from "@/lib/db/repositories/khaata-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, type, amount, reference, note } = body;

    if (!customerId || !type || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction payload. customerId, type and positive amount are required." },
        { status: 400 }
      );
    }

    if (!["CREDIT", "DEBIT", "SETTLEMENT"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be CREDIT, DEBIT, or SETTLEMENT." },
        { status: 400 }
      );
    }

    const transaction = await KhaataRepository.recordTransaction({
      customerId,
      type,
      amount,
      reference,
      note,
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: `Successfully recorded ${type} transaction of ₹${amount}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

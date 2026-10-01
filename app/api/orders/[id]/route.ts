import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = OrderService.getOrder(id);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const invoice = OrderService.generateInvoice(id);

    return NextResponse.json({
      success: true,
      order,
      invoice,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { orderStatus, paymentStatus, transactionId } = body;

    const updated = OrderService.updateOrderStatus(id, orderStatus, paymentStatus, transactionId);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

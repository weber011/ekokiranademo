import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";
import { CartService } from "@/lib/services/cart-service";
import { OrderItem } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const orders = await OrderService.getOrders(status);
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, customerName, customerMobile, deliveryAddress, paymentMethod } = body;

    if (!cartId) {
      return NextResponse.json({ success: false, error: "cartId is required" }, { status: 400 });
    }

    // Load cart items from persistent store
    const cart = await CartService.getCart(cartId);
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    const orderItems: OrderItem[] = cart.items.map((item) => ({
      productId: item.productId,
      name: item.product?.name || "Item",
      brand: item.product?.brand || "",
      unit: item.product?.unit || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const result = await OrderService.createOrder(orderItems, {
      customerName: customerName || "Guest Customer",
      customerMobile: customerMobile || "+91 98351 00000",
      deliveryAddress: deliveryAddress || "Local Delivery, Ranchi",
      paymentMethod: paymentMethod || "UPI",
    });

    // Clear cart after order creation
    await CartService.clearCart(cartId);

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.order,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

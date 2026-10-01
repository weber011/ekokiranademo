import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId") || "default-session";
    const cart = await CartService.getCart(cartId);
    return NextResponse.json({ success: true, cart });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cartId = body.cartId || "default-session";
    const { productId, quantity } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
    }

    const result = await CartService.addToCart(cartId, productId, Number(quantity || 1));
    return NextResponse.json({
      success: result.success,
      message: result.message,
      cart: result.cart,
      addedQuantity: result.addedQuantity,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const cartId = body.cartId || "default-session";
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ success: false, error: "productId and quantity are required" }, { status: 400 });
    }

    const result = await CartService.updateQuantity(cartId, productId, Number(quantity));
    return NextResponse.json({
      success: result.success,
      message: result.message,
      cart: result.cart,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId") || "default-session";
    const productId = searchParams.get("productId");

    if (productId) {
      const result = await CartService.removeFromCart(cartId, productId);
      return NextResponse.json({ success: result.success, message: result.message, cart: result.cart });
    } else {
      const cart = await CartService.clearCart(cartId);
      return NextResponse.json({ success: true, message: "Cart cleared", cart });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

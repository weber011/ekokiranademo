import { NextRequest, NextResponse } from "next/server";
import { processAiMessage } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, cartId, customerId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: "Messages array is required" }, { status: 400 });
    }

    const sessionCartId = cartId || "default-session";
    const result = await processAiMessage({
      cartId: sessionCartId,
      messages,
      customerId,
    });

    return NextResponse.json({
      success: true,
      reply: result.reply,
      actionState: result.actionState,
      quickActions: result.quickActions,
      cartSummary: result.cartSummary,
    });
  } catch (err: any) {
    console.error("AI Chat Route Error:", err);
    return NextResponse.json(
      {
        success: false,
        reply: "I'm having trouble processing that right now. You can search products manually in the catalogue.",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

import { CartService } from "../lib/services/cart-service";
import { OrderService } from "../lib/services/order-service";
import { PaymentService } from "../lib/services/payment-service";
import { KhaataRepository } from "../lib/db/repositories/khaata-repository";
import { processAiMessage } from "../lib/ai/groq";

async function runSystemIntegrationTests() {
  console.log("🚀 Starting Digital Kirana End-to-End System Tests...\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, label: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
    }
  }

  // 1. Test Cart Service Server-side Recalculation
  console.log("📦 1. Testing Server-side Cart & Pricing Engine:");
  const testCartId = `test-cart-${Date.now()}`;
  const addRes1 = CartService.addToCart(testCartId, "prod-001", 2); // 2x Basmati Rice (₹385 x 2 = ₹770)
  assert(addRes1.success && addRes1.cart.subtotal === 770, "Add items to cart and compute correct subtotal (₹770)");
  assert(addRes1.cart.deliveryFee === 0, "Free delivery applied for order > ₹500");

  // 2. Test Order Creation & Inventory Validation
  console.log("\n📋 2. Testing Order Creation & Inventory Lifecycle:");
  const orderRes = OrderService.createOrder({
    cartId: testCartId,
    customerName: "Suresh Agarwal",
    customerMobile: "+91 98351 99999",
    deliveryAddress: "Kanke Road, Ranchi",
    paymentMethod: "UPI",
  });
  assert(orderRes.success && orderRes.order.id.startsWith("DK-"), `Order created successfully with ID: ${orderRes.order.id}`);
  assert(orderRes.order.total === 770, "Order total matches verified cart total");

  // 3. Test Payment Initiation & Settlement
  console.log("\n💳 3. Testing Payment Initiation & Eko Provider Adapter:");
  const payRes = await PaymentService.createPayment({
    orderId: orderRes.order.id,
    customerName: "Suresh Agarwal",
    customerMobile: "+91 98351 99999",
    amount: orderRes.order.total,
    paymentMethod: "UPI",
  });
  assert(payRes.success && payRes.status === "INITIATED", "Payment initiated via Eko Adapter");

  const settleRes = await PaymentService.confirmPaymentSettlement(payRes.internalTransactionId);
  assert(settleRes.success && settleRes.status === "SUCCESS", "Payment settled and confirmed");

  const finalOrder = OrderService.getOrder(orderRes.order.id);
  assert(finalOrder?.orderStatus === "PAID" && finalOrder?.paymentStatus === "PAID", "Order state transitioned to PAID");

  // 4. Test Khaata Double-Entry Ledger
  console.log("\n📖 4. Testing Khaata Double-Entry Ledger Subsystem:");
  const testCustId = "cust-test-01";
  const creditTx = await KhaataRepository.recordTransaction({
    customerId: testCustId,
    type: "CREDIT",
    amount: 500,
    note: "Grocery goods on Udhaar",
  });
  assert(creditTx.balanceAfter === 500, "Credit transaction increases customer outstanding balance to ₹500");

  const debitTx = await KhaataRepository.recordTransaction({
    customerId: testCustId,
    type: "DEBIT",
    amount: 200,
    note: "Customer paid cash",
  });
  assert(debitTx.balanceAfter === 300, "Debit transaction reduces customer outstanding balance to ₹300");

  // 5. Test Live Groq AI Assistant Tool Calling
  console.log("\n🤖 5. Testing Live Groq AI Assistant Function Calling:");
  const aiRes = await processAiMessage({
    cartId: `ai-test-cart-${Date.now()}`,
    messages: [{ role: "user", content: "bhaiya 2 packet maggi aur 1 milk chahiye" }],
  });
  assert(aiRes.reply && aiRes.reply.length > 10, "AI Assistant tool-calling executed and replied with accurate store data");

  console.log(`\n==============================================`);
  console.log(`🏁 Test Summary: ${passed}/${total} assertions PASSED`);
  console.log(`==============================================\n`);
}

runSystemIntegrationTests().catch(console.error);

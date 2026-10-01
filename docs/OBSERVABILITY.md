# Digital Kirana — Observability & Diagnostics Guide

This guide details how to monitor, diagnose, and troubleshoot production issues across Digital Kirana (WebbyBuilder × Eko Bharat).

---

## 1. System Telemetry & Request Flow

Every customer and merchant interaction passes through standard layers:
```
Client (Browser / App)
    │
    ▼ [Request ID & Auth Context]
Next.js App Router API Handlers (/api/*)
    │
    ├── Service Layer (CartService, OrderService, PaymentService, InventoryService)
    │       │
    │       ├── PostgreSQL Database (Prisma ORM with Transactions)
    │       └── Groq AI Engine (Function Calling Tools)
    │
    └── Payment Provider Abstraction (EkoAdapter / Webhook Engine)
```

---

## 2. Diagnosing Critical Production Scenarios

### 2.1 Order Failure & Cart Errors
- **Symptom**: Customer receives `400 Bad Request` or "Insufficient stock" error during checkout.
- **Diagnostic Steps**:
  1. Check `orders` table and `order_status_history` for the order ID.
  2. Query `inventories` for the requested product IDs:
     ```sql
     SELECT p.name, i.stock, i.reserved_stock FROM products p
     JOIN inventories i ON i.product_id = p.id
     WHERE p.id IN ('prod-001', 'prod-009');
     ```
  3. Verify server logs for `[OrderService.createOrder]` exceptions.

### 2.2 Payment Settlement & Eko Webhook Failures
- **Symptom**: Customer paid money via UPI/QR, but the order stays in `PENDING` or transitions to `FAILED`.
- **Diagnostic Steps**:
  1. Check `payment_transactions` for the internal reference `WB-DK-YYYYMMDD-XXXX`:
     ```sql
     SELECT * FROM payment_transactions WHERE internal_transaction_id = 'WB-DK-20260908-1049';
     ```
  2. Check `webhook_events` table for received callbacks:
     ```sql
     SELECT event_id, event_type, status, processing_error, created_at
     FROM webhook_events
     ORDER BY created_at DESC LIMIT 10;
     ```
  3. **HMAC Signature Mismatch**: Verify that `EKO_SECRET` configured in `.env.production` matches the merchant webhook secret registered on the Eko developer portal.

### 2.3 Khaata Ledger Imbalance
- **Symptom**: Customer claims balance mismatch or paid amount not reflected.
- **Diagnostic Steps**:
  1. Query `khaata_transactions` ordered by `created_at`:
     ```sql
     SELECT type, amount, balance_after, reference, note, created_at
     FROM khaata_transactions
     WHERE account_id = 'acc-cust-001'
     ORDER BY created_at ASC;
     ```
  2. Verify that running balance equals:
     $$\text{Balance} = \sum \text{CREDIT} - \sum \text{DEBIT} - \sum \text{SETTLEMENT}$$

### 2.4 AI Assistant Hallucination / Tool Failures
- **Symptom**: AI response fails or states product details not in database.
- **Diagnostic Steps**:
  1. Check that `GROQ_API_KEY` is valid and quota is active.
  2. Inspect `[lib/ai/groq.ts]` tool call parameters. Tools strictly execute `db.searchProducts` or `ProductRepository.getProducts`—ensure the search term exists in the catalog.

---

## 3. Log Levels & Formatting
Production logs follow structured JSON format:
```json
{
  "timestamp": "2026-09-21T16:45:00.000Z",
  "level": "INFO",
  "requestId": "req_a1b2c3d4",
  "event": "ORDER_CREATED",
  "orderId": "DK-1051",
  "amount": 420.00,
  "paymentMethod": "UPI"
}
```

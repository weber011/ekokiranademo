# Digital Kirana — Production Codebase Audit (Phase 0)
**Project**: Digital Kirana (WebbyBuilder × Eko Bharat)  
**Date**: September 2026  
**Auditor**: Lead Systems Architect  

---

## 1. Executive Summary

Digital Kirana is currently structured as a Next.js 15 (App Router) + TypeScript monolithic application with Tailwind CSS for UI presentation. While it possesses an end-to-end user experience (Storefront, Cart, Checkout, Merchant Management Dashboards, AI conversational assistant, and Eko financial adapter architecture), the underlying data persistence layer is an **in-memory singleton (`StoreDatabase` using `Map<string, T>` initialized from static seed files)**.

To transform Digital Kirana into a production-grade Kirana OS, all stateful operations must be migrated to a durable relational database (PostgreSQL with Prisma ORM), protected with cryptographic authentication and role-based access controls (RBAC), and hardened with idempotent payment and webhook architectures.

---

## 2. Technical Stack Audit

| Dimension | Current State | Target Production State | Gap / Risk Level |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15.2.0 (App Router), React 19, Tailwind CSS 3.4 | Next.js 15 (App Router), React 19, Tailwind CSS | 🟢 Stable (Preserve existing UI) |
| **Backend / API** | Next.js Route Handlers (`app/api/*`) | Modular Service Layer + Next.js Route Handlers | 🟡 Medium (Need unified error handling & auth middleware) |
| **Database** | In-memory `Map` singleton (`lib/db/store.ts`) | PostgreSQL (managed instance e.g. Neon/Supabase/RDS) | 🔴 Critical Blocker |
| **ORM / Migration** | None (in-memory maps + JSON/TS files) | Prisma ORM with versioned SQL migrations | 🔴 Critical Blocker |
| **Authentication** | None (unprotected endpoints, simulated users) | JWT / Session cookies with argon2/bcrypt password hashing + RBAC | 🔴 Critical Blocker |
| **AI Assistant** | Groq SDK (`llama-3.3-70b-versatile`) + Tool calling + Local NLU fallback | Groq Tool Calling connected strictly to DB Service layer | 🟡 Medium (Must connect tools to real DB) |
| **Payment Gateway** | Adapter pattern (`MockEkoAdapter` vs `RealEkoAdapter`) | Clean `PaymentProvider` abstraction with verified Webhook engine | 🟡 Medium (Pending official Eko UAT credentials) |
| **Khaata Ledger** | Static customer spending metrics | Double-entry / immutable ledger transactions with running balance | 🔴 Critical Blocker |
| **Analytics** | Static metrics in `app/api/analytics/route.ts` | Real-time SQL aggregations over orders, items, and settlements | 🔴 High Risk |

---

## 3. Detailed Component & Route Audit

### 3.1 Storefront & Customer Experience
- **`/store`**:
  - *Current*: Lists 100+ grocery products filtered by category/search from `lib/db/store.ts`. Real-time stock display.
  - *Missing*: Database pagination, real customer session tracking.
- **`/store/cart`**:
  - *Current*: Client-side cart context synchronizing with server-side `CartService`.
  - *Missing*: Persistent multi-device customer cart stored in database, dynamic delivery fee calculations based on store rules.
- **`/store/checkout`**:
  - *Current*: Collects name, mobile, address, payment method. Simulates Eko adapter transitions (Initiated → Processing → Success/Failed).
  - *Missing*: Customer address book, strict server-side inventory locking/reservation before order placement, server-side verified payment receipt.

### 3.2 Merchant / Admin Dashboard
- **`/dashboard`**:
  - *Current*: High-level summary of today's sales, active orders, low stock warnings, quick actions.
  - *Missing*: Real DB aggregation for KPIs; currently calculates from in-memory orders.
- **`/dashboard/orders`**:
  - *Current*: Lists orders with status filtering (All, Pending, Paid, Preparing, Out for Delivery, Delivered, Cancelled). Allows updating status.
  - *Missing*: Order state machine validation (preventing illegal transitions like Delivered → Pending), audit logs of who changed the order status.
- **`/dashboard/inventory`**:
  - *Current*: Shows stock levels, reorder thresholds, quick stock +/- adjuster.
  - *Missing*: Batch restock history, supplier PO tracking, atomic decrementing to prevent race conditions.
- **`/dashboard/products`**:
  - *Current*: Catalog grid/table, add/edit/archive products.
  - *Missing*: Database persistence, soft-deletion handling (ensuring historical orders keep product references).
- **`/dashboard/customers`**:
  - *Current*: List of 26 customers with order counts and spent totals.
  - *Missing*: **Khaata Ledger Subsystem**: Customer credit/debit transaction log, payment reminder generation, statement export.
- **`/dashboard/payments`**:
  - *Current*: Eko settlement rail visualizer, transaction log, status checker.
  - *Missing*: Webhook event inbox, idempotency keys, real Eko UAT signature verification.
- **`/dashboard/analytics`**:
  - *Current*: Hardcoded 7-day revenue, top categories, top products in API response.
  - *Missing*: Dynamic SQL `GROUP BY` analytics over real order items and dates.

### 3.3 AI Assistant (`lib/ai/groq.ts`)
- *Current*: Supports Groq tool-calling with 9 functions (`search_products`, `get_product`, `add_to_cart`, `update_cart_quantity`, `remove_from_cart`, `get_cart`, `clear_cart`, `create_order`, `get_order_status`) and local NLU fallback.
- *Security & Truthfulness*: The prompt correctly instructs the model never to hallucinate prices or stock and only use tools.
- *Required Upgrade*: Connect tool execution strictly to database repository transactions.

---

## 4. Current Mocked & Simulated Areas

1. **`lib/db/store.ts`**: In-memory `Map` initialized from static files (`data/products.ts`, `data/customers.ts`, `data/orders.ts`, `data/payments.ts`). Server restart resets all mutations.
2. **`app/api/analytics/route.ts`**: Returns hardcoded arrays for `salesLast7Days`, `topCategories`, and `kpis.todaySales` (18,460).
3. **`lib/eko/mock-eko-adapter.ts`**: Simulates Eko UPI Intent, QR payload, and state transitions with a `setTimeout` timer.
4. **`app/dashboard/customers/page.tsx`**: Displays basic customer metadata but does not yet have an interactive Khata ledger (credit/debit transaction entry and balance reconciliation).
5. **Authentication**: No login/registration gate exists; admin dashboard and customer store are open to all visitors without token or role checks.

---

## 5. Production Blockers & Security Risks

1. **Data Loss on Cold Start**: Memory maps are wiped on deployment restarts.
2. **Missing Concurrency Control / Race Conditions**: Two concurrent orders for the same low-stock item can oversell if inventory is not locked transactionally in Postgres (`SELECT ... FOR UPDATE` or Prisma `$transaction`).
3. **Unprotected Admin & Customer Endpoints**: Anyone can call `POST /api/orders` or `PATCH /api/inventory` without authorization tokens.
4. **Webhook Spoofing**: Webhook endpoint must verify cryptographic HMAC-SHA256 signatures before modifying payment/order records.
5. **Idempotency Gaps**: Retrying a payment or order request must not create duplicate orders or double-charge customers.

---

## 6. Implementation Strategy & Next Steps

1. **Phase 1 & 2**: Install Prisma ORM, design normalized relational schema for PostgreSQL (Users, Shops, Products, Inventory, Customers, Carts, Orders, OrderItems, Payments, Khaata, WebhookEvents, AuditLogs), generate migrations and seeds.
2. **Phase 3**: Real Authentication (JWT/Cookie sessions, Password hashing with bcrypt, Roles: `CUSTOMER`, `MERCHANT`, `ADMIN`).
3. **Phase 4 & 5**: Connect Products & Inventory to PostgreSQL with transactional locking.
4. **Phase 6 & 7**: Persistent Cart & Order State Machine with Order Status History.
5. **Phase 8 & 9**: Checkout & Payment Engine with strict Eko Provider abstraction.
6. **Phase 10**: Idempotent Webhook Processing Engine.
7. **Phase 11**: Real Khaata Ledger with immutable transaction history.
8. **Phase 12 & 13**: Real Merchant Dashboard & Real Analytics calculated from live DB records.
9. **Phase 14 & 15**: AI Assistant connected directly to DB tools.
10. **Phase 16–27**: Observability, Testing, CI/CD, and Production Deployment.

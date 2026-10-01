# Digital Kirana — Production Roadmap (Phases 1 – 27)
**Goal**: Transform Digital Kirana from an in-memory prototype into an enterprise-ready, production-grade Kirana OS.

---

## Phase Matrix & Execution Schedule

### Phase 1: Production Architecture Foundation
- Configure environment schema validation (Zod/env vars).
- Set up server-side repository and service layers separating business logic from route handlers.
- Secure secrets (Groq API keys, JWT secrets, DB URLs).

### Phase 2: Database & Relational Modeling
- Introduce Prisma ORM with PostgreSQL database engine.
- Model entities:
  - `User` (id, email, mobile, passwordHash, role, shopId, createdAt, updatedAt)
  - `Shop` (id, name, ownerName, mobile, address, city, state, pincode, status, createdAt)
  - `Category` (id, name, slug, description, image)
  - `Product` (id, shopId, categoryId, name, brand, unit, sku, mrp, sellingPrice, image, description, isAvailable, isActive, createdAt)
  - `Inventory` (id, productId, stock, reservedStock, reorderLevel, updatedAt)
  - `Customer` (id, shopId, name, mobile, address, createdAt)
  - `Cart` & `CartItem` (id, customerId/sessionToken, items, subtotal, deliveryFee, total, updatedAt)
  - `Order` & `OrderItem` (id, shopId, customerId, customerName, customerMobile, deliveryAddress, subtotal, deliveryFee, total, paymentMethod, paymentStatus, orderStatus, createdAt)
  - `OrderStatusHistory` (id, orderId, status, note, changedBy, timestamp)
  - `PaymentTransaction` (id, internalRef, orderId, provider, adapter, environment, amount, method, status, upiIntentUrl, qrPayload, responsePayload, createdAt)
  - `KhaataAccount` & `KhaataTransaction` (id, customerId, balance, creditLimit, type, amount, reference, note, createdAt)
  - `WebhookEvent` (id, eventId, provider, eventType, payload, status, processedAt, createdAt)
  - `Notification` (id, recipient, type, title, body, status, sentAt)
  - `AuditLog` (id, userId, action, entity, entityId, metadata, timestamp)
- Build database migration scripts and production-safe seeding.

### Phase 3: Real Authentication & RBAC
- Role-Based Access Control (`CUSTOMER`, `MERCHANT`, `ADMIN`).
- Registration, Login, Session token verification (HTTP-only secure JWT cookies).
- Password hashing with bcrypt.
- Protection middleware on `/dashboard/*` and `/api/*` endpoints.

### Phase 4: Real Product Catalog
- Connect `/store` and `/dashboard/products` to PostgreSQL with Prisma.
- Search, filter by category/brand, pagination, stock status.
- Soft-deletion / deactivation to preserve historical order integrity.

### Phase 5: Real Inventory & Race Condition Prevention
- Database transaction-level locking (`SELECT FOR UPDATE` / `$transaction`) for inventory decrementing.
- Prevent negative inventory or overselling under concurrent order spikes.
- Low-stock threshold alerts for merchants.

### Phase 6: Real Persistent Cart
- Server-side cart validation and persistence.
- Recalculation of prices and fees on the server (never trust client totals).

### Phase 7: Real Order Lifecycle & State Machine
- Strict state machine: `PENDING` → `ACCEPTED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED` (or `CANCELLED`).
- Automated logging into `OrderStatusHistory` timeline.

### Phase 8: Real Checkout System
- Server-side customer/address validation.
- Inventory reservation during payment window.
- Transactional order creation linked to payment record.

### Phase 9: Eko Payment Provider Abstraction
- Unified `PaymentProvider` interface.
- `MockPaymentProvider` (labeled clearly as SANDBOX/TEST for local dev).
- `EkoPaymentProvider` ready for official Eko API contract & UAT credentials.
- Safe UPI Intent and dynamic Bharat QR generation.

### Phase 10: Robust Webhook System
- `/api/payments/webhook` with HMAC-SHA256 signature verification.
- Idempotency key checking using `WebhookEvent` table to prevent duplicate transaction credits.

### Phase 11: Real Khaata Ledger Subsystem
- Immutable double-entry ledger (`KhaataTransaction`: CREDIT / DEBIT / SETTLEMENT).
- Real-time customer balance derived from ledger records.
- Payment recording and WhatsApp reminder message payload generator.

### Phase 12: Real Merchant Dashboard
- Remove all hardcoded stats.
- Aggregate today's sales, pending orders, revenue, and active customers from live DB.
- Comprehensive Loading, Empty, and Error states with retry logic.

### Phase 13: Live Analytics Engine
- Dynamic SQL aggregations for 7-day/30-day revenue trends, category shares, top-selling items.
- Real calculation of Average Order Value (AOV) and Payment Success Rate.

### Phase 14 & 15: AI Shopping & Business Assistants
- Connect Groq tool calls directly to database service methods.
- Merchant analytics assistant querying actual SQL aggregated business metrics.
- Zero AI hallucinations: strict adherence to DB data.

### Phase 16: Notification Subsystem
- Event-driven notifications (`ORDER_CREATED`, `ORDER_CONFIRMED`, `OUT_FOR_DELIVERY`, `LOW_STOCK`).
- SMS / WhatsApp webhook simulation & production provider hooks.

### Phase 17: Security & Hardening
- Input validation (Zod schemas on all API inputs).
- Rate limiting on auth & order endpoints.
- Secret sanitization: zero keys exposed to browser bundle.

### Phase 18: Standardized Error Handling
- Structured API responses `{ success: boolean, data?: any, error?: { code, message, details } }`.
- User-friendly error banners on frontend; sanitized server logs.

### Phase 19: Idempotency Guarantees
- Idempotency-Key headers on order placement and payment execution.

### Phase 20: Observability & Logging
- Request IDs, audit logs, error tracking, structured JSON logs.
- Create `/docs/OBSERVABILITY.md`.

### Phase 21: Environment Management
- Strict separation of `.env.development`, `.env.staging`, `.env.production`.
- Clean `.env.example`.

### Phase 22: Versioned Database Migrations
- Prisma migration workflow (`prisma migrate deploy`).
- Development seed vs production zero-seed policy.

### Phase 23: Automated Integration & Unit Testing
- Test suites for: Cart → Order → Inventory deduction → Payment → Webhook → Khaata.
- Concurrency test for limited stock.

### Phase 24 – 27: Staging, CI/CD, Deployment & Readiness
- GitHub Actions CI pipeline (lint, typecheck, tests, build).
- Containerized or Vercel/Node.js production deployment with managed PostgreSQL.
- Create `/docs/DEPLOYMENT.md` and `/docs/PRODUCTION_READINESS.md`.

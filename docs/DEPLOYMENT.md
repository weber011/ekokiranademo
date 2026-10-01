# Digital Kirana — Production Deployment Guide

This guide provides end-to-end instructions for deploying Digital Kirana to a live production environment (Vercel / Node.js / Docker + Managed PostgreSQL).

---

## 1. Prerequisites & Environment Variables

Create `.env.production` (or configure in your cloud host dashboard):

```ini
# PostgreSQL Managed Database (Neon / Supabase / AWS RDS)
DATABASE_URL="postgresql://username:password@ep-sample-123.ap-south-1.neon.tech/digitalkirana?sslmode=require"

# Server Secrets
JWT_SECRET="generate-a-strong-32-char-random-jwt-secret-key"

# AI Configuration (Groq Cloud)
GROQ_API_KEY="gsk_your_groq_production_key"
GROQ_MODEL="qwen/qwen3.8-27b"

# Payment Gateway (Eko Bharat)
PAYMENT_PROVIDER="mock"  # Switch to 'eko' once UAT credentials are provided
EKO_API_KEY=""
EKO_INITIATOR_ID=""
EKO_SECRET=""
EKO_BASE_URL="https://api.eko.in/v1"

# Public Store Settings
NEXT_PUBLIC_STORE_NAME="Sharma General Store"
NEXT_PUBLIC_STORE_CITY="Ranchi, Jharkhand"
NEXT_PUBLIC_STORE_PHONE="+91 98351 24567"
NEXT_PUBLIC_STORE_STATUS="OPEN"
```

---

## 2. Database Migration & Seeding

Run database migrations against the production PostgreSQL instance:

```bash
# Apply Prisma schema migrations
npx prisma migrate deploy

# (Optional) Seed initial product catalog and store metadata
npx ts-node prisma/seed.ts
```

---

## 3. Deployment Options

### Option A: Vercel Deployment (Recommended)
1. Push the repository to GitHub.
2. Import the project into Vercel.
3. In **Settings > Environment Variables**, add all keys from `.env.production`.
4. Set Build Command: `prisma generate && next build`
5. Deploy!

### Option B: Node.js / Docker / VPS Deployment
1. Build the production application bundle:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```
3. Use a process manager such as `pm2` with reverse proxy (Nginx / Caddy) and SSL certs (Let's Encrypt).

---

## 4. Verification After Deployment

1. **Storefront**: Open `https://your-domain.com/store` and verify products load.
2. **AI Assistant**: Click the AI assistant bubble and send `"2 packet Maggi add kar do"` to confirm Groq tool execution.
3. **Cart & Checkout**: Proceed through `/store/cart` and complete checkout at `/store/checkout`.
4. **Merchant Dashboard**: Open `/dashboard` and verify real-time order and revenue updates.
5. **Khaata Ledger**: Open `/dashboard/customers`, click **Khaata**, and verify ledger transactions.

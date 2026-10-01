import { prisma } from "../prisma";

export interface KhaataAccountSummary {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  balance: number; // Positive = Customer owes, Negative = Advance
  creditLimit: number;
  totalCreditGiven: number;
  totalPaid: number;
  transactionsCount: number;
  lastTransactionDate?: string;
}

export interface KhaataTransactionRecord {
  id: string;
  accountId: string;
  type: "CREDIT" | "DEBIT" | "SETTLEMENT";
  amount: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  createdAt: string;
}

// In-Memory Ledger Store for zero-setup development
interface InMemoryKhaata {
  accounts: Map<string, { customerId: string; balance: number; creditLimit: number }>;
  transactions: KhaataTransactionRecord[];
}

const inMemoryKhaata: InMemoryKhaata = {
  accounts: new Map(),
  transactions: [],
};

export class KhaataRepository {
  /**
   * Get or create customer Khaata account
   */
  static async getAccount(customerId: string): Promise<{ id: string; balance: number; creditLimit: number }> {
    try {
      if (process.env.DATABASE_URL) {
        const acc = await prisma.khaataAccount.upsert({
          where: { customerId },
          update: {},
          create: {
            customerId,
            balance: 0,
            creditLimit: 10000,
          },
        });
        return { id: acc.id, balance: acc.balance, creditLimit: acc.creditLimit };
      }
    } catch (e) {
      console.warn("Prisma Khaata getAccount fallback:", e);
    }

    let acc = inMemoryKhaata.accounts.get(customerId);
    if (!acc) {
      acc = { customerId, balance: 0, creditLimit: 10000 };
      inMemoryKhaata.accounts.set(customerId, acc);
    }
    return { id: `acc-${customerId}`, balance: acc.balance, creditLimit: acc.creditLimit };
  }

  /**
   * Record an immutable transaction and update running balance atomically
   */
  static async recordTransaction(input: {
    customerId: string;
    type: "CREDIT" | "DEBIT" | "SETTLEMENT";
    amount: number;
    reference?: string;
    note?: string;
  }): Promise<KhaataTransactionRecord> {
    const { customerId, type, amount, reference, note } = input;

    try {
      if (process.env.DATABASE_URL) {
        const result = await prisma.$transaction(async (tx) => {
          let account = await tx.khaataAccount.findUnique({ where: { customerId } });
          if (!account) {
            account = await tx.khaataAccount.create({
              data: { customerId, balance: 0, creditLimit: 10000 },
            });
          }

          // Credit = Customer takes goods (balance increases), Debit/Settlement = Customer pays (balance decreases)
          const delta = type === "CREDIT" ? amount : -amount;
          const newBalance = account.balance + delta;

          await tx.khaataAccount.update({
            where: { id: account.id },
            data: { balance: newBalance },
          });

          const record = await tx.khaataTransaction.create({
            data: {
              accountId: account.id,
              type: type as any,
              amount,
              balanceAfter: newBalance,
              reference,
              note,
            },
          });

          return {
            id: record.id,
            accountId: record.accountId,
            type: record.type as any,
            amount: record.amount,
            balanceAfter: record.balanceAfter,
            reference: record.reference || undefined,
            note: record.note || undefined,
            createdAt: record.createdAt.toISOString(),
          };
        });

        return result;
      }
    } catch (e) {
      console.warn("Prisma Khaata recordTransaction fallback:", e);
    }

    const acc = await this.getAccount(customerId);
    const delta = type === "CREDIT" ? amount : -amount;
    acc.balance += delta;
    inMemoryKhaata.accounts.set(customerId, {
      customerId,
      balance: acc.balance,
      creditLimit: acc.creditLimit,
    });

    const record: KhaataTransactionRecord = {
      id: `ktx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: acc.id,
      type,
      amount,
      balanceAfter: acc.balance,
      reference,
      note,
      createdAt: new Date().toISOString(),
    };

    inMemoryKhaata.transactions.unshift(record);
    return record;
  }

  /**
   * Get transaction history for a customer's Khaata
   */
  static async getHistory(customerId: string): Promise<KhaataTransactionRecord[]> {
    try {
      if (process.env.DATABASE_URL) {
        const account = await prisma.khaataAccount.findUnique({
          where: { customerId },
          include: {
            transactions: { orderBy: { createdAt: "desc" } },
          },
        });

        if (account) {
          return account.transactions.map((t) => ({
            id: t.id,
            accountId: t.accountId,
            type: t.type as any,
            amount: t.amount,
            balanceAfter: t.balanceAfter,
            reference: t.reference || undefined,
            note: t.note || undefined,
            createdAt: t.createdAt.toISOString(),
          }));
        }
        return [];
      }
    } catch (e) {
      console.warn("Prisma Khaata getHistory fallback:", e);
    }

    const acc = await this.getAccount(customerId);
    return inMemoryKhaata.transactions.filter((t) => t.accountId === acc.id);
  }
}

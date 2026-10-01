import { NextRequest, NextResponse } from "next/server";
import { KhaataRepository } from "@/lib/db/repositories/khaata-repository";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (customerId) {
      const account = await KhaataRepository.getAccount(customerId);
      const history = await KhaataRepository.getHistory(customerId);

      // Fetch customer name from DB
      let customerName = "Customer";
      let customerMobile = "";
      try {
        if (process.env.DATABASE_URL) {
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { name: true, mobile: true },
          });
          customerName = customer?.name || "Customer";
          customerMobile = customer?.mobile || "";
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        account: { ...account, customerName, customerMobile },
        history,
      });
    }

    // Return all khaata accounts with customer details
    try {
      if (process.env.DATABASE_URL) {
        const accounts = await prisma.khaataAccount.findMany({
          include: {
            customer: { select: { id: true, name: true, mobile: true } },
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({
          success: true,
          accounts: accounts.map((a) => ({
            id: a.id,
            customerId: a.customerId,
            customerName: a.customer.name,
            customerMobile: a.customer.mobile,
            balance: a.balance,
            creditLimit: a.creditLimit,
            transactionsCount: a.transactions.length,
            lastTransaction: a.transactions[0]
              ? {
                  id: a.transactions[0].id,
                  type: a.transactions[0].type,
                  amount: a.transactions[0].amount,
                  balanceAfter: a.transactions[0].balanceAfter,
                  createdAt: a.transactions[0].createdAt.toISOString(),
                }
              : null,
          })),
        });
      }
    } catch (e) {
      console.warn("Prisma khaata list fallback:", e);
    }

    // Fallback: empty
    return NextResponse.json({ success: true, accounts: [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, type, amount, reference, note } = body;

    if (!customerId || !type || !amount) {
      return NextResponse.json(
        { success: false, error: "customerId, type, and amount are required" },
        { status: 400 }
      );
    }

    if (!["CREDIT", "DEBIT", "SETTLEMENT"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "type must be CREDIT, DEBIT, or SETTLEMENT" },
        { status: 400 }
      );
    }

    const transaction = await KhaataRepository.recordTransaction({
      customerId,
      type,
      amount: Number(amount),
      reference,
      note,
    });

    const account = await KhaataRepository.getAccount(customerId);

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: account.balance,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

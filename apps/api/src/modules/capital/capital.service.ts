import { Prisma, CapitalMovementType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

// The opening balance the business starts with. Recorded once as an INITIAL
// movement the first time the capital balance is ever read.
export const INITIAL_CAPITAL = 950;

// Prisma transaction client or the root client — capital movements are usually
// recorded inside the same transaction as the sale/refund/purchase they belong to.
type Db = Prisma.TransactionClient | typeof prisma;

export interface RecordMovementInput {
  type: CapitalMovementType;
  // Signed: positive adds to capital (a sale), negative removes from it (a purchase).
  amount: number;
  description?: string;
  saleId?: number;
  productId?: number;
}

export function recordCapitalMovement(db: Db, input: RecordMovementInput) {
  return db.capitalMovement.create({
    data: {
      type: input.type,
      amount: Math.round(input.amount * 100) / 100,
      description: input.description,
      saleId: input.saleId,
      productId: input.productId,
    },
  });
}

// Creates the opening INITIAL movement exactly once. Lazily invoked so the
// ledger seeds itself the first time capital is read, even on a DB that already
// had data before this feature existed.
async function ensureInitialMovement(db: Db) {
  const existing = await db.capitalMovement.findFirst({ where: { type: "INITIAL" } });
  if (!existing) {
    await recordCapitalMovement(db, {
      type: "INITIAL",
      amount: INITIAL_CAPITAL,
      description: "Opening capital balance",
    });
  }
}

// Current working capital = signed sum of every ledger movement.
export async function getCapitalBalance(): Promise<number> {
  await ensureInitialMovement(prisma);
  const { _sum } = await prisma.capitalMovement.aggregate({ _sum: { amount: true } });
  return Math.round(Number(_sum.amount ?? 0) * 100) / 100;
}

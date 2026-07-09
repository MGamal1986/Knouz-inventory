import { prisma } from "../lib/prisma";

/**
 * Generates the next unique product code for a category, e.g. RNG-0001, RNG-0002.
 * Runs inside a transaction so concurrent product creation never produces duplicates.
 */
export async function generateNextProductCode(categoryId: number): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw Object.assign(new Error("Category not found"), { status: 404 });
    }

    const nextSeq = category.lastSeq + 1;
    if (nextSeq > category.codeRangeEnd) {
      throw Object.assign(
        new Error(
          `Code range exhausted for category "${category.name}" (${category.codeRangeStart}-${category.codeRangeEnd})`
        ),
        { status: 400 }
      );
    }

    await tx.category.update({
      where: { id: categoryId },
      data: { lastSeq: nextSeq },
    });

    const padLength = String(category.codeRangeEnd).length;
    const padded = String(nextSeq).padStart(padLength, "0");
    return `${category.baseCode}-${padded}`;
  });
}

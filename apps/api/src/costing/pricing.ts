/**
 * selling price = original cost * (1 + profit% / 100)
 * Rounded to 2 decimal places for currency (EGP).
 */
export function calculateSellingPrice(originalCost: number, profitPercent: number): number {
  const price = originalCost * (1 + profitPercent / 100);
  return Math.round(price * 100) / 100;
}

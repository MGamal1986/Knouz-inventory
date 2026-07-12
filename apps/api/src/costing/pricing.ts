/**
 * selling price = original cost * (1 + profit% / 100)
 * Rounded to 2 decimal places for currency (EGP).
 */
export function calculateSellingPrice(originalCost: number, profitPercent: number): number {
  const price = originalCost * (1 + profitPercent / 100);
  return Math.round(price * 100) / 100;
}

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

/**
 * Applies a product's discount to its selling price. Clamped to [0, price] so a
 * FIXED discount larger than the price (or a bad PERCENTAGE value) never goes negative.
 */
export function calculateDiscountedPrice(
  price: number,
  discountType: DiscountType,
  discountValue: number
): number {
  let discounted = price;
  if (discountType === "PERCENTAGE") {
    discounted = price * (1 - discountValue / 100);
  } else if (discountType === "FIXED") {
    discounted = price - discountValue;
  }
  discounted = Math.min(price, Math.max(0, discounted));
  return Math.round(discounted * 100) / 100;
}

export function assertValidDiscount(discountType: DiscountType, discountValue: number) {
  if (discountValue < 0) {
    throw Object.assign(new Error("Discount value cannot be negative"), { status: 400 });
  }
  if (discountType === "PERCENTAGE" && discountValue > 100) {
    throw Object.assign(new Error("Percentage discount cannot exceed 100"), { status: 400 });
  }
}

type BadgeTone = "success" | "warning" | "error" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-emerald/10 text-success-emerald",
  warning: "bg-warning-amber/10 text-warning-amber",
  error: "bg-error/10 text-error",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

type ProductStatus = "IN_STOCK" | "SOLD" | "PARTIALLY_SOLD";

const productStatusLabel: Record<ProductStatus, string> = {
  IN_STOCK: "In Stock",
  SOLD: "Sold Out",
  PARTIALLY_SOLD: "Partial",
};

const productStatusTone: Record<ProductStatus, BadgeTone> = {
  IN_STOCK: "success",
  SOLD: "error",
  PARTIALLY_SOLD: "warning",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={productStatusTone[status]}>{productStatusLabel[status]}</Badge>;
}

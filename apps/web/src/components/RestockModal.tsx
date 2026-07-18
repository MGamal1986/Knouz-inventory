import { useState } from "react";
import { api } from "../api/client";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FormField, Input, Select } from "./ui/FormField";
import { DiscountType } from "./ProductFormModal";

interface RestockProduct {
  id: number;
  productCode: string;
  description: string;
  originalCost: string;
  profitPercent: string;
  discountType: DiscountType;
  discountValue: string;
}

interface RestockModalProps {
  product: RestockProduct;
  onClose: () => void;
  onRestocked: () => void;
}

export function RestockModal({ product, onClose, onRestocked }: RestockModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [originalCost, setOriginalCost] = useState(product.originalCost);
  const [profitPercent, setProfitPercent] = useState(product.profitPercent);
  const [discountType, setDiscountType] = useState<DiscountType>(product.discountType);
  const [discountValue, setDiscountValue] = useState(product.discountValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const computedSellingPrice =
    originalCost && profitPercent && Number(originalCost) > 0
      ? Number(originalCost) * (1 + Number(profitPercent) / 100)
      : 0;

  const discountedPrice = (() => {
    const price = computedSellingPrice;
    const value = Number(discountValue) || 0;
    if (discountType === "PERCENTAGE") return Math.max(0, price * (1 - value / 100));
    if (discountType === "FIXED") return Math.max(0, price - value);
    return price;
  })();

  async function onSubmit() {
    setError(null);
    const quantityValue = Number(quantity);
    if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
      setError("Enter a quantity greater than zero");
      return;
    }
    const costValue = Number(originalCost);
    if (!(costValue > 0)) {
      setError("Enter an original cost greater than zero");
      return;
    }
    const profitValue = Number(profitPercent);
    if (!(profitValue >= 0)) {
      setError("Enter a valid profit percentage");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/products/${product.id}/restock`, {
        quantity: quantityValue,
        originalCost: costValue,
        profitPercent: profitValue,
        discountType,
        discountValue: discountType === "NONE" ? 0 : Number(discountValue) || 0,
      });
      onRestocked();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to restock product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Restock — ${product.productCode}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            Add Stock
          </Button>
        </>
      }
    >
      <div className="space-y-lg">
        <p className="text-primary font-medium">{product.description}</p>

        <FormField label="Quantity to Add">
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <FormField label="Original Cost (EGP)">
            <Input
              type="number"
              step="0.01"
              value={originalCost}
              onChange={(e) => setOriginalCost(e.target.value)}
            />
          </FormField>

          <FormField label="Profit %">
            <Input
              type="number"
              step="0.01"
              value={profitPercent}
              onChange={(e) => setProfitPercent(e.target.value)}
            />
          </FormField>

          <FormField label="Selling Price (Calculated)">
            <Input readOnly value={`EGP ${computedSellingPrice.toFixed(2)}`} className="cursor-not-allowed" />
          </FormField>

          <FormField label="Discount Type">
            <Select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value as DiscountType);
                setDiscountValue("0");
              }}
            >
              <option value="NONE">No discount</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (EGP)</option>
            </Select>
          </FormField>

          {discountType !== "NONE" && (
            <FormField label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (EGP)"}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={discountType === "PERCENTAGE" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </FormField>
          )}

          {discountType !== "NONE" && (
            <FormField label="Price After Discount">
              <Input
                readOnly
                value={`EGP ${discountedPrice.toFixed(2)}`}
                className="cursor-not-allowed text-success-emerald font-medium"
              />
            </FormField>
          )}
        </div>

        {error && <div className="text-error text-body-sm">{error}</div>}
      </div>
    </Modal>
  );
}

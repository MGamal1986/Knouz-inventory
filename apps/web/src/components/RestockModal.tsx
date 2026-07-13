import { useState } from "react";
import { api } from "../api/client";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FormField, Input } from "./ui/FormField";

interface RestockProduct {
  id: number;
  productCode: string;
  description: string;
}

interface RestockModalProps {
  product: RestockProduct;
  onClose: () => void;
  onRestocked: () => void;
}

export function RestockModal({ product, onClose, onRestocked }: RestockModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    const value = Number(quantity);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter a quantity greater than zero");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/products/${product.id}/restock`, { quantity: value });
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
        {error && <div className="text-error text-body-sm">{error}</div>}
      </div>
    </Modal>
  );
}

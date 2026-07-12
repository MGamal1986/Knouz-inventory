import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FormField, Textarea, Input } from "./ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "./ui/Table";

interface SaleItemDetail {
  id: number;
  quantity: number;
  refundedQuantity: number;
  unitPrice: string;
  product: { productCode: string; description: string };
}
interface SaleDetail {
  id: number;
  invoiceNumber: string;
  items: SaleItemDetail[];
}

interface RefundModalProps {
  saleId: number;
  onClose: () => void;
  onRefunded: () => void;
}

export function RefundModal({ saleId, onClose, onRefunded }: RefundModalProps) {
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/api/sales/${saleId}`).then((res) => setSale(res.data));
  }, [saleId]);

  function refundableQty(item: SaleItemDetail) {
    return item.quantity - item.refundedQuantity;
  }

  function setQty(itemId: number, value: string, max: number) {
    const clamped = Math.max(0, Math.min(max, Number(value) || 0));
    setQuantities((prev) => ({ ...prev, [itemId]: String(clamped) }));
  }

  const itemsToRefund =
    sale?.items
      .map((item) => ({ saleItemId: item.id, quantity: Number(quantities[item.id] || 0) }))
      .filter((i) => i.quantity > 0) || [];

  const refundTotal =
    sale?.items.reduce((sum, item) => {
      const qty = Number(quantities[item.id] || 0);
      return sum + qty * Number(item.unitPrice);
    }, 0) || 0;

  async function onSubmit() {
    setError(null);
    if (itemsToRefund.length === 0) {
      setError("Enter a refund quantity for at least one item");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/sales/${saleId}/refunds`, { items: itemsToRefund, reason: reason || undefined });
      onRefunded();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process refund");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={sale ? `Refund — ${sale.invoiceNumber}` : "Refund"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting || itemsToRefund.length === 0}>
            Refund EGP {refundTotal.toFixed(2)}
          </Button>
        </>
      }
    >
      {!sale ? (
        <p className="text-on-surface-variant">Loading...</p>
      ) : (
        <div className="space-y-lg">
          <Table>
            <Thead>
              <tr>
                <Th>Product</Th>
                <Th className="text-center">Sold</Th>
                <Th className="text-center">Already Refunded</Th>
                <Th className="text-center">Refund Qty</Th>
              </tr>
            </Thead>
            <Tbody>
              {sale.items.map((item) => {
                const max = refundableQty(item);
                return (
                  <Tr key={item.id}>
                    <Td>
                      <div className="text-code-label font-code-label text-on-surface-variant">
                        {item.product.productCode}
                      </div>
                      <div className="text-primary">{item.product.description}</div>
                    </Td>
                    <Td className="text-center">{item.quantity}</Td>
                    <Td className="text-center">{item.refundedQuantity}</Td>
                    <Td className="text-center">
                      {max === 0 ? (
                        <span className="text-on-surface-variant text-body-sm">Fully refunded</span>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          max={max}
                          value={quantities[item.id] || ""}
                          onChange={(e) => setQty(item.id, e.target.value, max)}
                          className="w-20 text-center"
                          placeholder="0"
                        />
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          <FormField label="Reason (optional)">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Client returned item" />
          </FormField>

          {error && <div className="text-error text-body-sm">{error}</div>}
        </div>
      )}
    </Modal>
  );
}

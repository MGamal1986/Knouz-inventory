import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { FormField, Select } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";

interface Client {
  id: number;
  name: string;
  mobile: string;
}
type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  productCode: string;
  description: string;
  categoryId: number;
  sellingPrice: string;
  discountType: DiscountType;
  discountValue: string;
  quantity: number;
  quantitySold: number;
}
interface LineItem {
  productId: number;
  productCode: string;
  description: string;
  originalUnitPrice: number;
  // Editable per-invoice discount. Pre-filled from the product's configured discount when
  // added, but changing it here only affects this sale — the product record is untouched.
  discountType: DiscountType;
  discountValue: number;
  quantity: number;
  maxStock: number;
}

function discountedUnitPrice(li: Pick<LineItem, "originalUnitPrice" | "discountType" | "discountValue">) {
  if (li.discountType === "PERCENTAGE") return Math.max(0, li.originalUnitPrice * (1 - li.discountValue / 100));
  if (li.discountType === "FIXED") return Math.max(0, li.originalUnitPrice - li.discountValue);
  return li.originalUnitPrice;
}

export function NewSale() {
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [categoryToAdd, setCategoryToAdd] = useState("");
  const [productToAdd, setProductToAdd] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/clients").then((res) => setClients(res.data));
    api.get("/api/categories").then((res) => setCategories(res.data));
    api.get("/api/products").then((res) => setProducts(res.data));
  }, []);

  const availableProducts = categoryToAdd
    ? products.filter((p) => String(p.categoryId) === categoryToAdd)
    : [];

  function addLineItem() {
    const product = products.find((p) => String(p.id) === productToAdd);
    if (!product) return;
    const maxStock = product.quantity - product.quantitySold;
    if (maxStock <= 0) {
      setError(`${product.productCode} is out of stock`);
      return;
    }
    setError(null);
    setLineItems((prev) => {
      const existing = prev.find((li) => li.productId === product.id);
      if (existing) {
        return prev.map((li) =>
          li.productId === product.id ? { ...li, quantity: Math.min(li.quantity + 1, maxStock) } : li
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.productCode,
          description: product.description,
          originalUnitPrice: Number(product.sellingPrice),
          discountType: product.discountType,
          discountValue: Number(product.discountValue),
          quantity: 1,
          maxStock,
        },
      ];
    });
    setProductToAdd("");
  }

  function updateQuantity(productId: number, qty: number) {
    setLineItems((prev) => prev.map((li) => (li.productId === productId ? { ...li, quantity: qty } : li)));
  }

  function updateDiscountType(productId: number, discountType: DiscountType) {
    setLineItems((prev) =>
      prev.map((li) =>
        li.productId === productId
          ? { ...li, discountType, discountValue: discountType === "NONE" ? 0 : li.discountValue }
          : li
      )
    );
  }

  function updateDiscountValue(productId: number, rawValue: string) {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.productId !== productId) return li;
        let value = Math.max(0, Number(rawValue) || 0);
        if (li.discountType === "PERCENTAGE") value = Math.min(100, value);
        return { ...li, discountValue: value };
      })
    );
  }

  function removeLineItem(productId: number) {
    setLineItems((prev) => prev.filter((li) => li.productId !== productId));
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.originalUnitPrice * li.quantity, 0);
  const discountTotal = lineItems.reduce(
    (sum, li) => sum + (li.originalUnitPrice - discountedUnitPrice(li)) * li.quantity,
    0
  );
  const total = subtotal - discountTotal;
  const selectedClient = clients.find((c) => String(c.id) === clientId);

  async function submitSale() {
    setError(null);
    if (!clientId) {
      setError("Please select a client");
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one product");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/sales", {
        clientId: Number(clientId),
        items: lineItems.map((li) => ({
          productId: li.productId,
          quantity: li.quantity,
          discountType: li.discountType,
          discountValue: li.discountValue,
        })),
      });
      navigate(`/sales/${res.data.id}/preview`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create sale");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-sm">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">New Sale</h2>
          <p className="text-body-md text-on-surface-variant mt-xs">Create a new invoice and process payment.</p>
        </div>
        <Link
          to="/sales"
          className="text-on-surface-variant hover:text-primary border border-surface-border px-md py-xs rounded-lg text-body-sm font-body-sm transition-colors hover:bg-surface-container-lowest self-start sm:self-auto"
        >
          Cancel
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter">
        <div className="flex-grow bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-md">
          <div className="flex flex-col sm:flex-row gap-sm sm:items-end">
            <div className="flex-1">
              <FormField label="Category">
                <Select
                  value={categoryToAdd}
                  onChange={(e) => {
                    setCategoryToAdd(e.target.value);
                    setProductToAdd("");
                  }}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="flex-1">
              <FormField label="Add Product">
                <Select
                  value={productToAdd}
                  onChange={(e) => setProductToAdd(e.target.value)}
                  disabled={!categoryToAdd}
                >
                  <option value="">{categoryToAdd ? "Select product..." : "Select a category first"}</option>
                  {availableProducts
                    .filter((p) => p.quantity - p.quantitySold > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.productCode} — {p.description} ({p.quantity - p.quantitySold} in stock)
                        {p.discountType === "PERCENTAGE" && ` [-${p.discountValue}%]`}
                        {p.discountType === "FIXED" && ` [-${p.discountValue} EGP]`}
                      </option>
                    ))}
                </Select>
              </FormField>
            </div>
            <Button type="button" onClick={addLineItem}>
              <Icon name="add" />
              Add
            </Button>
          </div>

          {lineItems.length === 0 && (
            <p className="text-on-surface-variant text-body-sm text-center py-lg border border-dashed border-surface-border rounded-lg">
              No items added yet.
            </p>
          )}

          {/* Mobile: card list (below sm — a 7-column table doesn't fit a phone screen) */}
          <div className="flex flex-col gap-sm sm:hidden">
            {lineItems.map((li) => (
              <div key={li.productId} className="border border-surface-border rounded-lg p-md flex flex-col gap-sm">
                <div className="flex justify-between items-start gap-sm">
                  <div>
                    <div className="text-code-label font-code-label text-on-surface-variant">{li.productCode}</div>
                    <div className="text-primary font-medium">{li.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(li.productId)}
                    className="text-error/70 hover:text-error transition-colors shrink-0"
                    aria-label="Remove item"
                  >
                    <Icon name="close" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(li.productId, Math.max(1, li.quantity - 1))}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high border border-surface-border"
                    >
                      <Icon name="remove" className="text-[16px]" />
                    </button>
                    <span className="w-6 text-center">{li.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(li.productId, Math.min(li.maxStock, li.quantity + 1))}
                      className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high border border-surface-border"
                    >
                      <Icon name="add" className="text-[16px]" />
                    </button>
                  </div>
                  <div className="text-right">
                    {li.discountType !== "NONE" && (
                      <div className="line-through text-body-sm text-on-surface-variant">
                        {(li.originalUnitPrice * li.quantity).toFixed(2)}
                      </div>
                    )}
                    <div className="font-medium text-primary">
                      EGP {(discountedUnitPrice(li) * li.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <Select
                    value={li.discountType}
                    onChange={(e) => updateDiscountType(li.productId, e.target.value as DiscountType)}
                    className="flex-1"
                  >
                    <option value="NONE">No discount (this sale)</option>
                    <option value="PERCENTAGE">Discount %</option>
                    <option value="FIXED">Discount EGP</option>
                  </Select>
                  {li.discountType !== "NONE" && (
                    <input
                      type="number"
                      min="0"
                      max={li.discountType === "PERCENTAGE" ? 100 : undefined}
                      value={li.discountValue}
                      onChange={(e) => updateDiscountValue(li.productId, e.target.value)}
                      className="w-20 bg-surface-container-low border border-surface-border rounded-lg p-sm text-body-sm text-center outline-none focus:ring-2 focus:ring-artisan-gold"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/desktop: table */}
          <div className="hidden sm:block flex-1 overflow-auto border border-surface-border rounded-lg">
            <Table>
              <Thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Description</Th>
                  <Th className="text-center">Qty</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th className="text-center">Discount (this sale)</Th>
                  <Th className="text-right">Subtotal</Th>
                  <Th className="w-10" />
                </tr>
              </Thead>
              <Tbody>
                {lineItems.map((li) => (
                  <Tr key={li.productId}>
                    <Td className="text-code-label font-code-label text-on-background">{li.productCode}</Td>
                    <Td className="text-primary">{li.description}</Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(li.productId, Math.max(1, li.quantity - 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high border border-surface-border"
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="w-6 text-center">{li.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(li.productId, Math.min(li.maxStock, li.quantity + 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high border border-surface-border"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                    </Td>
                    <Td className="text-right text-on-surface-variant">
                      {li.discountType !== "NONE" ? (
                        <div className="flex flex-col items-end">
                          <span className="line-through text-body-sm">{li.originalUnitPrice.toFixed(2)}</span>
                          <span className="text-primary font-medium">{discountedUnitPrice(li).toFixed(2)}</span>
                        </div>
                      ) : (
                        li.originalUnitPrice.toFixed(2)
                      )}
                    </Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-xs">
                        <Select
                          value={li.discountType}
                          onChange={(e) => updateDiscountType(li.productId, e.target.value as DiscountType)}
                          className="w-28 !p-xs text-body-sm"
                        >
                          <option value="NONE">None</option>
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">EGP</option>
                        </Select>
                        {li.discountType !== "NONE" && (
                          <input
                            type="number"
                            min="0"
                            max={li.discountType === "PERCENTAGE" ? 100 : undefined}
                            value={li.discountValue}
                            onChange={(e) => updateDiscountValue(li.productId, e.target.value)}
                            className="w-16 bg-surface-container-low border border-surface-border rounded-lg p-xs text-body-sm text-center outline-none focus:ring-2 focus:ring-artisan-gold"
                          />
                        )}
                      </div>
                    </Td>
                    <Td className="text-right font-medium text-primary">
                      {(discountedUnitPrice(li) * li.quantity).toFixed(2)}
                    </Td>
                    <Td className="text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(li.productId)}
                        className="text-error/70 hover:text-error transition-colors"
                        aria-label="Remove item"
                      >
                        <Icon name="close" />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>

        <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-md">
            <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Client Details</h3>
            <FormField label="Client">
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </Select>
            </FormField>
            {selectedClient && (
              <div className="flex justify-between items-center text-body-sm mt-sm">
                <span className="text-on-surface-variant">{selectedClient.mobile}</span>
              </div>
            )}
            <Link
              to="/clients"
              className="w-full mt-md py-xs border border-dashed border-surface-border text-on-surface-variant hover:text-primary hover:border-artisan-gold rounded-lg text-body-sm transition-all flex items-center justify-center gap-xs"
            >
              <Icon name="add" className="text-[18px]" />
              New Client
            </Link>
          </div>

          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-md flex-1 flex flex-col">
            <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Order Summary</h3>
            <div className="space-y-sm flex-1">
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Subtotal ({lineItems.length} items)</span>
                <span>EGP {subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-body-md text-success-emerald">
                  <span>Discount</span>
                  <span>-EGP {discountTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
            {error && <div className="text-error text-body-sm mt-sm">{error}</div>}
            <div className="border-t border-surface-border pt-md mt-md">
              <div className="flex justify-between items-center mb-lg">
                <span className="text-headline-md font-headline-md text-primary">Total</span>
                <span className="text-headline-lg font-headline-lg text-primary">EGP {total.toFixed(2)}</span>
              </div>
              <Button
                variant="dark"
                className="w-full justify-center"
                onClick={submitSale}
                disabled={submitting}
              >
                <Icon name="check_circle" filled />
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

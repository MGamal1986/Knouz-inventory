import { useEffect, useState } from "react";
import { api } from "../api/client";
import { FormField, Select, Input } from "./ui/FormField";
import { Icon } from "./ui/Icon";

type Preset = "today" | "week" | "month" | "year" | "all" | "custom";

interface Category {
  id: number;
  name: string;
}
interface Client {
  id: number;
  name: string;
}
interface Product {
  id: number;
  productCode: string;
  description: string;
}
interface RevenueResult {
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  salesCount: number;
}

function formatEgp(value: number) {
  return `EGP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function presetRange(preset: Preset): { from?: string; to?: string } {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (preset === "all") return {};

  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  if (preset === "week") {
    const start = new Date(now);
    const day = (start.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  if (preset === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  return {};
}

export function RevenueExplorer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");

  const [result, setResult] = useState<RevenueResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/categories").then((res) => setCategories(res.data));
    api.get("/api/clients").then((res) => setClients(res.data));
    api.get("/api/products").then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    const range = preset === "custom" ? { from: customFrom || undefined, to: customTo ? `${customTo}T23:59:59.999` : undefined } : presetRange(preset);

    setLoading(true);
    api
      .get("/api/dashboard/revenue", {
        params: {
          ...range,
          categoryId: categoryId || undefined,
          clientId: clientId || undefined,
          productId: productId || undefined,
        },
      })
      .then((res) => setResult(res.data))
      .finally(() => setLoading(false));
  }, [preset, customFrom, customTo, categoryId, clientId, productId]);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm p-lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="text-headline-sm font-headline-sm text-primary">Revenue Explorer</h3>
        <Icon name="query_stats" className="text-artisan-gold" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        <FormField label="Time Range">
          <Select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </Select>
        </FormField>

        {preset === "custom" ? (
          <>
            <FormField label="From">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </FormField>
            <FormField label="To">
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </FormField>
          </>
        ) : (
          <div className="hidden lg:block" />
        )}

        <FormField label="Category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Client">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Product">
          <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.productCode} — {p.description}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="p-md rounded-lg border border-surface-border bg-surface-container-low">
            <div className="text-body-sm text-on-surface-variant mb-xs">Gross Revenue</div>
            <div className="text-headline-sm font-headline-sm text-primary">{formatEgp(result.grossRevenue)}</div>
          </div>
          <div className="p-md rounded-lg border border-surface-border bg-surface-container-low">
            <div className="text-body-sm text-on-surface-variant mb-xs">Refunded</div>
            <div className="text-headline-sm font-headline-sm text-error">-{formatEgp(result.refundedAmount)}</div>
          </div>
          <div className="p-md rounded-lg border border-artisan-gold/40 bg-artisan-gold/10">
            <div className="text-body-sm text-on-surface-variant mb-xs">Net Revenue</div>
            <div className="text-headline-sm font-headline-sm text-primary">{formatEgp(result.netRevenue)}</div>
          </div>
          <div className="p-md rounded-lg border border-surface-border bg-surface-container-low">
            <div className="text-body-sm text-on-surface-variant mb-xs">Sales Count</div>
            <div className="text-headline-sm font-headline-sm text-primary">{result.salesCount}</div>
          </div>
        </div>
      )}
      {loading && <p className="text-body-sm text-on-surface-variant mt-sm">Updating...</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { KpiCard } from "../components/ui/KpiCard";
import { Icon } from "../components/ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { RevenueExplorer } from "../components/RevenueExplorer";
import { FormField, Select, Input } from "../components/ui/FormField";

type TopSellingPreset = "today" | "week" | "month" | "year" | "all" | "custom";

function topSellingPresetRange(preset: TopSellingPreset): { from?: string; to?: string } {
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

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  unitsInStock: number;
  totalOriginalCost: number;
}

interface Summary {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  totalActualProfit: number;
  soldCount: number;
  salesCountThisMonth: number;
  revenueThisMonth: number;
  capital: number;
  categoryStats: CategoryStat[];
}

interface SoldOutProduct {
  id: number;
  productCode: string;
  description: string;
  category: { name: string };
  quantity: number;
  quantitySold: number;
}

interface TopProduct {
  productId: number;
  productCode: string;
  description: string;
  unitsSold: number;
}

interface TopCategory {
  categoryId: number;
  categoryName: string;
  unitsSold: number;
}

interface TopSelling {
  topProducts: TopProduct[];
  topCategories: TopCategory[];
}

function formatEgp(value: number) {
  return `EGP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SOLD_OUT_PAGE_SIZE = 6;

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [soldOutItems, setSoldOutItems] = useState<SoldOutProduct[]>([]);
  const [soldOutPage, setSoldOutPage] = useState(1);
  const [topSelling, setTopSelling] = useState<TopSelling | null>(null);
  const [topSellingPreset, setTopSellingPreset] = useState<TopSellingPreset>("all");
  const [topSellingFrom, setTopSellingFrom] = useState("");
  const [topSellingTo, setTopSellingTo] = useState("");

  function loadSummary() {
    api.get("/api/dashboard/summary").then((res) => setSummary(res.data));
  }

  function loadSoldOut() {
    api.get("/api/dashboard/sold-out").then((res) => setSoldOutItems(res.data));
  }

  useEffect(() => {
    loadSummary();
    loadSoldOut();
  }, []);

  useEffect(() => {
    const range =
      topSellingPreset === "custom"
        ? { from: topSellingFrom || undefined, to: topSellingTo ? `${topSellingTo}T23:59:59.999` : undefined }
        : topSellingPresetRange(topSellingPreset);

    api
      .get("/api/dashboard/top-selling", { params: range })
      .then((res) => setTopSelling(res.data));
  }, [topSellingPreset, topSellingFrom, topSellingTo]);

  const soldOutTotalPages = Math.max(1, Math.ceil(soldOutItems.length / SOLD_OUT_PAGE_SIZE));
  const soldOutCurrentPage = Math.min(soldOutPage, soldOutTotalPages);
  const pagedSoldOutItems = soldOutItems.slice(
    (soldOutCurrentPage - 1) * SOLD_OUT_PAGE_SIZE,
    soldOutCurrentPage * SOLD_OUT_PAGE_SIZE
  );

  if (!summary) {
    return <p className="text-on-surface-variant">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-lg md:gap-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="text-display-lg font-display-lg text-primary">Dashboard</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant mt-xs">
            Overview of inventory and recent performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md md:gap-lg">
        <KpiCard label="Total Products" value={summary.totalProducts} icon="category" />
        <KpiCard label="Total Stock (units)" value={summary.totalStockUnits} icon="inventory_2" />
        <KpiCard
          label="Stock Value"
          value={formatEgp(summary.totalStockValue)}
          icon="payments"
          iconClassName="text-artisan-gold"
        />
        <KpiCard
          label="Actual Profit"
          value={formatEgp(summary.totalActualProfit)}
          icon="trending_up"
          iconClassName="text-success-emerald"
        />
        <KpiCard label="Sold Out Items" value={summary.soldCount} icon="sell" iconClassName="text-error" />
        <KpiCard label="Sales This Month" value={summary.salesCountThisMonth} icon="receipt_long" />
        <KpiCard label="Capital" value={formatEgp(summary.capital)} icon="account_balance_wallet" dark />
      </div>

      <RevenueExplorer />

      <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Sold Out Items</h3>
        {soldOutItems.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No sold out items right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <tr>
                  <Th>Product Code</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th className="text-center">Purchased</Th>
                  <Th className="text-center">Sold</Th>
                </tr>
              </Thead>
              <Tbody>
                {pagedSoldOutItems.map((item) => (
                  <Tr key={item.id}>
                    <Td className="text-code-label font-code-label text-primary">{item.productCode}</Td>
                    <Td className="font-medium text-primary">{item.description}</Td>
                    <Td className="text-on-surface-variant">{item.category.name}</Td>
                    <Td className="text-center">{item.quantity}</Td>
                    <Td className="text-center">{item.quantitySold}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="pt-md flex justify-end">
              <Pagination page={soldOutCurrentPage} totalPages={soldOutTotalPages} onPageChange={setSoldOutPage} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Stock by Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {summary.categoryStats.map((c) => (
            <div
              key={c.categoryId}
              className="p-md rounded-lg border border-surface-border bg-surface-container-low"
            >
              <div className="flex items-center justify-between mb-sm">
                <span className="text-body-md font-medium text-primary">{c.categoryName}</span>
                <Icon name="category" className="text-artisan-gold text-[18px]" />
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span>Units</span>
                <span className="font-semibold text-on-background">{c.unitsInStock}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span>Original Cost</span>
                <span className="font-semibold text-on-background">{formatEgp(c.totalOriginalCost)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm p-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
          <h3 className="text-headline-sm font-headline-sm text-primary">Top Selling</h3>
          <div className="flex flex-col sm:flex-row gap-md">
            <FormField label="Time Range">
              <Select
                value={topSellingPreset}
                onChange={(e) => setTopSellingPreset(e.target.value as TopSellingPreset)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </Select>
            </FormField>
            {topSellingPreset === "custom" && (
              <>
                <FormField label="From">
                  <Input type="date" value={topSellingFrom} onChange={(e) => setTopSellingFrom(e.target.value)} />
                </FormField>
                <FormField label="To">
                  <Input type="date" value={topSellingTo} onChange={(e) => setTopSellingTo(e.target.value)} />
                </FormField>
              </>
            )}
          </div>
        </div>
        {!topSelling || (topSelling.topProducts.length === 0 && topSelling.topCategories.length === 0) ? (
          <p className="text-body-md text-on-surface-variant">No sales recorded for this period.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <h4 className="text-body-md font-medium text-on-surface-variant mb-sm">Top Products</h4>
              <ul className="divide-y divide-surface-border">
                {topSelling.topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center justify-between py-sm gap-md">
                    <div className="flex items-center gap-sm min-w-0">
                      <span className="text-body-sm font-semibold text-artisan-gold w-5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-primary truncate">{p.description}</p>
                        <p className="text-code-label font-code-label text-on-surface-variant">{p.productCode}</p>
                      </div>
                    </div>
                    <span className="text-body-sm font-semibold text-on-background shrink-0">
                      {p.unitsSold} sold
                    </span>
                  </li>
                ))}
                {topSelling.topProducts.length === 0 && (
                  <li className="py-sm text-body-sm text-on-surface-variant">No product sales yet.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-body-md font-medium text-on-surface-variant mb-sm">Top Categories</h4>
              <ul className="divide-y divide-surface-border">
                {topSelling.topCategories.map((c, i) => (
                  <li key={c.categoryId} className="flex items-center justify-between py-sm gap-md">
                    <div className="flex items-center gap-sm min-w-0">
                      <span className="text-body-sm font-semibold text-artisan-gold w-5 shrink-0">#{i + 1}</span>
                      <span className="text-body-sm font-medium text-primary truncate">{c.categoryName}</span>
                    </div>
                    <span className="text-body-sm font-semibold text-on-background shrink-0">
                      {c.unitsSold} sold
                    </span>
                  </li>
                ))}
                {topSelling.topCategories.length === 0 && (
                  <li className="py-sm text-body-sm text-on-surface-variant">No category sales yet.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Quick Actions</h3>
        <Link
          to="/inventory"
          className="inline-flex bg-surface-container hover:bg-surface-container-high transition-colors p-md rounded-lg flex-col items-center justify-center gap-sm text-center w-32"
        >
          <Icon name="inventory" className="text-artisan-gold text-[24px]" />
          <span className="text-body-sm font-body-sm text-on-background">Add Item</span>
        </Link>
      </div>
    </div>
  );
}

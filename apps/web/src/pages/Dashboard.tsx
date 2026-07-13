import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { KpiCard } from "../components/ui/KpiCard";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { RevenueExplorer } from "../components/RevenueExplorer";
import { RestockModal } from "../components/RestockModal";

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
  soldCount: number;
  salesCountThisMonth: number;
  revenueThisMonth: number;
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

function formatEgp(value: number) {
  return `EGP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SOLD_OUT_PAGE_SIZE = 6;

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [soldOutItems, setSoldOutItems] = useState<SoldOutProduct[]>([]);
  const [soldOutPage, setSoldOutPage] = useState(1);
  const [restockTarget, setRestockTarget] = useState<SoldOutProduct | null>(null);

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

  function onRestocked() {
    setRestockTarget(null);
    loadSummary();
    loadSoldOut();
  }

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
        <KpiCard label="Sold Out Items" value={summary.soldCount} icon="sell" iconClassName="text-error" />
        <KpiCard label="Sales This Month" value={summary.salesCountThisMonth} icon="receipt_long" />
        <KpiCard label="Revenue This Month" value={formatEgp(summary.revenueThisMonth)} icon="bar_chart" dark />
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
                  <Th className="w-32" />
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
                    <Td className="text-right">
                      <Button variant="ghost" onClick={() => setRestockTarget(item)}>
                        <Icon name="add_box" className="text-[18px]" />
                        Restock
                      </Button>
                    </Td>
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
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Quick Actions</h3>
        <Link
          to="/inventory"
          className="inline-flex bg-surface-container hover:bg-surface-container-high transition-colors p-md rounded-lg flex-col items-center justify-center gap-sm text-center w-32"
        >
          <Icon name="inventory" className="text-artisan-gold text-[24px]" />
          <span className="text-body-sm font-body-sm text-on-background">Add Item</span>
        </Link>
      </div>

      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onClose={() => setRestockTarget(null)}
          onRestocked={onRestocked}
        />
      )}
    </div>
  );
}

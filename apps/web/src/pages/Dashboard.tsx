import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { KpiCard } from "../components/ui/KpiCard";
import { Icon } from "../components/ui/Icon";

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
  inStockCount: number;
  lowStockCount: number;
  salesCountThisMonth: number;
  revenueThisMonth: number;
  categoryStats: CategoryStat[];
}

function formatEgp(value: number) {
  return `EGP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/api/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

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
          label="In Stock Items"
          value={summary.inStockCount}
          icon="check_circle"
          iconClassName="text-success-emerald"
        />
        <KpiCard label="Sold Out Items" value={summary.soldCount} icon="sell" iconClassName="text-error" />
        <KpiCard
          label="Low Stock (≤ 2)"
          value={summary.lowStockCount}
          icon="warning"
          iconClassName="text-warning-amber"
        />
        <KpiCard label="Sales This Month" value={summary.salesCountThisMonth} icon="receipt_long" />
        <KpiCard label="Revenue This Month" value={formatEgp(summary.revenueThisMonth)} icon="bar_chart" dark />
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
    </div>
  );
}

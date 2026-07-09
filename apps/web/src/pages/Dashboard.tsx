import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Summary {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  soldCount: number;
  inStockCount: number;
  lowStockCount: number;
  salesCountThisMonth: number;
  revenueThisMonth: number;
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/api/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  if (!summary) return <p>Loading...</p>;

  const kpis = [
    { label: "Total Products", value: summary.totalProducts },
    { label: "Total Stock (units)", value: summary.totalStockUnits },
    { label: "Stock Value (EGP)", value: summary.totalStockValue.toFixed(2) },
    { label: "In Stock Items", value: summary.inStockCount },
    { label: "Sold Out Items", value: summary.soldCount },
    { label: "Low Stock (\u2264 2)", value: summary.lowStockCount },
    { label: "Sales This Month", value: summary.salesCountThisMonth },
    { label: "Revenue This Month (EGP)", value: summary.revenueThisMonth.toFixed(2) },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="value">{k.value}</div>
            <div className="label">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

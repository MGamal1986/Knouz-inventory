import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { downloadInvoicePdf } from "../utils/invoice";

interface Client {
  id: number;
  name: string;
  mobile: string;
}
interface Sale {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  createdAt: string;
  client: Client;
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/sales").then((res) => setSales(res.data));
  }, []);

  const todaysRevenue = sales
    .filter((s) => isToday(s.createdAt))
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-primary mb-xs">Sales History</h2>
        <p className="text-body-md font-body-md text-on-surface-variant">
          Manage and review recent transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <Card className="p-lg">
            <h3 className="text-body-sm font-body-sm text-on-surface-variant mb-sm">Today's Revenue</h3>
            <div className="text-display-lg font-display-lg text-primary">
              EGP {todaysRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </Card>

          <div className="bg-deep-charcoal text-white rounded-xl p-lg flex flex-col items-start justify-between min-h-[160px] relative overflow-hidden">
            <div className="z-10 relative">
              <h3 className="text-headline-sm font-headline-sm mb-xs">Record New Sale</h3>
              <p className="text-body-sm font-body-sm text-outline-variant mb-md max-w-[200px]">
                Streamlined checkout for walk-in clients.
              </p>
            </div>
            <Link
              to="/sales/new"
              className="z-10 relative bg-artisan-gold text-deep-charcoal px-lg py-md rounded-lg font-headline-sm text-headline-sm flex items-center gap-sm hover:brightness-110 transition-all w-full justify-center"
            >
              <Icon name="point_of_sale" />
              Start Checkout
            </Link>
            <Icon
              name="diamond"
              className="absolute -bottom-4 -right-4 text-[120px] text-white/5 select-none pointer-events-none"
            />
          </div>
        </div>

        <Card className="lg:col-span-8 flex flex-col overflow-hidden">
          <div className="p-lg border-b border-surface-border">
            <h3 className="text-headline-sm font-headline-sm text-primary">Recent Transactions</h3>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Invoice ID</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {sales.map((s) => (
                <Tr key={s.id}>
                  <Td className="text-code-label font-code-label text-primary">{s.invoiceNumber}</Td>
                  <Td className="font-medium text-primary">{s.client.name}</Td>
                  <Td className="text-on-surface-variant">{new Date(s.createdAt).toLocaleDateString()}</Td>
                  <Td className="text-right font-medium text-primary">{Number(s.totalAmount).toFixed(2)}</Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-sm opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => navigate(`/sales/${s.id}/preview`)}
                        className="text-on-surface-variant hover:text-primary"
                        aria-label="View invoice"
                      >
                        <Icon name="visibility" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadInvoicePdf(s.id, s.invoiceNumber)}
                        className="text-artisan-gold hover:text-secondary"
                        aria-label="Download PDF"
                      >
                        <Icon name="picture_as_pdf" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-lg py-md border-t border-surface-border text-body-sm text-on-surface-variant">
            Showing {sales.length} sale{sales.length === 1 ? "" : "s"}
          </div>
        </Card>
      </div>
    </div>
  );
}

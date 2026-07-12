import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { downloadInvoicePdf } from "../utils/invoice";

interface SaleItem {
  id: number;
  quantity: number;
  originalUnitPrice: string;
  discountAmount: string;
  unitPrice: string;
  lineTotal: string;
  product: { productCode: string; description: string };
}
interface Sale {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  createdAt: string;
  client: { name: string; address?: string; mobile: string };
  items: SaleItem[];
}

export function InvoicePreview() {
  const { id } = useParams();
  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    api.get(`/api/sales/${id}`).then((res) => setSale(res.data));
  }, [id]);

  if (!sale) {
    return <p className="text-on-surface-variant">Loading...</p>;
  }

  const subtotal = sale.items.reduce((sum, item) => sum + Number(item.originalUnitPrice) * item.quantity, 0);
  const totalDiscount = sale.items.reduce((sum, item) => sum + Number(item.discountAmount), 0);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[800px] flex justify-between items-center mb-md print:hidden">
        <div>
          <h1 className="font-headline-sm text-headline-sm text-deep-charcoal">Invoice Preview</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Review details before sending to client.
          </p>
        </div>
        <div className="flex gap-sm">
          <Button variant="ghost" onClick={() => window.print()}>
            <Icon name="print" className="text-[18px]" />
            Print
          </Button>
          <Button onClick={() => downloadInvoicePdf(sale.id, sale.invoiceNumber)}>
            <Icon name="download" className="text-[18px]" />
            Download PDF
          </Button>
        </div>
      </div>

      <main className="w-full max-w-[800px] bg-surface-container-lowest shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-xl md:p-[48px] flex flex-col print:shadow-none">
        <header className="flex justify-between items-start mb-[48px]">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-deep-charcoal">
              Knouz
            </h2>
            <p className="font-code-label text-code-label text-artisan-gold uppercase tracking-wider mt-1">
              Artisan Utility
            </p>
          </div>
          <div className="text-right">
            <h1 className="font-display-lg text-[40px] leading-tight font-light text-surface-variant tracking-wider uppercase mb-sm">
              Invoice
            </h1>
            <div className="space-y-2 mt-md">
              <div className="flex justify-end gap-lg">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Invoice No.</span>
                <span className="font-code-label text-code-label text-deep-charcoal">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-end gap-lg">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Date Issued</span>
                <span className="font-body-sm text-body-sm text-deep-charcoal">
                  {new Date(sale.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-[48px] border-l-2 border-artisan-gold pl-lg">
          <h3 className="font-code-label text-[11px] uppercase text-on-surface-variant mb-2">Billed To</h3>
          <p className="font-headline-sm text-headline-sm text-deep-charcoal font-semibold">{sale.client.name}</p>
          {sale.client.address && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{sale.client.address}</p>
          )}
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{sale.client.mobile}</p>
        </section>

        <section className="mb-[48px] flex-grow">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[15%]">
                  Code
                </th>
                <th className="text-left py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[50%]">
                  Description
                </th>
                <th className="text-center py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[10%]">
                  Qty
                </th>
                <th className="text-right py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[12%]">
                  Unit Price
                </th>
                <th className="text-right py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[10%]">
                  Discount
                </th>
                <th className="text-right py-3 px-4 border-b border-surface-border font-code-label text-code-label text-on-surface-variant bg-surface-container-low w-[13%]">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 border-b border-surface-variant font-code-label text-code-label text-muted-bronze">
                    {item.product.productCode}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-variant">
                    <p className="font-body-md text-body-md font-medium text-deep-charcoal">
                      {item.product.description}
                    </p>
                  </td>
                  <td className="py-3 px-4 border-b border-surface-variant text-center font-body-sm text-body-sm">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-variant text-right font-body-sm text-body-sm">
                    {Number(item.discountAmount) > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-on-surface-variant">
                          {Number(item.originalUnitPrice).toFixed(2)}
                        </span>
                        <span>{Number(item.unitPrice).toFixed(2)}</span>
                      </div>
                    ) : (
                      Number(item.unitPrice).toFixed(2)
                    )}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-variant text-right font-body-sm text-body-sm text-artisan-gold">
                    {Number(item.discountAmount) > 0 ? `-${Number(item.discountAmount).toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-variant text-right font-medium font-body-sm text-body-sm">
                    {Number(item.lineTotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end mt-auto pt-lg border-t border-surface-border">
          <div className="w-full md:w-[40%] bg-surface-container-low p-lg rounded">
            {totalDiscount > 0 && (
              <>
                <div className="flex justify-between py-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 font-body-sm text-body-sm text-artisan-gold">
                  <span>Discount</span>
                  <span>-EGP {totalDiscount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-4">
              <span className="font-headline-sm text-headline-sm text-deep-charcoal font-bold">Total Due</span>
              <span className="font-headline-sm text-headline-sm text-artisan-gold font-bold">
                EGP {Number(sale.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        <footer className="mt-xl text-center font-body-sm text-[12px] text-on-surface-variant">
          <p>Thank you for choosing Knouz Artisan Utility.</p>
        </footer>
      </main>
    </div>
  );
}

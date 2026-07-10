import { api } from "../api/client";

export async function downloadInvoicePdf(saleId: number, invoiceNumber: string) {
  const res = await api.get(`/api/sales/${saleId}/invoice.pdf`, { responseType: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(res.data);
  link.download = `${invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

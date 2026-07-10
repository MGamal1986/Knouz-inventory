export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  function escape(value: string | number) {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  // Leading BOM so Excel correctly detects UTF-8 (needed for Arabic names/addresses).
  const csv = "﻿" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

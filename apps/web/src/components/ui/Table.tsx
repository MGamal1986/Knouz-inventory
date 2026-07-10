import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className = "", ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left border-collapse whitespace-nowrap ${className}`} {...props} />
    </div>
  );
}

export function Thead({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-surface-container-low border-b border-surface-border text-on-surface-variant text-code-label font-code-label uppercase tracking-wider ${className}`}
      {...props}
    />
  );
}

export function Tbody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-surface-border text-body-sm font-body-sm text-on-surface ${className}`}
      {...props}
    />
  );
}

export function Tr({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-surface-container-low/50 transition-colors group ${className}`} {...props} />;
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-lg py-sm font-medium ${className}`} {...props} />;
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-lg py-md ${className}`} {...props} />;
}

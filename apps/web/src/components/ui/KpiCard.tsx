import { ReactNode } from "react";
import { Icon } from "./Icon";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: string;
  iconClassName?: string;
  dark?: boolean;
}

export function KpiCard({ label, value, icon, iconClassName = "text-outline", dark = false }: KpiCardProps) {
  return (
    <div
      className={`p-lg rounded-xl border border-surface-border shadow-sm flex flex-col justify-between relative overflow-hidden ${
        dark ? "bg-deep-charcoal" : "bg-surface-container-lowest"
      }`}
    >
      {dark && (
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-artisan-gold/10 rounded-full blur-xl" />
      )}
      <div className="flex items-center justify-between mb-sm relative z-10">
        <span className={`text-body-sm font-body-sm ${dark ? "text-on-primary-container" : "text-on-surface-variant"}`}>
          {label}
        </span>
        <Icon name={icon} className={dark ? "text-artisan-gold" : iconClassName} />
      </div>
      <div className={`text-headline-lg font-headline-lg relative z-10 ${dark ? "text-white" : "text-primary"}`}>
        {value}
      </div>
    </div>
  );
}

import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface-container-lowest border border-surface-border rounded-xl shadow-sm ${className}`}
      {...props}
    />
  );
}

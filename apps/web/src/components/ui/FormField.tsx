import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const controlClasses =
  "w-full bg-surface-container-low border border-surface-border rounded-lg p-md text-body-md font-body-md text-on-background focus:ring-2 focus:ring-artisan-gold focus:border-transparent outline-none transition-all disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-body-sm font-medium text-on-surface-variant mb-xs" {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClasses} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClasses} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClasses} min-h-[100px] ${className}`} {...props} />;
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

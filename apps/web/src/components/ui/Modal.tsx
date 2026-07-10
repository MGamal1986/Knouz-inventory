import { ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
      <div className="absolute inset-0 bg-deep-charcoal/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-xl py-lg border-b border-surface-border flex items-center justify-between bg-surface-container-low">
          <h3 className="text-headline-sm font-headline-sm text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="p-xl overflow-y-auto">{children}</div>
        <div className="px-xl py-lg border-t border-surface-border flex justify-end gap-md bg-surface-container-low">
          {footer}
        </div>
      </div>
    </div>
  );
}

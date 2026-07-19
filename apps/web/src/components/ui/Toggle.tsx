interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

// Accessible switch: a styled checkbox with a sliding knob, plus a label and
// optional helper line describing what turning it on does.
export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-md p-md rounded-lg border border-surface-border bg-surface-container-low cursor-pointer">
      <span className="min-w-0">
        <span className="block text-body-md font-medium text-on-background">{label}</span>
        {description && (
          <span className="block text-body-sm text-on-surface-variant mt-xs">{description}</span>
        )}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="w-11 h-6 rounded-full bg-surface-container-high peer-checked:bg-artisan-gold transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

type AvatarTone = "gold" | "neutral";

const toneClasses: Record<AvatarTone, string> = {
  gold: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  tone = "neutral",
  className = "",
}: {
  name: string;
  tone?: AvatarTone;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0 ${toneClasses[tone]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

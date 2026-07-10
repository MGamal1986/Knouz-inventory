import { useAuth } from "../context/AuthContext";
import { Icon } from "./ui/Icon";
import { Avatar } from "./ui/Avatar";

export function TopBar() {
  const { admin } = useAuth();

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-background/80 backdrop-blur-md flex justify-between items-center px-md md:px-xl border-b border-surface-border">
      <span className="text-headline-sm font-headline-sm font-bold text-primary md:hidden">Knouz</span>
      <div className="hidden md:block" />
      <div className="flex items-center gap-md">
        <button type="button" className="p-sm rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all">
          <Icon name="notifications" />
        </button>
        <button type="button" className="p-sm rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all">
          <Icon name="help_outline" />
        </button>
        <Avatar name={admin?.fullName || admin?.username || "?"} tone="gold" className="w-8 h-8 text-xs" />
      </div>
    </header>
  );
}

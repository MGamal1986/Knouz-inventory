import { NavLink } from "react-router-dom";
import { Icon } from "./ui/Icon";

const items = [
  { to: "/", label: "Home", icon: "dashboard", end: true },
  { to: "/inventory", label: "Stock", icon: "inventory_2", end: true },
  { to: "/clients", label: "Clients", icon: "group", end: true },
  { to: "/sales", label: "Sales", icon: "receipt_long", end: false },
];

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-surface-border flex justify-around items-center py-sm z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center p-xs ${isActive ? "text-artisan-gold" : "text-on-surface-variant"}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} />
              <span className={`text-[10px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

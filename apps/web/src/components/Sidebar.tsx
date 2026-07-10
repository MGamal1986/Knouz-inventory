import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./ui/Icon";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/categories", label: "Categories", icon: "category", end: true },
  { to: "/suppliers", label: "Suppliers", icon: "factory", end: true },
  { to: "/inventory", label: "Inventory", icon: "inventory_2", end: true },
  { to: "/clients", label: "Clients", icon: "group", end: true },
  { to: "/sales", label: "Sales", icon: "receipt_long", end: false },
];

function navLinkClasses(isActive: boolean) {
  return `flex items-center gap-md px-md py-sm rounded-lg text-body-md font-body-md transition-colors duration-200 ${
    isActive
      ? "text-artisan-gold font-bold bg-surface-container opacity-90 scale-[0.98]"
      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
  }`;
}

export function Sidebar() {
  const { admin, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-sidebar-width h-screen sticky left-0 top-0 bg-surface-container-lowest border-r border-surface-border flex-col p-lg overflow-y-auto shrink-0 z-30">
      <div className="mb-xl px-sm flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-surface-border shrink-0">
          <Icon name="diamond" filled className="text-primary text-[20px]" />
        </div>
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">Knouz</h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Artisan Utility</p>
        </div>
      </div>

      <Link
        to="/sales/new"
        className="w-full bg-artisan-gold text-deep-charcoal font-headline-sm text-headline-sm rounded-lg py-md px-lg mb-xl hover:brightness-95 transition-all flex items-center justify-center gap-sm"
      >
        <Icon name="add" />
        New Sale
      </Link>

      <nav className="flex-1 flex flex-col gap-sm">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => navLinkClasses(isActive)}>
            {({ isActive }) => (
              <>
                <Icon name={link.icon} filled={isActive} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-lg border-t border-surface-border flex flex-col gap-sm">
        <NavLink to="/account" className={({ isActive }) => navLinkClasses(isActive)}>
          {({ isActive }) => (
            <>
              <Icon name="manage_accounts" filled={isActive} />
              Account
            </>
          )}
        </NavLink>
        <div className="px-md text-body-sm text-on-surface-variant truncate">
          Logged in as {admin?.username}
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-200 text-body-md font-body-md text-left"
        >
          <Icon name="logout" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-md md:p-xl pb-20 md:pb-xl overflow-x-hidden">
          <div className="max-w-max-content-width mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

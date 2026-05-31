import React from "react";
import { Link, useLocation } from "react-router-dom";
import shamhoLogo from "../../assets/Shamho Logo.jpeg";
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ShoppingCart,
  Zap,
  BarChart3,
  Wrench,
  MapPin,
} from "lucide-react";
import { cn } from "../../utils/format";
import { useAuth } from "../../providers/AuthProvider";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "Members", path: "/members", icon: <Users size={20} /> },
  { label: "Inventory", path: "/inventory", icon: <Warehouse size={20} /> },
  { label: "Products", path: "/products", icon: <Package size={20} /> },
  {
    label: "Transactions",
    path: "/transactions",
    icon: <ShoppingCart size={20} />,
  },
  { label: "AI Records", path: "/ai-records", icon: <Zap size={20} /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 size={20} /> },
  { label: "Technicians", path: "/technicians", icon: <Wrench size={20} /> },
  { label: "Locations", path: "/locations", icon: <MapPin size={20} /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const visibleNavItems =
    user?.role === "TECHNICIAN"
      ? navItems.filter((item) => item.path === "/locations")
      : user?.role === "ADMIN"
        ? navItems
        : [];

  return (
    <div className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-white/10 bg-primary-dark/95 text-white shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 p-6">
        <div className="inline-flex items-center gap-3 bg-white/10 px-3 py-2">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden bg-white">
            <img
              src={shamhoLogo}
              alt="Shamho Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">SHAMHO</h1>
            <p className="mt-1 text-xs text-white/70">FPO</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-lg shadow-black/10"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-6">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            Workspace
          </p>
          <p className="mt-2 text-sm font-medium text-white">Operations hub</p>
          <p className="mt-1 text-xs text-white/60">© 2024 SHAMHO</p>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const visibleNavItems =
    user?.role === "TECHNICIAN"
      ? navItems.filter(
          (item) => item.path === "/locations" || item.path === "/ai-records",
        )
      : user?.role === "ADMIN"
        ? navItems
        : [];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto bg-primary-dark text-white shadow-2xl lg:hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden bg-white">
              <img
                src={shamhoLogo}
                alt="Shamho Logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SHAMHO</h1>
              <p className="mt-1 text-sm text-white/70">FPO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/15 text-white"
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
          <p className="text-xs text-white/60">© 2024 SHAMHO</p>
        </div>
      </div>
    </>
  );
};

import React, { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { Bell, Menu, LogOut, User } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNotifications = () => {
    alert("No new notifications");
  };

  return (
    <div className="flex h-16 items-center justify-between px-4 sm:px-6 text-text">
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-black/5 lg:hidden"
        >
          <Menu size={20} className="text-text" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative rounded-lg p-2 transition-colors hover:bg-black/5"
          onClick={handleNotifications}
        >
          <Bell size={20} className="text-text" />
          <span className="absolute right-1 top-1 h-2 w-2 bg-danger"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 shadow-sm transition-colors hover:bg-background"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
              <User size={16} className="text-primary" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-40 truncate text-sm font-medium text-text">
                {user?.email}
              </p>
              <p className="text-xs text-text-secondary">{user?.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-white shadow-xl">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-danger hover:bg-background"
              >
                <LogOut size={16} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

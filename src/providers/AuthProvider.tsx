import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthContextType, UserRole } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (rawRole: unknown): UserRole => {
  if (typeof rawRole !== "string") {
    return "ADMIN";
  }

  const normalized = rawRole.toUpperCase().replace(/[\s-]+/g, "_");
  const allowedRoles: UserRole[] = [
    "ADMIN",
    "TECHNICIAN",
    "WAREHOUSE_WORKER",
    "AI_TECHNICIAN",
    "TRUCK_DRIVER",
  ];

  if (allowedRoles.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }

  return "ADMIN";
};

const resolveUserRole = (user: {
  app_metadata?: { role?: unknown };
  user_metadata?: { role?: unknown };
}): UserRole => {
  return normalizeRole(user.app_metadata?.role ?? user.user_metadata?.role);
};

const resolveUserName = (user: {
  email?: string | null;
  user_metadata?: { full_name?: unknown; name?: unknown };
}) => {
  const rawName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof rawName === "string" && rawName.trim()) {
    return rawName.trim();
  }

  return user.email || "";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const role = resolveUserRole(session.user);

          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: resolveUserName(session.user),
            role,
            created_at: session.user.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = resolveUserRole(session.user);

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: resolveUserName(session.user),
          role,
          created_at: session.user.created_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      const role = resolveUserRole(data.user);

      setUser({
        id: data.user.id,
        email: data.user.email || "",
        name: resolveUserName(data.user),
        role,
        created_at: data.user.created_at || new Date().toISOString(),
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

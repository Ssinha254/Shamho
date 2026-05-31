import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../providers/AuthProvider";

import { LandingPage } from "../pages/landing/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { MembersPage } from "../pages/members/MembersPage";
import { ProductsPage } from "../pages/products/ProductsPage";
import { InventoryPage } from "../pages/inventory/InventoryPage";
import { TransactionsPage } from "../pages/transactions/TransactionsPage";
import { TransactionDetailPage } from "../pages/transactions/TransactionDetailPage";
import { AIRecordsPage } from "../pages/ai-records/AIRecordsPage";
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage";
import { TechniciansPage } from "../pages/technicians/TechniciansPage";
import { LocationsPage } from "../pages/locations/LocationsPage";
import LocationDetailPage from "../pages/locations/LocationDetailPage";

const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === "TECHNICIAN") {
    return <Navigate to="/locations" replace />;
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <MembersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <ProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <TransactionDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-records"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <AIRecordsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/technicians"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN"]}
                      redirectByRole={{ TECHNICIAN: "/locations" }}
                      redirectTo="/login"
                    >
                      <TechniciansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/locations"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "TECHNICIAN"]}
                      redirectTo="/login"
                    >
                      <LocationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/location/:identifier"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "TECHNICIAN"]}
                      redirectTo="/login"
                    >
                      <LocationDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<RoleHomeRedirect />} />
                <Route path="*" element={<RoleHomeRedirect />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

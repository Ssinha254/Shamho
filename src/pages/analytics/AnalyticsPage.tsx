import React, { useMemo } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { EmptyState } from "../../components/shared/EmptyState";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAIAnalytics } from "../../hooks";

export const AnalyticsPage: React.FC = () => {
  const { data: analytics = [], isLoading, error } = useAIAnalytics();

  const analyticsChart = useMemo(
    () =>
      analytics.map((row) => ({
        name: row.technician_name,
        total_ai: row.total_ai,
        successful_ai: row.successful_ai,
        conception_rate: row.conception_rate,
      })),
    [analytics],
  );

  const totalAi = analytics.reduce(
    (sum, row) => sum + Number(row.total_ai || 0),
    0,
  );
  const successfulAi = analytics.reduce(
    (sum, row) => sum + Number(row.successful_ai || 0),
    0,
  );
  const avgConception = analytics.length
    ? analytics.reduce(
        (sum, row) => sum + Number(row.conception_rate || 0),
        0,
      ) / analytics.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        description="Business insights and performance metrics"
      />

      {isLoading ? (
        <div className="card">Loading analytics from Supabase...</div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to load analytics from ai_analytics_view.
        </div>
      ) : analytics.length === 0 ? (
        <EmptyState
          title="No AI analytics records"
          description="This page uses live data from ai_analytics_view, so charts will appear after AI records exist in Supabase."
        />
      ) : null}

      {analytics.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-text mb-4">
                AI by Technician
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_ai"
                    stroke="#1F4D3A"
                    strokeWidth={2}
                    name="Total AI"
                  />
                  <Line
                    type="monotone"
                    dataKey="successful_ai"
                    stroke="#D97706"
                    strokeWidth={2}
                    name="Successful AI"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-text mb-4">
                Conception Rate
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conception_rate" fill="#1F4D3A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h4 className="text-sm font-semibold text-text-secondary mb-4">
                Total AI Records
              </h4>
              <p className="text-3xl font-bold text-danger">{totalAi}</p>
              <p className="text-xs text-text-secondary mt-2">
                Real count from ai_analytics_view
              </p>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold text-text-secondary mb-4">
                AI Conception Rate
              </h4>
              <p className="text-3xl font-bold text-success">
                {avgConception.toFixed(1)}%
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Live from ai_analytics_view
              </p>
            </div>

            <div className="card">
              <h4 className="text-sm font-semibold text-text-secondary mb-4">
                Successful AI Records
              </h4>
              <p className="text-3xl font-bold text-primary">{successfulAi}</p>
              <p className="text-xs text-text-secondary mt-2">
                Real successful AI count from Supabase
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

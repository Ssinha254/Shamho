import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "../../components/shared/StatCard";
import { EmptyState } from "../../components/shared/EmptyState";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Zap,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import {
  useAIRecords,
  useInventory,
  useMembers,
  useTransactions,
} from "../../hooks";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDateKey = (value: string) => value.slice(0, 10);

const getDaysAgoKey = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getDateKey(date.toISOString());
};

const formatDayLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });

export const DashboardPage: React.FC = () => {
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: inventory = [], isLoading: inventoryLoading } = useInventory();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions();
  const { data: aiRecords = [], isLoading: aiLoading } = useAIRecords();

  const isLoading =
    membersLoading || inventoryLoading || transactionsLoading || aiLoading;

  const hasDashboardData =
    members.length > 0 ||
    inventory.length > 0 ||
    transactions.length > 0 ||
    aiRecords.length > 0;

  const metrics = useMemo(() => {
    const todayKey = getDateKey(new Date().toISOString());

    const todaySales = transactions
      .filter((transaction) => getDateKey(transaction.date) === todayKey)
      .reduce((total, transaction) => total + transaction.total, 0);

    const outstandingCredit = transactions
      .filter((transaction) => transaction.payment_type === "CREDIT")
      .reduce((total, transaction) => total + transaction.total, 0);

    const inventoryValue = inventory.reduce(
      (total, batch) => total + batch.quantity * batch.cost,
      0,
    );

    const aiDoneToday = aiRecords.filter(
      (record) => getDateKey(record.date) === todayKey,
    ).length;

    const lowStockAlerts = inventory.filter(
      (batch) => batch.quantity < 50,
    ).length;

    const expiringBatches = inventory.filter((batch) => {
      if (!batch.expiry_date) {
        return false;
      }

      const expiry = new Date(batch.expiry_date);
      const diffDays = Math.ceil(
        (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays <= 30;
    }).length;

    return {
      todaySales,
      outstandingCredit,
      inventoryValue,
      aiDoneToday,
      lowStockAlerts,
      expiringBatches,
    };
  }, [transactions, inventory, aiRecords]);

  const salesData = useMemo(() => {
    const totals = new Map<string, { sales: number; transactions: number }>();

    transactions.forEach((transaction) => {
      const key = getDateKey(transaction.date);
      const current = totals.get(key) || { sales: 0, transactions: 0 };
      current.sales += transaction.total;
      current.transactions += 1;
      totals.set(key, current);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        date: formatDayLabel(key),
        sales: value.sales,
        transactions: value.transactions,
      }));
  }, [transactions]);

  const aiTrendData = useMemo(() => {
    const totals = new Map<string, number>();

    aiRecords.forEach((record) => {
      const key = getDateKey(record.date);
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        date: formatDayLabel(key),
        ai_records: value,
      }));
  }, [aiRecords]);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();

    inventory.forEach((batch) => {
      const category = batch.category || "Uncategorized";
      totals.set(category, (totals.get(category) || 0) + batch.quantity);
    });

    const colors = [
      "#1F4D3A",
      "#163829",
      "#DDEFE5",
      "#5F6368",
      "#D97706",
      "#16A34A",
    ];

    return Array.from(totals.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [inventory]);

  const topProductsData = useMemo(() => {
    const totals = new Map<string, number>();

    inventory.forEach((batch) => {
      totals.set(
        batch.product_name,
        (totals.get(batch.product_name) || 0) + batch.quantity,
      );
    });

    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [inventory]);

  const recentTransactions = transactions.slice(0, 4);
  const lowStockItems = inventory
    .filter((batch) => batch.quantity < 20)
    .slice(0, 4);
  const recentAIEntries = aiRecords.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-primary-dark via-primary to-emerald-700 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Overview
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="text-sm text-white/80 sm:text-base">
              Welcome back. Here’s a clear view of sales, inventory, and AI
              activity across the business.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Today Sales</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(metrics.todaySales)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Outstanding</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(metrics.outstandingCredit)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">AI Done</p>
              <p className="mt-1 text-lg font-semibold">
                {metrics.aiDoneToday}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Alerts</p>
              <p className="mt-1 text-lg font-semibold">
                {metrics.lowStockAlerts + metrics.expiringBatches}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Today Sales"
            value={formatCurrency(metrics.todaySales)}
            icon={<ShoppingCart size={24} />}
          />
          <StatCard
            label="Outstanding Credit"
            value={formatCurrency(metrics.outstandingCredit)}
            icon={<DollarSign size={24} />}
          />
          <StatCard
            label="Inventory Value"
            value={formatCurrency(metrics.inventoryValue)}
            icon={<Package size={24} />}
          />
          <StatCard
            label="AI Done Today"
            value={metrics.aiDoneToday}
            icon={<Zap size={24} />}
          />
          <StatCard
            label="Low Stock Alerts"
            value={metrics.lowStockAlerts}
            icon={<AlertCircle size={24} />}
          />
          <StatCard
            label="Expiring Batches"
            value={metrics.expiringBatches}
            icon={<Calendar size={24} />}
          />
        </div>
      )}

      {!hasDashboardData ? (
        <EmptyState
          title="No records yet"
          description="Dashboard metrics will appear here after transactions, inventory, members, or AI records are created in Supabase."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h3 className="mb-4 text-lg font-semibold text-text">
                Sales Trend
              </h3>
              {salesData.length === 0 ? (
                <EmptyState
                  title="No sales data"
                  description="Sales trend will show real transaction dates once sales are recorded."
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#1F4D3A" name="Sales (₹)" />
                    <Bar
                      dataKey="transactions"
                      fill="#D97706"
                      name="Transactions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 className="mb-4 text-lg font-semibold text-text">
                Category Distribution
              </h3>
              {categoryData.length === 0 ? (
                <EmptyState
                  title="No inventory data"
                  description="Category breakdown will appear once product batches exist in Supabase."
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="mb-4 text-lg font-semibold text-text">
                Top Products
              </h3>
              {topProductsData.length === 0 ? (
                <EmptyState
                  title="No product data"
                  description="Top products will appear once inventory batches are added."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    layout="vertical"
                    data={topProductsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16A34A" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 className="mb-4 text-lg font-semibold text-text">
                AI Conception Trend
              </h3>
              {aiTrendData.length === 0 ? (
                <EmptyState
                  title="No AI records"
                  description="This chart uses real AI records from Supabase and will appear after records are created."
                />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={aiTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="ai_records"
                      stroke="#1F4D3A"
                      strokeWidth={2}
                      dot={{ fill: "#1F4D3A", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-text">
            Recent Transactions
          </h3>
          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Recent transactions will appear after a bill is created in Supabase."
            />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      Bill {transaction.bill_no}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {transaction.member_name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text">
                    {formatCurrency(transaction.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-text">
            Low Stock Items
          </h3>
          {lowStockItems.length === 0 ? (
            <EmptyState
              title="No low stock alerts"
              description="This section is driven by actual inventory quantities from Supabase."
            />
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {item.product_name}
                    </p>
                    <div className="w-32 h-2 bg-border rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-warning"
                        style={{
                          width: `${Math.min((item.quantity / 20) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-text-secondary">
                    {item.quantity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-text">
            Recent AI Entries
          </h3>
          {recentAIEntries.length === 0 ? (
            <EmptyState
              title="No AI entries yet"
              description="Recent AI activity will show here once records exist in Supabase."
            />
          ) : (
            <div className="space-y-3">
              {recentAIEntries.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between rounded-2xl bg-background px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">
                      {record.member_name} - {record.animal_id}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Batch: {record.semen_batch_code}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-primary-light text-primary text-xs rounded-lg font-medium">
                    {record.pregnancy_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

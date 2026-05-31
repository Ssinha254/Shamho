export type UserRole =
  | "ADMIN"
  | "TECHNICIAN"
  | "WAREHOUSE_WORKER"
  | "AI_TECHNICIAN"
  | "TRUCK_DRIVER";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: string;
}

export interface Member {
  id: string;
  member_code: string;
  name: string;
  village: string;
  member_type: string;
  shares: number;
  outstanding: number;
  created_at: string;
  is_active?: boolean;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  category: string;
  unit: string;
  created_at: string;
}

export interface Batch {
  id: string;
  batch_code: string;
  product_id: string;
  product_name: string;
  category: string;
  location_id: string;
  location_code: string;
  quantity: number;
  cost: number;
  expiry_date: string;
  status: "ACTIVE" | "EXPIRED" | "DAMAGED";
  created_at: string;
}

export interface Location {
  id: string;
  location_code: string;
  remarks: string;
  total_stock: number;
  total_batches: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  bill_no: string;
  member_id: string;
  member_name: string;
  technician_id: string;
  technician_name: string;
  payment_type: "CASH" | "CREDIT";
  total: number;
  remarks?: string;
  delivery_status?: "DIRECT_PICKUP" | "DELIVERY_PENDING" | "DELIVERED";
  truck_driver_id?: string;
  delivery_otp?: string;
  items: TransactionItem[];
  date: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  batch_id: string;
  batch_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface AIRecord {
  id: string;
  member_id: string;
  member_name: string;
  animal_id: string;
  semen_batch_id: string;
  semen_batch_code: string;
  technician_id: string;
  technician_name: string;
  pregnancy_status: "PENDING" | "POSITIVE" | "NEGATIVE";
  remarks: string;
  date: string;
  created_at: string;
}

export interface Technician {
  id: string;
  technician_code?: string;
  name: string;
  role?: "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER";
  mobile: string;
  assigned_area: string;
  ai_count: number;
  transactions_handled: number;
  created_at: string;
}

export interface DashboardStats {
  today_sales: number;
  outstanding_credit: number;
  inventory_value: number;
  ai_done_today: number;
  low_stock_alerts: number;
  expiring_batches: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

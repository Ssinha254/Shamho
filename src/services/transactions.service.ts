import { supabase } from "../lib/supabase";
import type { Transaction } from "../types";
import {
  getMemberLookups,
  getTechnicianLookups,
} from "./reference-data.service";

type TransactionRow = {
  transaction_id: string;
  transaction_code: string;
  member_id: string;
  technician_id: string | null;
  transaction_date: string;
  payment_type: "CASH" | "CREDIT" | "UPI" | "BANK" | null;
  total_amount: number;
  remarks: string | null;
  deleted_at: string | null;
};

const getRemarkValue = (remarks: string | null, key: string) => {
  if (!remarks) return "";
  const match = remarks.match(new RegExp(`${key}:([^|]+)`));
  return match?.[1] || "";
};

const parseDeliveryMeta = (remarks: string | null) => {
  if (!remarks) {
    return {
      delivery_status: "DIRECT_PICKUP" as const,
      truck_driver_id: "",
      delivery_otp: "",
    };
  }

  if (remarks.includes("DELIVERY_PENDING")) {
    const driverMatch = remarks.match(/driver:([a-zA-Z0-9-]+)/);
    return {
      delivery_status: "DELIVERY_PENDING" as const,
      truck_driver_id: driverMatch?.[1] || "",
      delivery_otp: getRemarkValue(remarks, "otp"),
    };
  }

  if (remarks.includes("DELIVERY_CONFIRMED")) {
    const driverMatch = remarks.match(/driver:([a-zA-Z0-9-]+)/);
    return {
      delivery_status: "DELIVERED" as const,
      truck_driver_id: driverMatch?.[1] || "",
      delivery_otp: getRemarkValue(remarks, "otp"),
    };
  }

  return {
    delivery_status: "DIRECT_PICKUP" as const,
    truck_driver_id: "",
    delivery_otp: "",
  };
};

type MemberRow = {
  member_id: string;
  member_name: string;
};

type TechnicianRow = {
  technician_id: string;
  technician_name: string;
};

type TransactionItemRow = {
  transaction_item_id: string;
  transaction_id: string;
  batch_id: string;
  quantity: number;
  rate: number;
  total_price: number;
  transaction_type: string;
};

type TransactionDetailRow = {
  transaction_id: string;
  transaction_code: string;
  transaction_date: string;
  member_name: string;
  member_code: string;
  technician_name: string;
  product_name: string;
  batch_code: string;
  quantity: number;
  rate: number;
  total_price: number;
  transaction_type: string;
};

const formatTechnicianLabel = (technicianId: string | null) => {
  if (!technicianId) {
    return "Unknown Technician";
  }

  return `Technician ${technicianId.slice(0, 8)}`;
};

const enrichTransactions = (
  rows: TransactionRow[],
  members: MemberRow[],
  technicians: TechnicianRow[],
): Transaction[] => {
  const memberMap = new Map(
    members.map((member) => [member.member_id, member.member_name]),
  );
  const technicianMap = new Map(
    technicians.map((tech) => [tech.technician_id, tech.technician_name]),
  );

  return rows.map((row) => {
    const deliveryMeta = parseDeliveryMeta(row.remarks);
    const recordedTechnicianName = getRemarkValue(row.remarks, "techname");

    return {
      id: row.transaction_id,
      bill_no: row.transaction_code,
      member_id: row.member_id,
      member_name: memberMap.get(row.member_id) || "Unknown Member",
      technician_id: row.technician_id || "",
      technician_name:
        recordedTechnicianName ||
        (row.technician_id && technicianMap.get(row.technician_id)) ||
        formatTechnicianLabel(row.technician_id),
      payment_type: (row.payment_type as any) || "CASH",
      total: row.total_amount || 0,
      remarks: row.remarks || "",
      delivery_status: deliveryMeta.delivery_status,
      truck_driver_id: deliveryMeta.truck_driver_id,
      delivery_otp: deliveryMeta.delivery_otp,
      items: [],
      date: row.transaction_date || "",
      created_at: row.transaction_date || "",
    } as Transaction;
  });
};

export const transactionsService = {
  async getTransactions(): Promise<Transaction[]> {
    const [transactionsResult, members, technicians] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "transaction_id, transaction_code, member_id, technician_id, transaction_date, payment_type, total_amount, remarks, deleted_at",
        )
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false }),
      getMemberLookups(),
      getTechnicianLookups(),
    ]);

    const { data: transactions, error: transactionsError } = transactionsResult;

    if (transactionsError) throw transactionsError;

    return enrichTransactions(
      (transactions || []) as TransactionRow[],
      members as MemberRow[],
      technicians as TechnicianRow[],
    );
  },

  async getTransactionsByMember(memberId: string): Promise<Transaction[]> {
    const [transactionsResult, members, technicians] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "transaction_id, transaction_code, member_id, technician_id, transaction_date, payment_type, total_amount, remarks, deleted_at",
        )
        .eq("member_id", memberId)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false }),
      getMemberLookups(),
      getTechnicianLookups(),
    ]);

    const { data: transactions, error: transactionsError } = transactionsResult;

    if (transactionsError) throw transactionsError;

    return enrichTransactions(
      (transactions || []) as TransactionRow[],
      members as MemberRow[],
      technicians as TechnicianRow[],
    );
  },

  async getTransactionsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    const [transactionsResult, members, technicians] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "transaction_id, transaction_code, member_id, technician_id, transaction_date, payment_type, total_amount, remarks, deleted_at",
        )
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false }),
      getMemberLookups(),
      getTechnicianLookups(),
    ]);

    const { data: transactions, error: transactionsError } = transactionsResult;

    if (transactionsError) throw transactionsError;

    return enrichTransactions(
      (transactions || []) as TransactionRow[],
      members as MemberRow[],
      technicians as TechnicianRow[],
    );
  },

  async createTransaction(transactionData: {
    memberId: string;
    technicianId: string;
    technicianName?: string;
    paymentType: "CASH" | "CREDIT";
    remarks?: string;
    items: Array<{ batch_id: string; quantity: number; unit_price: number }>;
  }): Promise<Transaction> {
    const remarksParts = [transactionData.remarks?.trim()].filter(
      Boolean,
    ) as string[];
    if (transactionData.technicianName?.trim()) {
      remarksParts.push(`techname:${transactionData.technicianName.trim()}`);
    }

    const { data, error } = await supabase.rpc("create_sale_transaction", {
      p_member_id: transactionData.memberId,
      p_technician_id: transactionData.technicianId,
      p_payment_type: transactionData.paymentType,
      p_remarks: remarksParts.length ? remarksParts.join("|") : null,
      p_items: transactionData.items.map((item) => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        rate: item.unit_price,
        unit_price: item.unit_price,
      })),
    });

    if (error) throw error;
    return data as Transaction;
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const [transactionResult, members, technicians] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "transaction_id, transaction_code, member_id, technician_id, transaction_date, payment_type, total_amount, remarks, deleted_at",
        )
        .eq("transaction_id", id)
        .is("deleted_at", null)
        .single(),
      getMemberLookups(),
      getTechnicianLookups(),
    ]);

    const { data: transaction, error: transactionError } = transactionResult;

    if (transactionError) throw transactionError;

    // fetch transaction items and enrich with batch_code and product_name
    const { data: itemsData, error: itemsError } = await supabase
      .from("transaction_items")
      .select(
        "transaction_item_id, transaction_id, batch_id, quantity, rate, total_price, transaction_type",
      )
      .eq("transaction_id", id);

    if (itemsError) throw itemsError;

    const batchIds = Array.from(
      new Set((itemsData || []).map((it: any) => it.batch_id).filter(Boolean)),
    );

    const { data: batchesData, error: batchesError } = await supabase
      .from("product_batch")
      .select("batch_id, batch_code, product_id")
      .in("batch_id", batchIds || []);

    if (batchesError) throw batchesError;

    const productIds = Array.from(
      new Set(
        (batchesData || []).map((b: any) => b.product_id).filter(Boolean),
      ),
    );
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("product_id, product_name")
      .in("product_id", productIds || []);

    if (productsError) throw productsError;

    const batchMap = new Map(
      (batchesData || []).map((b: any) => [b.batch_id, b]),
    );
    const productMap = new Map(
      (productsData || []).map((p: any) => [p.product_id, p.product_name]),
    );

    const items = (itemsData || []).map((it: any) => {
      const batch = batchMap.get(it.batch_id) || {
        batch_code: "Unknown Batch",
        product_id: null,
      };
      const productName = batch.product_id
        ? productMap.get(batch.product_id) || "Unknown Product"
        : "Unknown Product";
      return {
        id: it.transaction_item_id,
        batch_id: it.batch_id,
        batch_code: batch.batch_code || "",
        product_name: productName,
        quantity: it.quantity,
        unit_price: it.rate,
        total: it.total_price,
      };
    });

    const tx = enrichTransactions(
      [transaction as TransactionRow],
      members as MemberRow[],
      technicians as TechnicianRow[],
    )[0];
    tx.items = items;
    return tx;
  },

  async getTransactionDetailsById(id: string): Promise<TransactionDetailRow[]> {
    const { data, error } = await supabase
      .from("transaction_detail_view")
      .select(
        "transaction_id, transaction_code, transaction_date, member_name, member_code, technician_name, product_name, batch_code, quantity, rate, total_price, transaction_type",
      )
      .eq("transaction_id", id)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return (data || []) as TransactionDetailRow[];
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("transaction_id", transactionId);

    if (error) throw error;
  },

  async deleteTransactions(transactionIds: string[]): Promise<void> {
    if (!transactionIds.length) {
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .in("transaction_id", transactionIds);

    if (error) throw error;
  },

  async updateTransactionRemarks(
    transactionId: string,
    remarks: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("transactions")
      .update({ remarks })
      .eq("transaction_id", transactionId);

    if (error) throw error;
  },

  async confirmDelivery(
    transactionId: string,
    truckDriverId: string,
    otp: string,
  ): Promise<void> {
    const confirmedAt = new Date().toISOString();
    const remarks = `DELIVERY_CONFIRMED|driver:${truckDriverId}|otp:${otp}|at:${confirmedAt}`;
    await this.updateTransactionRemarks(transactionId, remarks);
  },
};

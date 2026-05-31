import { supabase } from "../lib/supabase";
import type { Batch } from "../types";

type BatchRow = {
  batch_id: string;
  batch_code: string;
  product_name: string;
  product_category: string | null;
  location_code: string;
  quantity: number;
  cost_per_unit: number | null;
  expiry_date: string | null;
  manufacture_date: string | null;
  status: string;
  deleted_at?: string | null;
};

const enrichBatches = (batches: BatchRow[]): Batch[] => {
  return batches.map((batch) => {
    return {
      id: batch.batch_id,
      batch_code: batch.batch_code,
      product_id: "",
      product_name: batch.product_name || "Unknown Product",
      category: batch.product_category || "Uncategorized",
      location_id: "",
      location_code: batch.location_code || "Unknown Location",
      quantity: batch.quantity,
      cost: batch.cost_per_unit || 0,
      expiry_date: batch.expiry_date || "",
      status:
        (batch.status as any) ||
        (batch.expiry_date && new Date(batch.expiry_date) < new Date()
          ? "EXPIRED"
          : "ACTIVE"),
      created_at: batch.manufacture_date || batch.expiry_date || "",
    };
  });
};

export const inventoryService = {
  async getBatches(): Promise<Batch[]> {
    const { data: batches, error } = await supabase
      .from("inventory_view")
      .select(
        "batch_id, batch_code, product_name, product_category, location_code, quantity, cost_per_unit, manufacture_date, expiry_date, status",
      )
      .order("batch_code", { ascending: true });

    if (error) throw error;

    return enrichBatches((batches || []) as BatchRow[]);
  },

  async getBatchesByLocation(locationId: string): Promise<Batch[]> {
    const batches = await this.getBatches();
    return batches.filter(
      (batch) =>
        batch.location_id === locationId || batch.location_code === locationId,
    );
  },

  async getBatchesByStatus(
    status: "ACTIVE" | "EXPIRED" | "DAMAGED",
  ): Promise<Batch[]> {
    const batches = await this.getBatches();
    return batches.filter((batch) => batch.status === status);
  },

  async getLowStockBatches(threshold: number): Promise<Batch[]> {
    const batches = await this.getBatches();
    return batches.filter((batch) => batch.quantity < threshold);
  },

  async addStock(batchId: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc("add_stock", {
      p_batch_id: batchId,
      p_quantity: quantity,
    });

    if (error) throw error;
  },

  async damageStock(batchId: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc("damage_stock", {
      p_batch_id: batchId,
      p_quantity: quantity,
    });

    if (error) throw error;
  },

  async returnStock(batchId: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc("return_stock", {
      p_batch_id: batchId,
      p_quantity: quantity,
    });

    if (error) throw error;
  },

  async createBatch(data: {
    batch_code: string;
    product_id: string;
    location_id: string;
    quantity: number;
    cost_per_unit?: number | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
  }) {
    const { data: created, error } = await supabase
      .from("product_batch")
      .insert([
        {
          batch_code: data.batch_code,
          product_id: data.product_id,
          location_id: data.location_id,
          quantity: data.quantity,
          cost_per_unit: data.cost_per_unit || null,
          manufacture_date: data.manufacture_date || null,
          expiry_date: data.expiry_date || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async updateBatch(
    batchId: string,
    updates: {
      batch_code?: string;
      quantity?: number;
      cost_per_unit?: number | null;
      expiry_date?: string | null;
      status?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("product_batch")
      .update({
        batch_code: updates.batch_code,
        quantity: updates.quantity,
        cost_per_unit: updates.cost_per_unit,
        expiry_date: updates.expiry_date,
        status: updates.status,
      })
      .eq("batch_id", batchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBatch(batchId: string): Promise<void> {
    const { error } = await supabase
      .from("product_batch")
      .update({ status: "DELETED" })
      .eq("batch_id", batchId);

    if (error) throw error;
  },
};

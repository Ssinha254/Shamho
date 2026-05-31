import { supabase } from "../lib/supabase";

export interface LocationSummary {
  id: string;
  location_code: string;
  remarks: string | null;
  total_stock: number;
  total_batches: number;
  created_at: string;
}

type LocationRow = {
  location_id: string;
  location_code: string;
  remarks: string | null;
  deleted_at: string | null;
};

type BatchRow = {
  location_id: string | null;
  quantity: number | null;
  status: string | null;
};

export const locationsService = {
  async createLocation(locationData: {
    location_code: string;
    remarks?: string | null;
  }): Promise<LocationSummary> {
    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          location_code: locationData.location_code,
          remarks: locationData.remarks || null,
        },
      ])
      .select("location_id, location_code, remarks")
      .single();

    if (error) throw error;

    return {
      id: data.location_id,
      location_code: data.location_code,
      remarks: data.remarks,
      total_stock: 0,
      total_batches: 0,
      created_at: "",
    };
  },

  async getLocations(): Promise<LocationSummary[]> {
    const [locationsResult, batchesResult] = await Promise.all([
      supabase
        .from("locations")
        .select("location_id, location_code, remarks")
        .is("deleted_at", null)
        .order("location_code", { ascending: true }),
      supabase.from("product_batch").select("location_id, quantity, status"),
    ]);

    const { data: locations, error: locationsError } = locationsResult;
    const { data: batches, error: batchesError } = batchesResult;

    if (locationsError) throw locationsError;
    if (batchesError) throw batchesError;

    const totals = new Map<
      string,
      { total_stock: number; total_batches: number }
    >();

    (batches || []).forEach((batch: BatchRow) => {
      if (!batch.location_id || batch.status === "DELETED") {
        return;
      }

      const current = totals.get(batch.location_id) || {
        total_stock: 0,
        total_batches: 0,
      };
      current.total_batches += 1;
      current.total_stock += batch.quantity || 0;
      totals.set(batch.location_id, current);
    });

    return ((locations || []) as LocationRow[]).map((location) => {
      const totalsForLocation = totals.get(location.location_id) || {
        total_stock: 0,
        total_batches: 0,
      };

      return {
        id: location.location_id,
        location_code: location.location_code,
        remarks: location.remarks,
        total_stock: totalsForLocation.total_stock,
        total_batches: totalsForLocation.total_batches,
        created_at: "",
      };
    });
  },

  async updateLocation(
    id: string,
    updates: { location_code?: string; remarks?: string | null },
  ): Promise<void> {
    const { error } = await supabase
      .from("locations")
      .update({
        location_code: updates.location_code,
        remarks: updates.remarks,
      })
      .eq("location_id", id);

    if (error) throw error;
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from("locations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("location_id", id);

    if (error) throw error;
  },
};

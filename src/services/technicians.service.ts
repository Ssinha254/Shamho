import { supabase } from "../lib/supabase";
import { clearReferenceDataCache } from "./reference-data.service";

export interface TechnicianSummary {
  id: string;
  technician_code: string;
  name: string;
  role: "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER";
  mobile: string;
  assigned_area: string;
  ai_count: number;
  transactions_handled: number;
  created_at: string;
}

type TechnicianRow = {
  technician_id: string;
  technician_code: string;
  technician_name: string;
  mobile: string | null;
  assigned_area: string | null;
  deleted_at: string | null;
};

const rolePrefixMap = {
  WAREHOUSE_WORKER: "WH",
  AI_TECHNICIAN: "AI",
  TRUCK_DRIVER: "TR",
} as const;

const inferRoleFromCode = (
  technicianCode: string,
): "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER" => {
  const code = technicianCode.toUpperCase();
  if (code.startsWith("WH-")) return "WAREHOUSE_WORKER";
  if (code.startsWith("TR-")) return "TRUCK_DRIVER";
  return "AI_TECHNICIAN";
};

const ensureCodePrefix = (
  role: "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER",
  technicianCode: string,
) => {
  const trimmed = technicianCode.trim().toUpperCase();
  const prefix = `${rolePrefixMap[role]}-`;
  if (trimmed.startsWith(prefix)) {
    return trimmed;
  }
  return `${prefix}${trimmed}`;
};

export const techniciansService = {
  async getTechnicians(): Promise<TechnicianSummary[]> {
    const { data, error } = await supabase
      .from("technician")
      .select(
        "technician_id, technician_code, technician_name, mobile, assigned_area, deleted_at",
      )
      .is("deleted_at", null)
      .order("technician_name", { ascending: true });

    if (error) throw error;

    return ((data || []) as TechnicianRow[]).map((technician) => ({
      id: technician.technician_id,
      technician_code: technician.technician_code,
      name: technician.technician_name,
      role: inferRoleFromCode(technician.technician_code),
      mobile: technician.mobile || "",
      assigned_area: technician.assigned_area || "",
      ai_count: 0,
      transactions_handled: 0,
      created_at: "",
    }));
  },

  async createTechnician(data: {
    technician_code: string;
    technician_name: string;
    mobile?: string | null;
    assigned_area?: string | null;
    role: "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER";
  }): Promise<void> {
    const { error } = await supabase.from("technician").insert([
      {
        technician_code: ensureCodePrefix(data.role, data.technician_code),
        technician_name: data.technician_name,
        mobile: data.mobile || null,
        assigned_area: data.assigned_area || null,
      },
    ]);

    if (error) throw error;
    clearReferenceDataCache();
  },

  async updateTechnician(
    id: string,
    updates: {
      technician_code: string;
      technician_name: string;
      mobile?: string | null;
      assigned_area?: string | null;
      role: "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER";
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("technician")
      .update({
        technician_code: ensureCodePrefix(
          updates.role,
          updates.technician_code,
        ),
        technician_name: updates.technician_name,
        mobile: updates.mobile || null,
        assigned_area: updates.assigned_area || null,
      })
      .eq("technician_id", id);

    if (error) throw error;
    clearReferenceDataCache();
  },

  async deleteTechnician(id: string): Promise<void> {
    const { error } = await supabase
      .from("technician")
      .update({ deleted_at: new Date().toISOString() })
      .eq("technician_id", id);

    if (error) throw error;
    clearReferenceDataCache();
  },
};

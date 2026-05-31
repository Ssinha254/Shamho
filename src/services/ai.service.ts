import { supabase } from "../lib/supabase";
import type { AIRecord } from "../types";
import {
  getMemberLookups,
  getTechnicianLookups,
} from "./reference-data.service";

type AIRecordRow = {
  ai_record_id: string;
  member_id: string | null;
  animal_id: string | null;
  batch_id: string | null;
  technician_id: string | null;
  pregnancy_status: "PENDING" | "PREGNANT" | "NOT_PREGNANT";
  ai_date: string;
  deleted_at: string | null;
};

type MemberRow = {
  member_id: string;
  member_name: string;
};

type BatchRow = {
  batch_id: string;
  batch_code: string;
};

type TechnicianRow = {
  technician_id: string;
  technician_name: string;
};

type AIAnalyticsRow = {
  technician_name: string;
  total_ai: number;
  successful_ai: number;
  conception_rate: number;
};

const formatTechnicianLabel = (technicianId: string | null) => {
  if (!technicianId) return "Unknown Technician";
  return `Technician ${technicianId.slice(0, 8)}`;
};

const enrichAIRecords = (
  rows: AIRecordRow[],
  members: MemberRow[],
  batches: BatchRow[],
  technicians: TechnicianRow[],
): AIRecord[] => {
  const memberMap = new Map(
    members.map((member) => [member.member_id, member.member_name]),
  );
  const batchMap = new Map(
    batches.map((batch) => [batch.batch_id, batch.batch_code]),
  );
  const technicianMap = new Map(
    technicians.map((technician) => [
      technician.technician_id,
      technician.technician_name,
    ]),
  );

  return rows.map((record) => ({
    id: record.ai_record_id,
    member_id: record.member_id || "",
    member_name: record.member_id
      ? memberMap.get(record.member_id) || "Unknown Member"
      : "Unknown Member",
    animal_id: record.animal_id || "",
    semen_batch_id: record.batch_id || "",
    semen_batch_code: record.batch_id
      ? batchMap.get(record.batch_id) || "Unknown Batch"
      : "Unknown Batch",
    technician_id: record.technician_id || "",
    technician_name:
      (record.technician_id && technicianMap.get(record.technician_id)) ||
      formatTechnicianLabel(record.technician_id),
    pregnancy_status: record.pregnancy_status,
    remarks: "",
    date: record.ai_date,
    created_at: record.ai_date,
  }));
};

export const aiService = {
  async getAIRecords(): Promise<AIRecord[]> {
    const [recordsResult, membersResult, batchesResult, technicians] =
      await Promise.all([
        supabase
          .from("ai_record")
          .select(
            "ai_record_id, member_id, animal_id, batch_id, technician_id, pregnancy_status, ai_date, deleted_at",
          )
          .is("deleted_at", null)
          .order("ai_date", { ascending: false }),
        getMemberLookups(),
        supabase.from("product_batch").select("batch_id, batch_code"),
        getTechnicianLookups(),
      ]);

    const { data: records, error: recordsError } = recordsResult;
    const members = membersResult;
    const { data: batches, error: batchesError } = batchesResult;

    if (recordsError) throw recordsError;
    if (batchesError) throw batchesError;

    return enrichAIRecords(
      (records || []) as AIRecordRow[],
      members as MemberRow[],
      (batches || []) as BatchRow[],
      technicians as TechnicianRow[],
    );
  },

  async getAIRecordsByMember(memberId: string): Promise<AIRecord[]> {
    const [recordsResult, membersResult, batchesResult, technicians] =
      await Promise.all([
        supabase
          .from("ai_record")
          .select(
            "ai_record_id, member_id, animal_id, batch_id, technician_id, pregnancy_status, ai_date, deleted_at",
          )
          .eq("member_id", memberId)
          .is("deleted_at", null)
          .order("ai_date", { ascending: false }),
        getMemberLookups(),
        supabase.from("product_batch").select("batch_id, batch_code"),
        getTechnicianLookups(),
      ]);

    const { data: records, error: recordsError } = recordsResult;
    const members = membersResult;
    const { data: batches, error: batchesError } = batchesResult;

    if (recordsError) throw recordsError;
    if (batchesError) throw batchesError;

    return enrichAIRecords(
      (records || []) as AIRecordRow[],
      members as MemberRow[],
      (batches || []) as BatchRow[],
      technicians as TechnicianRow[],
    );
  },

  async createAIRecord(recordData: Partial<AIRecord>): Promise<AIRecord> {
    const { data, error } = await supabase
      .from("ai_record")
      .insert([
        {
          member_id: recordData.member_id,
          animal_id: recordData.animal_id,
          batch_id: recordData.semen_batch_id,
          technician_id: recordData.technician_id,
          pregnancy_status: recordData.pregnancy_status,
          ai_date: recordData.date,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: (data as any).ai_record_id,
      member_id: (data as any).member_id,
      member_name: "",
      animal_id: (data as any).animal_id,
      semen_batch_id: (data as any).batch_id,
      semen_batch_code: "",
      technician_id: (data as any).technician_id,
      technician_name: "",
      pregnancy_status: (data as any).pregnancy_status,
      remarks: "",
      date: (data as any).ai_date,
      created_at: (data as any).ai_date,
    };
  },

  async updateAIRecordStatus(
    recordId: string,
    status: "PENDING" | "POSITIVE" | "NEGATIVE",
  ): Promise<void> {
    const { error } = await supabase
      .from("ai_record")
      .update({ pregnancy_status: status })
      .eq("ai_record_id", recordId);

    if (error) throw error;
  },

  async updateAIRecord(
    recordId: string,
    updates: {
      pregnancy_status?: "PENDING" | "POSITIVE" | "NEGATIVE";
      ai_date?: string;
      animal_id?: string;
      technician_id?: string;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("ai_record")
      .update({
        pregnancy_status: updates.pregnancy_status,
        ai_date: updates.ai_date,
        animal_id: updates.animal_id,
        technician_id: updates.technician_id,
      })
      .eq("ai_record_id", recordId);

    if (error) throw error;
  },

  async deleteAIRecord(recordId: string): Promise<void> {
    const { error } = await supabase
      .from("ai_record")
      .update({ deleted_at: new Date().toISOString() })
      .eq("ai_record_id", recordId);

    if (error) throw error;
  },

  async deleteAIRecords(recordIds: string[]): Promise<void> {
    if (!recordIds.length) {
      return;
    }

    const { error } = await supabase
      .from("ai_record")
      .update({ deleted_at: new Date().toISOString() })
      .in("ai_record_id", recordIds);

    if (error) throw error;
  },

  async getConceptionRate(startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase.rpc("get_conception_rate", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw error;
    return data || 0;
  },

  async getAIAnalytics(): Promise<AIAnalyticsRow[]> {
    const { data, error } = await supabase
      .from("ai_analytics_view")
      .select("technician_name, total_ai, successful_ai, conception_rate")
      .order("total_ai", { ascending: false });

    if (error) throw error;
    return (data || []) as AIAnalyticsRow[];
  },
};

import { supabase } from "../lib/supabase";
import type { Member } from "../types";
import { clearReferenceDataCache } from "./reference-data.service";

type MemberRow = {
  member_id: string;
  member_code: string;
  member_name: string;
  mobile: string | null;
  village: string | null;
  member_type: "SMALL" | "MEDIUM" | "LARGE";
  share_count: number | null;
  credit_limit: number | null;
  outstanding_amount: number | null;
  joined_at: string | null;
  is_active: boolean | null;
};

const mapMember = (row: MemberRow): Member => ({
  id: row.member_id,
  member_code: row.member_code,
  name: row.member_name,
  village: row.village || "",
  member_type: row.member_type,
  shares: row.share_count || 0,
  outstanding: row.outstanding_amount || 0,
  created_at: row.joined_at || "",
  is_active: row.is_active ?? true,
});

export const membersService = {
  async getMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select(
        "member_id, member_code, member_name, mobile, village, member_type, share_count, credit_limit, outstanding_amount, joined_at, is_active",
      )
      .eq("is_active", true)
      .order("member_code", { ascending: true });

    if (error) throw error;
    return ((data || []) as MemberRow[]).map(mapMember);
  },

  async getMemberById(id: string): Promise<Member> {
    const { data, error } = await supabase
      .from("members")
      .select(
        "member_id, member_code, member_name, mobile, village, member_type, share_count, credit_limit, outstanding_amount, joined_at, is_active",
      )
      .eq("member_id", id)
      .single();

    if (error) throw error;
    return mapMember(data as MemberRow);
  },

  async searchMembers(query: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select(
        "member_id, member_code, member_name, mobile, village, member_type, share_count, credit_limit, outstanding_amount, joined_at, is_active",
      )
      .eq("is_active", true)
      .or(`member_name.ilike.%${query}%,member_code.ilike.%${query}%`);

    if (error) throw error;
    return ((data || []) as MemberRow[]).map(mapMember);
  },

  async createMember(
    memberData: Partial<Member> & {
      mobile?: string | null;
      credit_limit?: number | null;
      member_code?: string;
      name?: string;
      village?: string;
      member_type?: string;
      shares?: number;
      outstanding?: number;
    },
  ): Promise<Member> {
    const { data, error } = await supabase
      .from("members")
      .insert([
        {
          member_code: memberData.member_code,
          member_name: memberData.name,
          mobile: memberData.mobile || null,
          village: memberData.village,
          member_type: memberData.member_type,
          share_count: memberData.shares,
          credit_limit: memberData.credit_limit,
          outstanding_amount: memberData.outstanding,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    clearReferenceDataCache();
    return mapMember(data as MemberRow);
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from("members")
      .update({
        member_code: updates.member_code,
        member_name: updates.name,
        village: updates.village,
        member_type: updates.member_type,
        share_count: updates.shares,
        outstanding_amount: updates.outstanding,
      })
      .eq("member_id", id)
      .select(
        "member_id, member_code, member_name, mobile, village, member_type, share_count, credit_limit, outstanding_amount, joined_at",
      )
      .single();

    if (error) throw error;
    clearReferenceDataCache();
    return mapMember(data as MemberRow);
  },

  async deleteMember(id: string): Promise<void> {
    const { error } = await supabase
      .from("members")
      .update({ is_active: false })
      .eq("member_id", id);

    if (error) throw error;
    clearReferenceDataCache();
  },

  async deleteMembers(ids: string[]): Promise<void> {
    if (!ids.length) {
      return;
    }

    const { error } = await supabase
      .from("members")
      .update({ is_active: false })
      .in("member_id", ids);

    if (error) throw error;
    clearReferenceDataCache();
  },

  async getMemberOutstanding(memberId: string): Promise<number> {
    const { data, error } = await supabase.rpc("get_member_outstanding", {
      p_member_id: memberId,
    });

    if (error) throw error;
    return data || 0;
  },
};

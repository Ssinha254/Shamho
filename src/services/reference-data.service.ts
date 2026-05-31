import { supabase } from "../lib/supabase";

type MemberLookupRow = {
  member_id: string;
  member_name: string;
};

type TechnicianLookupRow = {
  technician_id: string;
  technician_name: string;
};

let memberLookupPromise: Promise<MemberLookupRow[]> | null = null;
let technicianLookupPromise: Promise<TechnicianLookupRow[]> | null = null;

const loadMembers = async () => {
  const { data, error } = await supabase
    .from("members")
    .select("member_id, member_name");

  if (error) throw error;
  return (data || []) as MemberLookupRow[];
};

const loadTechnicians = async () => {
  const { data, error } = await supabase
    .from("technician")
    .select("technician_id, technician_name");

  if (error) throw error;
  return (data || []) as TechnicianLookupRow[];
};

export const getMemberLookups = async () => {
  if (!memberLookupPromise) {
    memberLookupPromise = loadMembers();
  }

  return memberLookupPromise;
};

export const getTechnicianLookups = async () => {
  if (!technicianLookupPromise) {
    technicianLookupPromise = loadTechnicians();
  }

  return technicianLookupPromise;
};

export const clearReferenceDataCache = () => {
  memberLookupPromise = null;
  technicianLookupPromise = null;
};

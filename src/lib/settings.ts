import { supabase } from "./supabase";

export interface Settings {
  companyName:      string;
  ownerName:        string;
  baseAddress:      string;
  defaultCutPrice:  number;
  defaultPlanWeeks: number;
}

const DEFAULT: Settings = {
  companyName:      "Douglas Landscaping Co.",
  ownerName:        "Brian",
  baseAddress:      "Paris, Ontario",
  defaultCutPrice:  65,
  defaultPlanWeeks: 23,
};

function fromRow(row: Record<string, unknown> | null): Settings {
  if (!row) return DEFAULT;
  return {
    companyName:      (row.company_name as string)      ?? DEFAULT.companyName,
    ownerName:        (row.owner_name as string)        ?? DEFAULT.ownerName,
    baseAddress:      (row.base_address as string)      ?? DEFAULT.baseAddress,
    defaultCutPrice:  Number(row.default_cut_price ?? DEFAULT.defaultCutPrice),
    defaultPlanWeeks: Number(row.default_plan_weeks ?? DEFAULT.defaultPlanWeeks),
  };
}

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return fromRow(data);
}

export async function updateSettings(s: Partial<Settings>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (s.companyName !== undefined)      updates.company_name       = s.companyName;
  if (s.ownerName !== undefined)        updates.owner_name         = s.ownerName;
  if (s.baseAddress !== undefined)      updates.base_address       = s.baseAddress;
  if (s.defaultCutPrice !== undefined)  updates.default_cut_price  = s.defaultCutPrice;
  if (s.defaultPlanWeeks !== undefined) updates.default_plan_weeks = s.defaultPlanWeeks;

  const { error } = await supabase.from("settings").update(updates).eq("id", 1);
  if (error) throw error;
}

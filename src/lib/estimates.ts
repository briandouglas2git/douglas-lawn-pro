import { supabase } from "./supabase";

export interface LineItem {
  description: string;
  qty:         number;
  price:       number;
}

export interface Estimate {
  id:           string;
  customerId:   string;
  customerName: string;
  description:  string;
  items:        LineItem[];
  notes:        string;
  expiryDate:   string;
  status:       "draft" | "sent" | "accepted" | "booked" | "declined";
  isPlan:       boolean;
  total:        number;
  createdAt:    string;
}

function fromRow(row: Record<string, unknown>): Estimate {
  const items = (row.items as LineItem[]) ?? [];
  return {
    id:           row.id as string,
    customerId:   (row.customer_id as string) ?? "",
    customerName: row.customer_name as string,
    description:  (row.description as string) ?? "",
    items,
    notes:        (row.notes as string) ?? "",
    expiryDate:   (row.expiry_date as string) ?? "",
    status:       (row.status as Estimate["status"]) ?? "draft",
    isPlan:       (row.is_plan as boolean) ?? false,
    total:        Number(row.total ?? 0),
    createdAt:    row.created_at as string,
  };
}

function toRow(e: Omit<Estimate, "id" | "createdAt">) {
  return {
    customer_id:   e.customerId,
    customer_name: e.customerName,
    description:   e.description,
    items:         e.items,
    notes:         e.notes,
    expiry_date:   e.expiryDate || null,
    status:        e.status,
    is_plan:       e.isPlan,
    total:         e.total,
  };
}

export async function getEstimates(): Promise<Estimate[]> {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getEstimate(id: string): Promise<Estimate | null> {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return fromRow(data);
}

export async function saveEstimate(e: Omit<Estimate, "id" | "createdAt">): Promise<Estimate> {
  const { data, error } = await supabase
    .from("estimates")
    .insert([toRow(e)])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateEstimateStatus(id: string, status: Estimate["status"]): Promise<void> {
  const { error } = await supabase.from("estimates").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteEstimate(id: string): Promise<void> {
  const { error } = await supabase.from("estimates").delete().eq("id", id);
  if (error) throw error;
}

export function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

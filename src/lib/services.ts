import { supabase } from "./supabase";

export interface Service {
  id:           string;
  name:         string;
  defaultPrice: number;
  defaultQty:   number;
  createdAt:    string;
}

function fromRow(row: Record<string, unknown>): Service {
  return {
    id:           row.id as string,
    name:         row.name as string,
    defaultPrice: Number(row.default_price ?? 0),
    defaultQty:   Number(row.default_qty ?? 1),
    createdAt:    row.created_at as string,
  };
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function saveService(s: Omit<Service, "id" | "createdAt">): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .upsert([{
      name:          s.name,
      default_price: s.defaultPrice,
      default_qty:   s.defaultQty,
    }], { onConflict: "name" })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateService(id: string, s: Partial<Omit<Service, "id" | "createdAt">>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (s.name !== undefined)         updates.name          = s.name;
  if (s.defaultPrice !== undefined) updates.default_price = s.defaultPrice;
  if (s.defaultQty !== undefined)   updates.default_qty   = s.defaultQty;
  const { error } = await supabase.from("services").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

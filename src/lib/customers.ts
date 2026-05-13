import { supabase } from "./supabase";

export type MowingFrequency = "none" | "weekly" | "biweekly";
export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface Customer {
  id:              string;
  name:            string;
  phone:           string;
  email:           string;
  address:         string;
  notes:           string;
  createdAt:       string;
  mowingFrequency: MowingFrequency;
  mowingPrice:     number | null;
  mowingDay:       WeekDay | null;
}

function fromRow(row: Record<string, unknown>): Customer {
  return {
    id:              row.id as string,
    name:            row.name as string,
    phone:           (row.phone as string) ?? "",
    email:           (row.email as string) ?? "",
    address:         (row.address as string) ?? "",
    notes:           (row.notes as string) ?? "",
    createdAt:       row.created_at as string,
    mowingFrequency: ((row.mowing_frequency as MowingFrequency) ?? "none"),
    mowingPrice:     row.mowing_price != null ? Number(row.mowing_price) : null,
    mowingDay:       (row.mowing_day as WeekDay) ?? null,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return fromRow(data);
}

function customerToRow(c: Partial<Customer>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (c.name             !== undefined) row.name              = c.name;
  if (c.phone            !== undefined) row.phone             = c.phone;
  if (c.email            !== undefined) row.email             = c.email;
  if (c.address          !== undefined) row.address           = c.address;
  if (c.notes            !== undefined) row.notes             = c.notes;
  if (c.mowingFrequency  !== undefined) row.mowing_frequency  = c.mowingFrequency;
  if (c.mowingPrice      !== undefined) row.mowing_price      = c.mowingPrice;
  if (c.mowingDay        !== undefined) row.mowing_day        = c.mowingDay;
  return row;
}

export async function saveCustomer(c: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert([customerToRow(c)])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateCustomer(id: string, c: Partial<Omit<Customer, "id" | "createdAt">>): Promise<void> {
  const { error } = await supabase.from("customers").update(customerToRow(c)).eq("id", id);
  if (error) throw error;
}

export async function getMowingCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .neq("mowing_frequency", "none")
    .not("mowing_frequency", "is", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

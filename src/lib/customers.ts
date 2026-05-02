import { supabase } from "./supabase";

export interface Customer {
  id:        string;
  name:      string;
  phone:     string;
  email:     string;
  address:   string;
  notes:     string;
  createdAt: string;
}

function fromRow(row: Record<string, unknown>): Customer {
  return {
    id:        row.id as string,
    name:      row.name as string,
    phone:     (row.phone as string) ?? "",
    email:     (row.email as string) ?? "",
    address:   (row.address as string) ?? "",
    notes:     (row.notes as string) ?? "",
    createdAt: row.created_at as string,
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

export async function saveCustomer(c: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert([{
      name:    c.name,
      phone:   c.phone,
      email:   c.email,
      address: c.address,
      notes:   c.notes,
    }])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateCustomer(id: string, c: Partial<Omit<Customer, "id" | "createdAt">>): Promise<void> {
  const { error } = await supabase.from("customers").update(c).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

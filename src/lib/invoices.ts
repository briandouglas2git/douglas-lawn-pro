import { supabase } from "./supabase";
import type { LineItem } from "./estimates";

export interface Invoice {
  id:           string;
  jobId:        string;
  customerId:   string;
  customerName: string;
  lineItems:    LineItem[];
  total:        number;
  status:       "draft" | "sent" | "paid";
  sentAt:       string | null;
  paidAt:       string | null;
  createdAt:    string;
}

function fromRow(row: Record<string, unknown>): Invoice {
  return {
    id:           row.id as string,
    jobId:        (row.job_id as string) ?? "",
    customerId:   (row.customer_id as string) ?? "",
    customerName: (row.customer_name as string) ?? "",
    lineItems:    (row.line_items as LineItem[]) ?? [],
    total:        Number(row.total ?? 0),
    status:       (row.status as Invoice["status"]) ?? "draft",
    sentAt:       (row.sent_at as string) ?? null,
    paidAt:       (row.paid_at as string) ?? null,
    createdAt:    row.created_at as string,
  };
}

function toRow(i: Omit<Invoice, "id" | "createdAt">) {
  return {
    job_id:        i.jobId || null,
    customer_id:   i.customerId,
    customer_name: i.customerName,
    line_items:    i.lineItems,
    total:         i.total,
    status:        i.status,
    sent_at:       i.sentAt,
    paid_at:       i.paidAt,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return fromRow(data);
}

export async function getInvoicesForCustomer(customerId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function saveInvoice(i: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .insert([toRow(i)])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function markInvoiceSent(id: string): Promise<void> {
  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markInvoicePaid(id: string): Promise<void> {
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

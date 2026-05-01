import { supabase } from "./supabase";

export interface Job {
  id:            string;
  customerName:  string;
  customerId:    string;
  customerPhone: string;
  address:       string;
  service:       string;
  date:          string;
  time:          string;
  notes:         string;
  status:        "scheduled" | "en_route" | "arrived" | "completed";
  isPlan:        boolean;
  planCutNumber?: number;
  planTotalCuts?: number;
  pricePerCut?:  number;
}

function toRow(job: Omit<Job, "id">) {
  return {
    customer_name:  job.customerName,
    customer_id:    job.customerId,
    customer_phone: job.customerPhone,
    address:        job.address,
    service:        job.service,
    date:           job.date,
    time:           job.time,
    notes:          job.notes,
    status:         job.status,
    is_plan:        job.isPlan,
    plan_cut_number: job.planCutNumber ?? null,
    plan_total_cuts: job.planTotalCuts ?? null,
    price_per_cut:   job.pricePerCut ?? null,
  };
}

function fromRow(row: Record<string, unknown>): Job {
  return {
    id:            row.id as string,
    customerName:  row.customer_name as string,
    customerId:    row.customer_id as string ?? "",
    customerPhone: row.customer_phone as string ?? "",
    address:       row.address as string ?? "",
    service:       row.service as string,
    date:          row.date as string,
    time:          row.time as string ?? "",
    notes:         row.notes as string ?? "",
    status:        row.status as Job["status"],
    isPlan:        row.is_plan as boolean ?? false,
    planCutNumber: row.plan_cut_number as number ?? undefined,
    planTotalCuts: row.plan_total_cuts as number ?? undefined,
    pricePerCut:   row.price_per_cut as number ?? undefined,
  };
}

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return fromRow(data);
}

export async function saveJob(job: Omit<Job, "id">): Promise<Job> {
  const { data, error } = await supabase
    .from("jobs")
    .insert([toRow(job)])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function saveJobs(jobs: Omit<Job, "id">[]): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .insert(jobs.map(toRow));
  if (error) throw error;
}

export async function updateJobStatus(id: string, status: Job["status"]): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

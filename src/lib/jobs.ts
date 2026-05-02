import { supabase } from "./supabase";

export interface Job {
  id:             string;
  customerName:   string;
  customerId:     string;
  customerPhone:  string;
  address:        string;
  service:        string;
  date:           string;
  time:           string;
  notes:          string;
  status:         "scheduled" | "en_route" | "arrived" | "completed";
  isPlan:         boolean;
  planCutNumber?: number;
  planTotalCuts?: number;
  pricePerCut?:   number;
  dispatchedAt?:   string | null;
  arrivedAt?:      string | null;
  completedAt?:    string | null;
  invoiceId?:      string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?:  string | null;
}

function toRow(job: Omit<Job, "id">) {
  return {
    customer_name:   job.customerName,
    customer_id:     job.customerId,
    customer_phone:  job.customerPhone,
    address:         job.address,
    service:         job.service,
    date:            job.date,
    time:            job.time,
    notes:           job.notes,
    status:          job.status,
    is_plan:         job.isPlan,
    plan_cut_number: job.planCutNumber ?? null,
    plan_total_cuts: job.planTotalCuts ?? null,
    price_per_cut:   job.pricePerCut ?? null,
    dispatched_at:    job.dispatchedAt ?? null,
    arrived_at:       job.arrivedAt ?? null,
    completed_at:     job.completedAt ?? null,
    invoice_id:       job.invoiceId ?? null,
    before_photo_url: job.beforePhotoUrl ?? null,
    after_photo_url:  job.afterPhotoUrl ?? null,
  };
}

function fromRow(row: Record<string, unknown>): Job {
  return {
    id:             row.id as string,
    customerName:   row.customer_name as string,
    customerId:     (row.customer_id as string) ?? "",
    customerPhone:  (row.customer_phone as string) ?? "",
    address:        (row.address as string) ?? "",
    service:        row.service as string,
    date:           row.date as string,
    time:           (row.time as string) ?? "",
    notes:          (row.notes as string) ?? "",
    status:         row.status as Job["status"],
    isPlan:         (row.is_plan as boolean) ?? false,
    planCutNumber:  (row.plan_cut_number as number) ?? undefined,
    planTotalCuts:  (row.plan_total_cuts as number) ?? undefined,
    pricePerCut:    (row.price_per_cut as number) ?? undefined,
    dispatchedAt:    (row.dispatched_at as string) ?? null,
    arrivedAt:       (row.arrived_at as string) ?? null,
    completedAt:     (row.completed_at as string) ?? null,
    invoiceId:       (row.invoice_id as string) ?? null,
    beforePhotoUrl:  (row.before_photo_url as string) ?? null,
    afterPhotoUrl:   (row.after_photo_url as string) ?? null,
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

export async function getJobsForCustomer(customerId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", customerId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
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
  const batchSize = 5;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const { error } = await supabase.from("jobs").insert(batch.map(toRow));
    if (error) throw error;
  }
}

export async function updateJobStatus(id: string, status: Job["status"]): Promise<void> {
  const updates: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status === "en_route")  updates.dispatched_at = now;
  if (status === "arrived")   updates.arrived_at    = now;
  if (status === "completed") updates.completed_at  = now;

  const { error } = await supabase.from("jobs").update(updates).eq("id", id);
  if (error) throw error;
}

export async function setJobInvoice(id: string, invoiceId: string): Promise<void> {
  const { error } = await supabase.from("jobs").update({ invoice_id: invoiceId }).eq("id", id);
  if (error) throw error;
}

export async function uploadJobPhoto(jobId: string, kind: "before" | "after", file: File): Promise<string> {
  const path = `${jobId}/${kind}-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;
  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
  const url = data.publicUrl;

  const column = kind === "before" ? "before_photo_url" : "after_photo_url";
  const { error: updateError } = await supabase.from("jobs").update({ [column]: url }).eq("id", jobId);
  if (updateError) throw updateError;

  return url;
}

export async function clearJobPhoto(jobId: string, kind: "before" | "after"): Promise<void> {
  const column = kind === "before" ? "before_photo_url" : "after_photo_url";
  const { error } = await supabase.from("jobs").update({ [column]: null }).eq("id", jobId);
  if (error) throw error;
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

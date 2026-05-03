import { supabase } from "./supabase";

export type TriggerType = "manual" | "on_dispatch" | "on_arrive" | "on_complete";

export interface MessageTemplate {
  key:     string;
  label:   string;
  body:    string;
  trigger: TriggerType;
  enabled: boolean;
}

function fromRow(row: Record<string, unknown>): MessageTemplate {
  return {
    key:     row.key as string,
    label:   row.label as string,
    body:    row.body as string,
    trigger: (row.trigger as TriggerType) ?? "manual",
    enabled: (row.enabled as boolean) ?? true,
  };
}

export async function getTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase.from("message_templates").select("*").order("label");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getTemplate(key: string): Promise<MessageTemplate | null> {
  const { data, error } = await supabase.from("message_templates").select("*").eq("key", key).single();
  if (error) return null;
  return fromRow(data);
}

export async function updateTemplate(key: string, updates: Partial<MessageTemplate>): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.body    !== undefined) row.body    = updates.body;
  if (updates.label   !== undefined) row.label   = updates.label;
  if (updates.trigger !== undefined) row.trigger = updates.trigger;
  if (updates.enabled !== undefined) row.enabled = updates.enabled;

  const { error } = await supabase.from("message_templates").update(row).eq("key", key);
  if (error) throw error;
}

export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    body
  );
}

export const PLACEHOLDERS = ["name", "company", "service", "amount", "date", "time"] as const;

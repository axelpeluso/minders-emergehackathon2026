import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pyzdaqkuktwjyvwnkghp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5emRhcWt1a3R3anl2d25rZ2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA0ODYsImV4cCI6MjA5MjA3NjQ4Nn0.RqBwJkNpQTl1oSFRRRtI7sbskhXFSbXvIhMj28qRbKU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export type Conversation = {
  id: string;
  customer_id: string;
  status: "active" | "idle" | "handoff" | string;
  handoff_summary: string | null;
  handoff_suggested_reply: string | null;
  entry_page: string | null;
  started_at: string | null;
  last_message_at: string | null;
  closed_at: string | null;
};

export type Customer = {
  id: string;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
  nail_shape: string | null;
  color_family: string | null;
  finish: string | null;
  experience_level: string | null;
  occasion: string | null;
  urgency_days: number | null;
  budget_range: string | null;
  intent: string | null;
  hema_concerns: boolean | null;
  past_reactions: string | null;
  sensitive_skin: boolean | null;
  lead_score: number | null;
  lead_factors: unknown | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Agent = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
};

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes("placeholder") &&
  supabaseUrl.startsWith("https://");

// Only create a real client when valid credentials are present.
// The realtime hook already has a demo/mock fallback when this is null.
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : (null as unknown as SupabaseClient);
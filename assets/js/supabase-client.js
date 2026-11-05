import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

if (
  SUPABASE_URL.includes("YOUR_SUPABASE") ||
  SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
) {
  throw new Error("Supabase is not configured. Follow AUTH_SETUP.md.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

import type { User } from "@supabase/supabase-js";

export function isAnonymousUser(user: User | null | undefined) {
  return !!(user?.is_anonymous === true || user?.app_metadata?.provider === "anonymous");
}

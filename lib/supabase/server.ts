// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerClientComponent = () => {
  // We use the 'async' pattern inside the getter to handle the Promise properly
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies(); // Explicitly await the cookies
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The set method may fail if called from a Server Component 
            // instead of an Action, which is normal.
          }
        },
        async remove(name: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The remove method may fail if called from a Server Component
          }
        },
      },
    }
  )
}
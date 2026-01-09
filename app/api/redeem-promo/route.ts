// app/api/redeem-promo/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // In Next.js 15/16, cookies() is an async function
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored if the client is refreshing the session
          }
        },
      },
    }
  );

  try {
    const { promoCode } = await request.json();

    // 1. Identify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Lookup the promo code
    const { data: codeData, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (codeError || !codeData) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // 3. Update the profile (Atomic increment is better, but this matches your logic)
    const { data: profile } = await supabase
      .from('profiles')
      .select('store_credits')
      .eq('id', user.id)
      .single();

    const newCredits = (profile?.store_credits || 0) + codeData.credit_value;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ store_credits: newCredits })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, added: codeData.credit_value });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
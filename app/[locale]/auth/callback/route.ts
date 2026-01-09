import { NextResponse } from 'next/server'
import { createServerClientComponent } from '@/lib/supabase/server'

// This route handler is crucial for PKCE flow (used by Supabase Auth).
// It exchanges the temporary code from the URL for a secure user session.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const localeMatch = requestUrl.pathname.match(/^\/(en|zh)(?=\/|$)/)
  const locale = localeMatch?.[1] ?? 'en'

  const nextParam = requestUrl.searchParams.get('next') || '/'
  const normalizedNext = nextParam.startsWith(`/${locale}`)
    ? nextParam
    : nextParam.startsWith('/')
    ? `/${locale}${nextParam}`
    : `/${locale}/${nextParam}`

  const redirectTo = `${requestUrl.origin}${normalizedNext}`
  
  if (code) {
    // We use the Server Client Helper here because it has access to cookies
    const supabase = await createServerClientComponent()
    
    // The actual secure code exchange happens here
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the desired page after successful login
      return NextResponse.redirect(redirectTo)
    }
  }

  // If there is no code or an error occurred, redirect to an error page or login
  return NextResponse.redirect(`${requestUrl.origin}/${locale}/login?error=auth_failed`)
}

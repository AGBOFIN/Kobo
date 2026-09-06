import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/register') ||
                     pathname.startsWith('/forgot-password') ||
                     pathname.startsWith('/reset-password')

  const isDashboardPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/invoices')

  const isAdminPage = pathname.startsWith('/admin')

  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL('/dashboard/dashboard', request.url))
  }

  if (isDashboardPage && !session?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAdminPage) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

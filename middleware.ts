import { NextRequest, NextResponse } from 'next/server'

const AUTH_REQUIRED = ['/sell', '/shop', '/mypage', '/reader', '/edit', '/apply', '/checkout']
const SELLER_REQUIRED = ['/sell', '/shop', '/edit']
const ADMIN_REQUIRED = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value

  const requiresAuth = AUTH_REQUIRED.some((path) => pathname.startsWith(path))
  const requiresSeller = SELLER_REQUIRED.some((path) => pathname.startsWith(path))
  const requiresAdmin = ADMIN_REQUIRED.some((path) => pathname.startsWith(path))

  if (requiresAdmin) {
    if (pathname === '/admin/login') return NextResponse.next()
    if (!token || role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  if (requiresAuth && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (requiresSeller && role !== 'seller' && role !== 'admin') {
    return NextResponse.redirect(new URL('/mypage', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sell', '/sell/:path*', '/shop', '/shop/:path*', '/mypage', '/mypage/:path*', '/reader/:path+', '/edit/:path+', '/apply', '/apply/:path*', '/checkout', '/checkout/:path*', '/admin', '/admin/:path*'],
}

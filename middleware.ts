import { NextRequest, NextResponse } from 'next/server'

const AUTH_REQUIRED = ['/sell', '/shop', '/mypage', '/reader', '/edit', '/apply']
const SELLER_REQUIRED = ['/sell', '/shop', '/edit']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value

  const requiresAuth = AUTH_REQUIRED.some((path) => pathname.startsWith(path))
  const requiresSeller = SELLER_REQUIRED.some((path) => pathname.startsWith(path))

  if (requiresAuth && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (requiresSeller && role !== 'seller') {
    return NextResponse.redirect(new URL('/mypage', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sell', '/sell/:path*', '/shop', '/shop/:path*', '/mypage', '/mypage/:path*', '/reader/:path+', '/edit/:path+', '/apply', '/apply/:path*'],
}

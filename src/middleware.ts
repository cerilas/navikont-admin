import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

const publicRoutes = ['/login', '/reset-password'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const sessionCookie = req.cookies.get('session')?.value;
  let session = null;

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie);
    } catch (e) {
      // Invalid token
    }
  }

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && session && path !== '/reset-password') {
    if (session.user_type === 'doctor') {
      return NextResponse.redirect(new URL('/dr', req.nextUrl));
    } else {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  // Doctor route protection
  if (path.startsWith('/dr')) {
    if (session && session.user_type !== 'doctor') {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  } else if (!isPublicRoute) {
    // Admin route protection (everything else except public routes)
    if (session && session.user_type === 'doctor') {
      return NextResponse.redirect(new URL('/dr', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)'],
};

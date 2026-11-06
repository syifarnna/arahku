import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  if (host === 'tryoutku-sigma.vercel.app') {
    const url = request.nextUrl.clone();
    url.host = 'arahku-sigma.vercel.app';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};

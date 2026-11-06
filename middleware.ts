export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.hostname === 'tryoutku-sigma.vercel.app') {
    url.hostname = 'arahku-sigma.vercel.app';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
}

export const config = {
  runtime: 'nodejs',
  matcher: '/:path*',
};

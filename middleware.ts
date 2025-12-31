export const config = {
  runtime: 'edge',
};

export default async function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  const isBot = /googlebot|bingbot|duckduckbot|yandex|baiduspider/i.test(ua);

  if (!isBot) {
    return fetch(request);
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith('/gallery/')) {
    const seoResponse = await fetch(
      `https://xoompskrczzucsohfcyy.supabase.co/functions/v1/seo-page?path=${encodeURIComponent(url.pathname)}`
    );

    if (seoResponse.ok) {
      return seoResponse;
    }
  }

  return fetch(request);
}

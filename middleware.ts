export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';

  const isBot = /googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp/i.test(
    userAgent
  );

  if (!isBot) {
    // Let normal users get React SPA
    return fetch(request);
  }

  const url = new URL(request.url);

  // Rewrite gallery URLs to SEO HTML
  if (url.pathname.startsWith('/gallery/')) {
    const seoPath = url.pathname.replace('/gallery/', '/seo/');
    const seoUrl = `https://gaal.app${seoPath}`;

    const seoResponse = await fetch(seoUrl);

    if (seoResponse.ok) {
      return seoResponse;
    }
  }

  return fetch(request);
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';

  const isBot =
    /googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp/i.test(userAgent);

  if (!isBot) {
    return fetch(request);
  }

  const url = new URL(request.url);

  // Example: /contest/wildlife/simple-morning-photography-contest/morning-sunrise-photo
  if (url.pathname.startsWith('/contest/')) {
    const seoFilePath = `${url.pathname}.html`;

    const seoStorageUrl =
      `https://xoompskrczzucsohfcyy.supabase.co/storage/v1/object/public/` +
      `public-pages/seo-pages${seoFilePath}`;

    const seoResponse = await fetch(seoStorageUrl, {
      headers: {
        'content-type': 'text/html',
      },
    });

    if (seoResponse.ok) {
      return new Response(await seoResponse.text(), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'x-seo-prerender': 'true',
        },
      });
    }
  }

  return fetch(request);
}

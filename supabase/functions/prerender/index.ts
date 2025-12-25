import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BASE_URL = 'https://gaal.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    
    console.log('Prerender request for path:', path);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Photo detail page: /photo/{contestSlug}/{photoSlug}
    const photoMatch = path.match(/^\/photo\/([^/]+)\/([^/]+)$/);
    if (photoMatch) {
      const [, contestSlug, photoSlug] = photoMatch;
      
      // Get contest with SEO fields
      const { data: contest } = await supabase
        .from('contests')
        .select('id, title, slug, theme, description, seo_title, meta_description, keywords')
        .eq('slug', contestSlug)
        .maybeSingle();

      if (!contest) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Get submission
      const { data: submission } = await supabase
        .from('submissions')
        .select('id, title, description, image_url, slug, status, created_at, user_id, view_count, like_count')
        .eq('contest_id', contest.id)
        .eq('slug', photoSlug)
        .maybeSingle();

      if (!submission) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Get photographer name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', submission.user_id)
        .maybeSingle();

      const photographerName = profile?.full_name || 'Anonymous';
      const isApproved = submission.status === 'approved' || submission.status === 'winner';
      
      // Auto-generate SEO metadata using contest SEO fields + user content
      const generatedSeoTitle = `${submission.title} - ${contest.seo_title || contest.title} | GAAL`;
      const generatedMetaDesc = submission.description 
        ? `${submission.description.slice(0, 100)}... Photo from ${contest.title} contest on GAAL.`
        : `${submission.title} - Photography submission for ${contest.seo_title || contest.title}. ${contest.meta_description || ''}`.slice(0, 160);
      
      const html = generatePhotoHTML({
        title: submission.title,
        description: generatedMetaDesc,
        seoTitle: generatedSeoTitle,
        imageUrl: submission.image_url,
        contestTitle: contest.seo_title || contest.title,
        contestSlug: contest.slug,
        photoSlug: submission.slug,
        photographerName,
        createdAt: submission.created_at,
        viewCount: submission.view_count,
        likeCount: submission.like_count,
        noIndex: !isApproved,
        keywords: contest.keywords || [],
        contestTheme: contest.theme,
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Gallery page: /gallery
    if (path === '/gallery') {
      const html = generateGalleryHTML();
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Contest detail page: /contest/{contestSlug}
    const contestMatch = path.match(/^\/contest\/([^/]+)$/);
    if (contestMatch) {
      const [, contestSlug] = contestMatch;
      
      const { data: contest } = await supabase
        .from('contests')
        .select('id, title, description, theme, prize_amount, prize_currency, start_date, end_date, cover_image_url, status, seo_title, meta_description, keywords')
        .eq('slug', contestSlug)
        .maybeSingle();

      if (!contest) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      const html = generateContestHTML({
        title: contest.seo_title || contest.title,
        description: contest.meta_description || contest.description || `Photography contest on GAAL`,
        theme: contest.theme,
        prizeAmount: contest.prize_amount,
        prizeCurrency: contest.prize_currency,
        startDate: contest.start_date,
        endDate: contest.end_date,
        coverImage: contest.cover_image_url,
        slug: contestSlug,
        keywords: contest.keywords || [],
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Default: return minimal HTML
    return new Response(generateDefaultHTML(), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });

  } catch (error: unknown) {
    console.error('Prerender error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generatePhotoHTML(data: {
  title: string;
  description: string;
  seoTitle: string;
  imageUrl: string;
  contestTitle: string;
  contestSlug: string;
  photoSlug: string;
  photographerName: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  noIndex: boolean;
  keywords: string[];
  contestTheme: string | null;
}) {
  const canonicalUrl = `${BASE_URL}/photo/${data.contestSlug}/${data.photoSlug}`;
  const keywordsMeta = data.keywords.length > 0 
    ? `<meta name="keywords" content="${escapeHtml(data.keywords.join(', '))}">` 
    : '';
  const robotsTag = data.noIndex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  ${keywordsMeta}
  ${robotsTag}
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(data.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:image" content="${data.imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="GAAL">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  <meta name="twitter:description" content="${escapeHtml(data.description)}">
  <meta name="twitter:image" content="${data.imageUrl}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": "${escapeJson(data.title)}",
    "description": "${escapeJson(data.description)}",
    "contentUrl": "${data.imageUrl}",
    "uploadDate": "${data.createdAt}",
    "author": {
      "@type": "Person",
      "name": "${escapeJson(data.photographerName)}"
    },
    "isPartOf": {
      "@type": "CreativeWork",
      "name": "${escapeJson(data.contestTitle)}",
      "url": "${BASE_URL}/contest/${data.contestSlug}"
    }
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}">GAAL</a>
      <a href="${BASE_URL}/contests">Contests</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(data.title)}</h1>
      <p>By ${escapeHtml(data.photographerName)}</p>
      <img src="${data.imageUrl}" alt="${escapeHtml(data.title)}" width="1200" height="800">
      <p>${escapeHtml(data.description)}</p>
      <p>Part of <a href="${BASE_URL}/contest/${data.contestSlug}">${escapeHtml(data.contestTitle)}</a> contest</p>
      <p>Views: ${data.viewCount} | Likes: ${data.likeCount}</p>
    </article>
  </main>
  <footer>
    <p>&copy; GAAL Photography Contests</p>
  </footer>
</body>
</html>`;
}

function generateContestHTML(data: {
  title: string;
  description: string;
  theme: string | null;
  prizeAmount: number;
  prizeCurrency: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  slug: string;
  keywords: string[];
}) {
  const canonicalUrl = `${BASE_URL}/contest/${data.slug}`;
  const keywordsMeta = data.keywords.length > 0 
    ? `<meta name="keywords" content="${escapeHtml(data.keywords.join(', '))}">` 
    : '';
  const imageUrl = data.coverImage || `${BASE_URL}/og-default.jpg`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} - Photo Contest | GAAL</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  ${keywordsMeta}
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(data.title)} - Photo Contest">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="GAAL">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  <meta name="twitter:description" content="${escapeHtml(data.description)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${escapeJson(data.title)}",
    "description": "${escapeJson(data.description)}",
    "startDate": "${data.startDate}",
    "endDate": "${data.endDate}",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": "${canonicalUrl}"
    },
    "organizer": {
      "@type": "Organization",
      "name": "GAAL",
      "url": "${BASE_URL}"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}">GAAL</a>
      <a href="${BASE_URL}/contests">Contests</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(data.title)}</h1>
      ${data.theme ? `<h2>Theme: ${escapeHtml(data.theme)}</h2>` : ''}
      <p>${escapeHtml(data.description)}</p>
      <p>Prize: $${data.prizeAmount} ${data.prizeCurrency}</p>
      <p>Contest runs from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}</p>
    </article>
  </main>
  <footer>
    <p>&copy; GAAL Photography Contests</p>
  </footer>
</body>
</html>`;
}

function generateDefaultHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GAAL - Photography Contests</title>
  <meta name="description" content="GAAL is a photography contest platform where creators compete, showcase their work, and win prizes.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}">
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}">GAAL</a>
      <a href="${BASE_URL}/contests">Contests</a>
    </nav>
  </header>
  <main>
    <h1>GAAL Photography Contests</h1>
    <p>Compete, showcase your work, and win prizes.</p>
  </main>
  <footer>
    <p>&copy; GAAL Photography Contests</p>
  </footer>
</body>
</html>`;
}

function generateGalleryHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gallery - Photography Showcase | GAAL</title>
  <meta name="description" content="Explore authentic user-submitted photography from GAAL contests. Discover inspiring images from talented photographers worldwide.">
  <meta name="keywords" content="photography gallery, photo showcase, contest submissions, creative photography, photographer portfolio">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/gallery">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Gallery - Photography Showcase | GAAL">
  <meta property="og:description" content="Explore authentic user-submitted photography from GAAL contests. Discover inspiring images from talented photographers worldwide.">
  <meta property="og:url" content="${BASE_URL}/gallery">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Gallery - Photography Showcase | GAAL">
  <meta name="twitter:description" content="Explore authentic user-submitted photography from GAAL contests.">
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}">GAAL</a>
      <a href="${BASE_URL}/contests">Contests</a>
      <a href="${BASE_URL}/gallery">Gallery</a>
    </nav>
  </header>
  <main>
    <h1>Gallery - Photography Showcase</h1>
    <p>Discover authentic photography from talented creators around the world.</p>
  </main>
  <footer>
    <p>Images are provided for personal inspiration and viewing only. Not for commercial use.</p>
    <p>&copy; GAAL Photography Contests</p>
  </footer>
</body>
</html>`;
}

function generate404HTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | GAAL</title>
  <meta name="robots" content="noindex">
</head>
<body>
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="${BASE_URL}">Go to homepage</a>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJson(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
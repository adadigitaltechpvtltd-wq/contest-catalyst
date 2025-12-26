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

    // Gallery page: /gallery/{category}/{contestSlug}/{photoSlug}
    const galleryMatch = path.match(/^\/gallery\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (galleryMatch) {
      const [, category, contestSlug, photoSlug] = galleryMatch;
      
      const { data: contest } = await supabase
        .from('contests')
        .select('id, title, slug, category, theme, description, seo_title, meta_description, keywords')
        .eq('slug', contestSlug)
        .maybeSingle();

      if (!contest) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Validate category matches
      const contestCategory = contest.category || 'general';
      if (category !== contestCategory) {
        // Redirect to correct URL
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/gallery/${contestCategory}/${contestSlug}/${photoSlug}` },
        });
      }

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

      if (submission.status === 'disqualified') {
        return new Response(generate410HTML(contestCategory, contest.slug), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      if (submission.status === 'rejected') {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', submission.user_id)
        .maybeSingle();

      const photographerName = profile?.full_name || 'Anonymous';
      const isApproved = submission.status === 'approved' || submission.status === 'winner';
      
      const html = generateGalleryItemHTML({
        title: submission.title,
        description: submission.description || `${submission.title} - Photography submission for ${contest.title}.`,
        imageUrl: submission.image_url,
        contestTitle: contest.seo_title || contest.title,
        contestSlug: contest.slug,
        category: contestCategory,
        photoSlug: submission.slug,
        photographerName,
        createdAt: submission.created_at,
        viewCount: submission.view_count,
        likeCount: submission.like_count,
        noIndex: !isApproved,
        keywords: contest.keywords || [],
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Legacy photo URL redirect: /photo/{contestSlug}/{photoSlug}
    const legacyPhotoMatch = path.match(/^\/photo\/([^/]+)\/([^/]+)$/);
    if (legacyPhotoMatch) {
      const [, contestSlug, photoSlug] = legacyPhotoMatch;
      
      const { data: contest } = await supabase
        .from('contests')
        .select('category')
        .eq('slug', contestSlug)
        .maybeSingle();

      const category = contest?.category || 'general';
      return new Response('', {
        status: 301,
        headers: { ...corsHeaders, 'Location': `${BASE_URL}/gallery/${category}/${contestSlug}/${photoSlug}` },
      });
    }

    // Gallery page: /gallery
    if (path === '/gallery') {
      const html = generateGalleryHTML();
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Contest detail page: /contest/{category}/{contestSlug}
    const contestMatch = path.match(/^\/contest\/([^/]+)\/([^/]+)$/);
    if (contestMatch) {
      const [, category, contestSlug] = contestMatch;
      
      const { data: contest } = await supabase
        .from('contests')
        .select('id, title, description, theme, category, prize_amount, prize_currency, start_date, end_date, cover_image_url, status, seo_title, meta_description, keywords')
        .eq('slug', contestSlug)
        .maybeSingle();

      if (!contest) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Validate category matches
      const contestCategory = contest.category || 'general';
      if (category !== contestCategory) {
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/contest/${contestCategory}/${contestSlug}` },
        });
      }

      const html = generateContestHTML({
        title: contest.seo_title || contest.title,
        description: contest.meta_description || contest.description || `Photography contest on GAAL`,
        theme: contest.theme,
        category: contestCategory,
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

    // Legacy contest URL redirect: /contest/{contestSlug} (without category)
    const legacyContestMatch = path.match(/^\/contest\/([^/]+)$/);
    if (legacyContestMatch) {
      const [, contestSlug] = legacyContestMatch;
      
      const { data: contest } = await supabase
        .from('contests')
        .select('category')
        .eq('slug', contestSlug)
        .maybeSingle();

      if (contest) {
        const category = contest.category || 'general';
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/contest/${category}/${contestSlug}` },
        });
      }
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

function generateGalleryItemHTML(data: {
  title: string;
  description: string;
  imageUrl: string;
  contestTitle: string;
  contestSlug: string;
  category: string;
  photoSlug: string;
  photographerName: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  noIndex: boolean;
  keywords: string[];
}) {
  const canonicalUrl = `${BASE_URL}/gallery/${data.category}/${data.contestSlug}/${data.photoSlug}`;
  const contestUrl = `${BASE_URL}/contest/${data.category}/${data.contestSlug}`;
  const keywordsMeta = data.keywords.length > 0 
    ? `<meta name="keywords" content="${escapeHtml(data.keywords.join(', '))}">` 
    : '';
  const robotsTag = data.noIndex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} - ${escapeHtml(data.contestTitle)} | GAAL</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  ${keywordsMeta}
  ${robotsTag}
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(data.title)} - ${escapeHtml(data.contestTitle)}">
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
    "@id": "${canonicalUrl}",
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
      "url": "${contestUrl}"
    }
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="${BASE_URL}">GAAL</a>
      <a href="${BASE_URL}/gallery">Gallery</a>
      <a href="${BASE_URL}/contests">Contests</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(data.title)}</h1>
      <p>By ${escapeHtml(data.photographerName)}</p>
      <img src="${data.imageUrl}" alt="${escapeHtml(data.title)}" width="1200" height="800">
      <p>${escapeHtml(data.description)}</p>
      <p>Part of <a href="${contestUrl}">${escapeHtml(data.contestTitle)}</a> contest</p>
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
  category: string;
  prizeAmount: number;
  prizeCurrency: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  slug: string;
  keywords: string[];
}) {
  const canonicalUrl = `${BASE_URL}/contest/${data.category}/${data.slug}`;
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
    "@id": "${canonicalUrl}",
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
  <header><nav><a href="${BASE_URL}">GAAL</a></nav></header>
  <main><h1>GAAL Photography Contests</h1></main>
  <footer><p>&copy; GAAL</p></footer>
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
  <meta name="description" content="Explore authentic user-submitted photography from GAAL contests.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/gallery">
</head>
<body>
  <header><nav><a href="${BASE_URL}">GAAL</a><a href="${BASE_URL}/gallery">Gallery</a></nav></header>
  <main><h1>Gallery - Photography Showcase</h1></main>
  <footer><p>&copy; GAAL</p></footer>
</body>
</html>`;
}

function generate404HTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page Not Found | GAAL</title>
  <meta name="robots" content="noindex">
</head>
<body><h1>Page Not Found</h1><a href="${BASE_URL}">Go to homepage</a></body>
</html>`;
}

function generate410HTML(category?: string, contestSlug?: string) {
  const redirectUrl = category && contestSlug ? `${BASE_URL}/contest/${category}/${contestSlug}` : `${BASE_URL}/gallery`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Photo Removed | GAAL</title>
  <meta name="robots" content="noindex">
</head>
<body><h1>Photo Removed</h1><a href="${redirectUrl}">Browse other photos</a></body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJson(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

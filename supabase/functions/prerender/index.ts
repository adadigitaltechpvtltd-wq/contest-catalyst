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

    // Gallery page: /gallery/{category}/{campaignSlug}/{photoSlug}
    const galleryMatch = path.match(/^\/gallery\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (galleryMatch) {
      const [, category, campaignSlug, photoSlug] = galleryMatch;
      
      const { data: campaign } = await supabase
        .from('contests')
        .select('id, title, slug, category, theme, description, seo_title, meta_description, keywords')
        .eq('slug', campaignSlug)
        .maybeSingle();

      if (!campaign) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Validate category matches
      const campaignCategory = campaign.category || 'general';
      if (category !== campaignCategory) {
        // Redirect to correct URL
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/gallery/${campaignCategory}/${campaignSlug}/${photoSlug}` },
        });
      }

      const { data: submission } = await supabase
        .from('submissions')
        .select('id, title, description, image_url, slug, status, created_at, user_id, view_count, like_count, seo_page_generated, seo_approved')
        .eq('contest_id', campaign.id)
        .eq('slug', photoSlug)
        .maybeSingle();

      if (!submission) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      if (submission.status === 'disqualified') {
        return new Response(generate410HTML(campaignCategory, campaign.slug), {
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

      // If SEO page is generated in storage, fetch and serve it
      if (submission.seo_page_generated && submission.seo_approved) {
        const storagePath = `seo-pages/${campaignCategory}/${campaignSlug}/${photoSlug}.html`;
        console.log('Fetching pre-generated SEO page from storage:', storagePath);
        
        const { data: fileData, error: storageError } = await supabase.storage
          .from('public-pages')
          .download(storagePath);
        
        if (!storageError && fileData) {
          const html = await fileData.text();
          console.log('Serving pre-generated SEO page for:', photoSlug);
          return new Response(html, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } else {
          console.log('Storage fetch error or no data, falling back to generated HTML:', storageError?.message);
        }
      }

      // Fallback: Generate HTML dynamically
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', submission.user_id)
        .maybeSingle();

      const photographerName = profile?.full_name || 'Anonymous';
      const isApproved = submission.status === 'approved' || submission.status === 'winner';
      
      const html = generateGalleryItemHTML({
        title: submission.title,
        description: submission.description || `${submission.title} - Photography submission for ${campaign.title}.`,
        imageUrl: submission.image_url,
        contestTitle: campaign.seo_title || campaign.title,
        contestSlug: campaign.slug,
        category: campaignCategory,
        photoSlug: submission.slug,
        photographerName,
        createdAt: submission.created_at,
        viewCount: submission.view_count,
        likeCount: submission.like_count,
        noIndex: !isApproved,
        keywords: campaign.keywords || [],
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Legacy photo URL redirect: /photo/{campaignSlug}/{photoSlug}
    const legacyPhotoMatch = path.match(/^\/photo\/([^/]+)\/([^/]+)$/);
    if (legacyPhotoMatch) {
      const [, campaignSlug, photoSlug] = legacyPhotoMatch;
      
      const { data: campaign } = await supabase
        .from('contests')
        .select('category')
        .eq('slug', campaignSlug)
        .maybeSingle();

      const category = campaign?.category || 'general';
      return new Response('', {
        status: 301,
        headers: { ...corsHeaders, 'Location': `${BASE_URL}/gallery/${category}/${campaignSlug}/${photoSlug}` },
      });
    }

    // Gallery page: /gallery
    if (path === '/gallery') {
      const html = generateGalleryHTML();
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Campaign detail page: /campaign/{category}/{campaignSlug}
    const campaignMatch = path.match(/^\/campaign\/([^/]+)\/([^/]+)$/);
    if (campaignMatch) {
      const [, category, campaignSlug] = campaignMatch;
      
      const { data: campaign } = await supabase
        .from('contests')
        .select('id, title, description, theme, category, prize_amount, prize_currency, start_date, end_date, cover_image_url, status, seo_title, meta_description, keywords')
        .eq('slug', campaignSlug)
        .maybeSingle();

      if (!campaign) {
        return new Response(generate404HTML(), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Validate category matches
      const campaignCategory = campaign.category || 'general';
      if (category !== campaignCategory) {
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/campaign/${campaignCategory}/${campaignSlug}` },
        });
      }

      const html = generateContestHTML({
        title: campaign.seo_title || campaign.title,
        description: campaign.meta_description || campaign.description || `Photography campaign on GAAL`,
        theme: campaign.theme,
        category: campaignCategory,
        prizeAmount: campaign.prize_amount,
        prizeCurrency: campaign.prize_currency,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        coverImage: campaign.cover_image_url,
        slug: campaignSlug,
        keywords: campaign.keywords || [],
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Legacy campaign URL redirect: /contest/{campaignSlug} (without category)
    const legacyCampaignMatch = path.match(/^\/contest\/([^/]+)$/);
    if (legacyCampaignMatch) {
      const [, campaignSlug] = legacyCampaignMatch;
      
      const { data: campaign } = await supabase
        .from('contests')
        .select('category')
        .eq('slug', campaignSlug)
        .maybeSingle();

      if (campaign) {
        const category = campaign.category || 'general';
        return new Response('', {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/campaign/${category}/${campaignSlug}` },
        });
      }
    }

    // Legacy /contest/{category}/{slug} redirect to /campaign/
    const legacyCampaignWithCategoryMatch = path.match(/^\/contest\/([^/]+)\/([^/]+)$/);
    if (legacyCampaignWithCategoryMatch) {
      const [, category, campaignSlug] = legacyCampaignWithCategoryMatch;
      return new Response('', {
        status: 301,
        headers: { ...corsHeaders, 'Location': `${BASE_URL}/campaign/${category}/${campaignSlug}` },
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
  const contestUrl = `${BASE_URL}/campaign/${data.category}/${data.contestSlug}`;
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
      <a href="${BASE_URL}/campaigns">Campaigns</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(data.title)}</h1>
      <p>By ${escapeHtml(data.photographerName)}</p>
      <img src="${data.imageUrl}" alt="${escapeHtml(data.title)}" width="1200" height="800">
      <p>${escapeHtml(data.description)}</p>
      <p>Part of <a href="${contestUrl}">${escapeHtml(data.contestTitle)}</a> campaign</p>
      <p>Views: ${data.viewCount} | Likes: ${data.likeCount}</p>
    </article>
  </main>
  <footer>
    <p>&copy; GAAL Photography Campaigns</p>
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
  const canonicalUrl = `${BASE_URL}/campaign/${data.category}/${data.slug}`;
  const keywordsMeta = data.keywords.length > 0 
    ? `<meta name="keywords" content="${escapeHtml(data.keywords.join(', '))}">` 
    : '';
  const imageUrl = data.coverImage || `${BASE_URL}/og-default.jpg`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} - Photo Campaign | GAAL</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  ${keywordsMeta}
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(data.title)} - Photo Campaign">
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
      <a href="${BASE_URL}/campaigns">Campaigns</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(data.title)}</h1>
      ${data.theme ? `<h2>Theme: ${escapeHtml(data.theme)}</h2>` : ''}
      <p>${escapeHtml(data.description)}</p>
      <p>Prize: $${data.prizeAmount} ${data.prizeCurrency}</p>
      <p>Campaign runs from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}</p>
    </article>
  </main>
  <footer>
    <p>&copy; GAAL Photography Campaigns</p>
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
  <title>GAAL - Photography Campaigns</title>
  <meta name="description" content="GAAL is a photography campaign platform where creators compete, showcase their work, and win prizes.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}">
</head>
<body>
  <header><nav><a href="${BASE_URL}">GAAL</a></nav></header>
  <main><h1>GAAL Photography Campaigns</h1></main>
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
  <meta name="description" content="Explore authentic user-submitted photography from GAAL campaigns.">
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
  const redirectUrl = category && contestSlug ? `${BASE_URL}/campaign/${category}/${contestSlug}` : `${BASE_URL}/gallery`;
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

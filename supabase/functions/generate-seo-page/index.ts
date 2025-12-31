import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: 'submission_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch submission details with contest and profile
    // IMPORTANT: Disambiguate relationships (there are multiple FK paths between submissions↔contests)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        id,
        title,
        slug,
        description,
        image_url,
        seo_title,
        meta_description,
        contest:contests!submissions_contest_id_fkey(
          id,
          title,
          slug,
          category,
          description,
          status
        ),
        profile:profiles!submissions_user_id_profiles_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      console.error('Submission fetch error:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract contest data (Supabase returns nested relations as objects when using .single())
    const contest = submission.contest as unknown as { id: string; title: string; slug: string; category: string; description: string; status: string } | null;
    const profile = submission.profile as unknown as { id: string; username: string; full_name: string; avatar_url: string } | null;

    if (!contest) {
      return new Response(
        JSON.stringify({ error: 'Contest not found for submission' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML with SEO tags
    const html = generateSeoHTML({ ...submission, contest, profile });

    // Generate storage path - use category or 'general' as fallback
    const category = contest.category || 'general';
    const storagePath = `seo-pages/${category}/${contest.slug}/${submission.slug}.html`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('public-pages')
      .upload(storagePath, new TextEncoder().encode(html), {
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload SEO page', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('public-pages')
      .getPublicUrl(storagePath);

    // Update submission record with SEO page info
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        seo_page_generated: true,
        seo_page_url: publicUrl.publicUrl,
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Don't fail completely - page was uploaded successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        seo_page_url: publicUrl.publicUrl,
        message: 'SEO page generated successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSeoHTML(submission: any): string {
  const {
    title,
    slug,
    description,
    image_url,
    seo_title,
    meta_description,
    contest,
    profile,
  } = submission;

  const safeTitle = String(title || 'Photo');
  const creatorName = String(profile?.full_name || profile?.username || 'Anonymous');
  const category = contest?.category || 'general';
  const contestTitle = contest?.title || 'Photo Contest';
  const contestSlug = contest?.slug || 'contest';

  const pageTitle = (typeof seo_title === 'string' && seo_title.trim())
    ? seo_title
    : `${safeTitle} | ${contestTitle} | GAAL`;

  const pageDescription = String(meta_description || description || contest?.description || `${safeTitle} - Photography submission for ${contestTitle} on GAAL.`);
  
  // Use correct gallery URL format
  const canonicalUrl = `https://gaal.app/gallery/${category}/${contestSlug}/${slug}`;
  const contestUrl = `https://gaal.app/contest/${category}/${contestSlug}`;
  
  // Escape HTML entities
  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // Format category for display
  const formattedCategory = category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="keywords" content="${escapeHtml(safeTitle)}, ${escapeHtml(contestTitle)}, ${escapeHtml(formattedCategory)}, photography, contest, GAAL">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:image" content="${escapeHtml(image_url)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="GAAL">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <meta name="twitter:image" content="${escapeHtml(image_url)}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="icon" href="https://gaal.app/favicon.svg" type="image/svg+xml">
    
    <!-- Structured Data - ImageObject -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "name": "${escapeHtml(safeTitle)}",
      "description": "${escapeHtml(pageDescription)}",
      "url": "${canonicalUrl}",
      "contentUrl": "${escapeHtml(image_url)}",
      "creator": {
        "@type": "Person",
        "name": "${escapeHtml(creatorName)}"
      },
      "uploadDate": "${new Date().toISOString()}",
      "inLanguage": "en"
    }
    </script>
    
    <!-- Structured Data - BreadcrumbList -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://gaal.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Gallery",
          "item": "https://gaal.app/gallery"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${escapeHtml(formattedCategory)}",
          "item": "https://gaal.app/gallery?category=${category}"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "${escapeHtml(contestTitle)}",
          "item": "${contestUrl}"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "${escapeHtml(safeTitle)}",
          "item": "${canonicalUrl}"
        }
      ]
    }
    </script>
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #f8f8f8;
        background: #0a0a0a;
      }
      .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
      header { background: #111; padding: 16px 0; margin-bottom: 30px; border-bottom: 1px solid #222; }
      header a { color: #f97316; font-size: 20px; font-weight: 700; text-decoration: none; }
      .breadcrumb { font-size: 14px; color: #888; margin-bottom: 24px; }
      .breadcrumb a { color: #f97316; text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .content { background: #111; padding: 32px; border-radius: 16px; border: 1px solid #222; }
      h1 { font-size: 32px; margin-bottom: 16px; color: #fff; font-weight: 700; }
      .image-section { margin: 24px 0; text-align: center; }
      .image-section img {
        max-width: 100%;
        max-height: 70vh;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      }
      .photo-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 30px 0;
        padding: 24px;
        background: #1a1a1a;
        border-radius: 12px;
      }
      .meta-item { }
      .meta-label { font-size: 12px; color: #888; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
      .meta-value { font-size: 14px; color: #f8f8f8; margin-top: 6px; }
      .description { font-size: 16px; line-height: 1.8; color: #aaa; margin: 24px 0; }
      .cta { margin-top: 32px; padding-top: 32px; border-top: 1px solid #222; }
      .btn { 
        display: inline-block;
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white;
        padding: 14px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(249,115,22,0.3); }
      .btn-secondary {
        background: transparent;
        border: 1px solid #333;
        color: #f8f8f8;
        margin-left: 12px;
      }
      .btn-secondary:hover { background: #1a1a1a; border-color: #444; }
      footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #222; text-align: center; color: #666; font-size: 12px; }
      @media (max-width: 768px) {
        h1 { font-size: 24px; }
        .container { padding: 16px; }
        .content { padding: 20px; }
        .photo-meta { grid-template-columns: 1fr; }
      }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
      <div class="container">
        <a href="https://gaal.app">GAAL</a>
      </div>
    </header>
    
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="https://gaal.app">Home</a> / 
        <a href="https://gaal.app/gallery">Gallery</a> / 
        <a href="https://gaal.app/gallery?category=${category}">${escapeHtml(formattedCategory)}</a> / 
        <a href="${contestUrl}">${escapeHtml(contestTitle)}</a> / 
        <span>${escapeHtml(safeTitle)}</span>
      </nav>
      
      <article class="content">
        <h1>${escapeHtml(safeTitle)}</h1>
        
        <figure class="image-section">
          <img 
            src="${escapeHtml(image_url)}" 
            alt="${escapeHtml(pageDescription.slice(0, 125))}"
            title="${escapeHtml(safeTitle)}"
            width="1200"
            height="800"
            fetchpriority="high"
          />
          <figcaption class="description">${escapeHtml(pageDescription)}</figcaption>
        </figure>
        
        <div class="photo-meta">
          <div class="meta-item">
            <div class="meta-label">Contest</div>
            <div class="meta-value">${escapeHtml(contestTitle)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Category</div>
            <div class="meta-value">${escapeHtml(formattedCategory)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Photographer</div>
            <div class="meta-value">${escapeHtml(creatorName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Published</div>
            <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        
        <div class="cta">
          <a href="${contestUrl}" class="btn">View Contest</a>
          <a href="https://gaal.app/gallery" class="btn btn-secondary">Explore Gallery</a>
        </div>
      </article>
      
      <footer>
        <p>&copy; ${new Date().getFullYear()} GAAL - Win Big. Create Bold. Get Rewarded.</p>
      </footer>
    </div>
</body>
</html>`;
}

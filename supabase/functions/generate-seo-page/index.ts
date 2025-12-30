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

  const pageTitle = (typeof seo_title === 'string' && seo_title.trim())
    ? seo_title
    : `${safeTitle} | GAAL Photo Contest`;

  const pageDescription = String(meta_description || description || contest?.description || '');
  const canonicalUrl = `https://gaal.app/campaigns/${contest.slug}/photos/${slug}`;
  
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="keywords" content="${escapeHtml(title)}, ${escapeHtml(contest.title)}, photography, contest">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:image" content="${escapeHtml(image_url)}">
    <meta property="og:url" content="${canonicalUrl}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <meta name="twitter:image" content="${escapeHtml(image_url)}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Structured Data - ImageObject -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "name": "${escapeHtml(title)}",
      "description": "${escapeHtml(pageDescription)}",
      "url": "${canonicalUrl}",
      "image": "${escapeHtml(image_url)}",
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
          "name": "Campaigns",
          "item": "https://gaal.app/campaigns"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${escapeHtml(contest.title)}",
          "item": "https://gaal.app/campaigns/${contest.slug}"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "${escapeHtml(title)}",
          "item": "${canonicalUrl}"
        }
      ]
    }
    </script>
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
      }
      .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
      header { background: white; padding: 20px 0; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .breadcrumb { font-size: 14px; color: #666; margin-bottom: 20px; }
      .breadcrumb a { color: #0066cc; text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      h1 { font-size: 32px; margin-bottom: 15px; color: #1a1a1a; }
      .image-section { margin: 30px 0; }
      .image-section img {
        width: 100%;
        max-width: 600px;
        height: auto;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .photo-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 30px 0;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
      }
      .meta-item { }
      .meta-label { font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600; }
      .meta-value { font-size: 14px; color: #333; margin-top: 5px; }
      .description { font-size: 16px; line-height: 1.8; color: #555; margin: 20px 0; }
      .cta { margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee; }
      .btn { 
        display: inline-block;
        background: #0066cc;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.2s;
      }
      .btn:hover { background: #0052a3; }
      footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
      @media (max-width: 768px) {
        h1 { font-size: 24px; }
        .container { padding: 15px; }
        .content { padding: 20px; }
        .photo-meta { grid-template-columns: 1fr; }
      }
    </style>
</head>
<body>
    <header>
      <div class="container">
        <a href="https://gaal.app" style="font-size: 18px; font-weight: 600; color: #0066cc; text-decoration: none;">GAAL</a>
      </div>
    </header>
    
    <div class="container">
      <div class="breadcrumb">
        <a href="https://gaal.app">Home</a> /
        <a href="https://gaal.app/campaigns">Campaigns</a> /
        <a href="https://gaal.app/campaigns/${escapeHtml(contest.slug)}">${escapeHtml(contest.title)}</a> /
        <span>${escapeHtml(title)}</span>
      </div>
      
      <div class="content">
        <h1>${escapeHtml(title)}</h1>
        
        <div class="image-section">
          <img 
            src="${escapeHtml(image_url)}" 
            alt="${escapeHtml(title)}" 
            title="${escapeHtml(title)}"
            loading="lazy"
            width="600"
            height="400"
          />
        </div>
        
        <div class="photo-meta">
          <div class="meta-item">
            <div class="meta-label">Campaign</div>
            <div class="meta-value">${escapeHtml(contest.title)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Photographer</div>
            <div class="meta-value">${escapeHtml(creatorName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Published</div>
            <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Status</div>
            <div class="meta-value" style="text-transform: capitalize;">${escapeHtml(contest.status)}</div>
          </div>
        </div>
        
        <div class="description">
          ${escapeHtml(pageDescription)}
        </div>
        
        <div class="cta">
          <a href="https://gaal.app/campaigns/${escapeHtml(contest.slug)}" class="btn">View Campaign</a>
        </div>
      </div>
      
      <footer>
        <p>&copy; ${new Date().getFullYear()} GAAL - A user-driven marketing platform built on real participation.</p>
      </footer>
    </div>
</body>
</html>`;
}

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
    console.log('Generating sitemap...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch active, voting, and completed contests
    const { data: contests, error: contestsError } = await supabase
      .from('contests')
      .select('slug, updated_at, status')
      .in('status', ['active', 'voting', 'completed'])
      .order('updated_at', { ascending: false });

    if (contestsError) {
      console.error('Error fetching contests:', contestsError);
      throw contestsError;
    }

    // Fetch approved and winner submissions only
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        slug,
        updated_at,
        contest_id
      `)
      .in('status', ['approved', 'winner'])
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      throw submissionsError;
    }

    // Build a map of contest slugs
    const contestSlugs = new Map<string, string>();
    for (const contest of contests || []) {
      if (contest.slug) {
        // Use id as key - we need to fetch contest ids too
        contestSlugs.set(contest.slug, contest.slug);
      }
    }

    // Fetch contest info for submissions
    const contestIds = [...new Set((submissions || []).map(s => s.contest_id))];
    const { data: contestsForSubmissions } = await supabase
      .from('contests')
      .select('id, slug, status')
      .in('id', contestIds)
      .in('status', ['active', 'voting', 'completed']);
    
    const contestMap = new Map<string, { slug: string; status: string }>();
    for (const c of contestsForSubmissions || []) {
      if (c.slug) {
        contestMap.set(c.id, { slug: c.slug, status: c.status });
      }
    }

    // Build sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Static pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contests</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/how-it-works</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/leaderboard</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add contest pages
    for (const contest of contests || []) {
      if (!contest.slug) continue;
      
      const priority = contest.status === 'active' ? '0.9' : '0.7';
      const changefreq = contest.status === 'active' ? 'daily' : 'weekly';
      
      xml += `  <url>
    <loc>${BASE_URL}/contest/${contest.slug}</loc>
    <lastmod>${new Date(contest.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    }

    // Add approved photo pages
    for (const submission of submissions || []) {
      if (!submission.slug) continue;
      
      const contestInfo = contestMap.get(submission.contest_id);
      if (!contestInfo) continue;
      
      xml += `  <url>
    <loc>${BASE_URL}/photo/${contestInfo.slug}/${submission.slug}</loc>
    <lastmod>${new Date(submission.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    console.log(`Sitemap generated with ${contests?.length || 0} contests and ${submissions?.length || 0} photos`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error: unknown) {
    console.error('Sitemap generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${message}</error>`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
    });
  }
});

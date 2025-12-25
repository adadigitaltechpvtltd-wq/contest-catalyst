import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Auto-complete contests function triggered');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all active/voting contests where end_date has passed
    const now = new Date().toISOString();
    
    console.log(`Checking for expired contests at ${now}`);

    const { data: expiredContests, error: fetchError } = await supabase
      .from('contests')
      .select('id, title, status, end_date')
      .in('status', ['active', 'voting'])
      .lt('end_date', now);

    if (fetchError) {
      console.error('Error fetching expired contests:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredContests?.length || 0} expired contests`);

    if (!expiredContests || expiredContests.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired contests found',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const contest of expiredContests) {
      console.log(`Processing contest: ${contest.title} (${contest.id})`);

      // Update contest status to 'completed'
      const { error: updateError } = await supabase
        .from('contests')
        .update({ 
          status: 'completed',
          updated_at: now
        })
        .eq('id', contest.id);

      if (updateError) {
        console.error(`Error updating contest ${contest.id}:`, updateError);
        results.push({
          id: contest.id,
          title: contest.title,
          success: false,
          error: updateError.message,
        });
      } else {
        console.log(`Successfully updated contest ${contest.id} to completed`);
        results.push({
          id: contest.id,
          title: contest.title,
          success: true,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Auto-complete finished. Updated ${successCount}/${results.length} contests`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successCount} contest(s) to completed`,
        updated: successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auto-complete contests error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
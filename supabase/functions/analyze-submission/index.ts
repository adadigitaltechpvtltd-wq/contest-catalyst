import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submission_id } = await req.json();
    
    if (!submission_id) {
      console.error('No submission_id provided');
      return new Response(
        JSON.stringify({ error: 'submission_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting analysis for submission: ${submission_id}`);

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, image_url, contest_id, user_id, title, description')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      console.error('Error fetching submission:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing submission: ${submission.title}`);

    // Analyze image with AI Vision for AI detection and quality assessment
    const analysisResult = await analyzeImageWithAI(submission.image_url, lovableApiKey);
    console.log('AI analysis result:', analysisResult);

    // Check for duplicate similarity with other contest submissions
    const duplicateScore = await checkDuplicateSimilarity(
      supabase, 
      submission.id, 
      submission.contest_id, 
      submission.image_url,
      lovableApiKey
    );
    console.log('Duplicate similarity score:', duplicateScore);

    // Calculate system score (inverse of risk factors)
    // High AI probability = lower score, high quality = higher score
    const aiPenalty = analysisResult.ai_probability * 50; // 0-50 points penalty
    const visualPenalty = analysisResult.visual_anomaly * 30; // 0-30 points penalty
    const duplicatePenalty = duplicateScore * 20; // 0-20 points penalty
    const qualityBonus = analysisResult.image_quality; // 0-100 points bonus
    
    // System score: start at 100, apply penalties and quality adjustment
    const systemScore = Math.max(0, Math.min(100, 
      qualityBonus - aiPenalty - visualPenalty - duplicatePenalty
    ));

    // Calculate overall risk score
    const riskScore = Math.min(1, (
      analysisResult.ai_probability * 0.4 +
      analysisResult.visual_anomaly * 0.3 +
      duplicateScore * 0.3
    ));

    console.log(`Calculated scores - System: ${systemScore}, Risk: ${riskScore}`);

    // Update the submission with analysis results
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_probability_score: analysisResult.ai_probability,
        visual_anomaly_score: analysisResult.visual_anomaly,
        visual_anomaly_reasons: analysisResult.visual_anomaly_reasons,
        duplicate_similarity_score: duplicateScore,
        image_quality_score: analysisResult.image_quality,
        risk_score: riskScore,
        system_score: systemScore,
        ai_detection_provider: 'lovable-ai-gateway',
        analysis_completed_at: new Date().toISOString(),
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analysis completed for submission: ${submission_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        submission_id,
        scores: {
          ai_probability: analysisResult.ai_probability,
          visual_anomaly: analysisResult.visual_anomaly,
          duplicate_similarity: duplicateScore,
          image_quality: analysisResult.image_quality,
          system_score: systemScore,
          risk_score: riskScore,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeImageWithAI(imageUrl: string, apiKey: string): Promise<{
  ai_probability: number;
  visual_anomaly: number;
  visual_anomaly_reasons: string[];
  image_quality: number;
}> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this photograph for a photography contest. Provide your assessment as a JSON object with these exact fields:
                
1. ai_probability (0.0-1.0): Likelihood this image is AI-generated. Look for:
   - Unnatural textures, especially in skin, hair, fabric
   - Inconsistent lighting or shadows
   - Anatomical oddities (extra fingers, warped limbs)
   - Text that appears garbled
   - Perfect symmetry that seems artificial
   - Telltale AI patterns in backgrounds

2. visual_anomaly (0.0-1.0): Signs of manipulation or editing. Look for:
   - Clone stamp artifacts
   - Inconsistent compression
   - Mismatched lighting between elements
   - Obvious compositing
   - Unnatural color grading

3. visual_anomaly_reasons (array of strings): List specific anomalies found, empty if none

4. image_quality (0-100): Technical quality score based on:
   - Sharpness and focus
   - Proper exposure
   - Good composition
   - Color accuracy
   - Resolution quality
   - Artistic merit

Respond ONLY with a valid JSON object, no markdown or explanation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_image',
              description: 'Analyze an image for AI detection, manipulation, and quality',
              parameters: {
                type: 'object',
                properties: {
                  ai_probability: {
                    type: 'number',
                    description: 'Probability the image is AI-generated (0.0-1.0)'
                  },
                  visual_anomaly: {
                    type: 'number',
                    description: 'Score for visual manipulation/anomalies (0.0-1.0)'
                  },
                  visual_anomaly_reasons: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of specific anomalies found'
                  },
                  image_quality: {
                    type: 'number',
                    description: 'Overall image quality score (0-100)'
                  }
                },
                required: ['ai_probability', 'visual_anomaly', 'visual_anomaly_reasons', 'image_quality'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_image' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      // Return conservative defaults on API error
      return {
        ai_probability: 0,
        visual_anomaly: 0,
        visual_anomaly_reasons: [],
        image_quality: 70,
      };
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return {
        ai_probability: Math.max(0, Math.min(1, result.ai_probability || 0)),
        visual_anomaly: Math.max(0, Math.min(1, result.visual_anomaly || 0)),
        visual_anomaly_reasons: result.visual_anomaly_reasons || [],
        image_quality: Math.max(0, Math.min(100, result.image_quality || 70)),
      };
    }

    // Fallback to parsing content if no tool call
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        return {
          ai_probability: Math.max(0, Math.min(1, parsed.ai_probability || 0)),
          visual_anomaly: Math.max(0, Math.min(1, parsed.visual_anomaly || 0)),
          visual_anomaly_reasons: parsed.visual_anomaly_reasons || [],
          image_quality: Math.max(0, Math.min(100, parsed.image_quality || 70)),
        };
      } catch (parseError) {
        console.error('Error parsing AI response content:', parseError);
      }
    }

    return {
      ai_probability: 0,
      visual_anomaly: 0,
      visual_anomaly_reasons: [],
      image_quality: 70,
    };

  } catch (error) {
    console.error('Error in analyzeImageWithAI:', error);
    return {
      ai_probability: 0,
      visual_anomaly: 0,
      visual_anomaly_reasons: [],
      image_quality: 70,
    };
  }
}

async function checkDuplicateSimilarity(
  supabase: any,
  submissionId: string,
  contestId: string,
  imageUrl: string,
  apiKey: string
): Promise<number> {
  try {
    // Get other submissions from the same contest
    const { data: otherSubmissions, error } = await supabase
      .from('submissions')
      .select('id, image_url')
      .eq('contest_id', contestId)
      .neq('id', submissionId)
      .limit(20); // Limit for performance

    if (error || !otherSubmissions || otherSubmissions.length === 0) {
      console.log('No other submissions to compare against');
      return 0;
    }

    // Use AI to compare images for similarity
    const otherImageUrls = otherSubmissions.map((s: any) => s.image_url).slice(0, 5); // Compare with up to 5 images
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Compare the FIRST image (target) against the other images to detect if it's a duplicate or very similar submission. 
                
Rate the maximum similarity on a scale of 0.0 to 1.0 where:
- 0.0-0.2: Completely different images
- 0.2-0.4: Same general subject but different shots
- 0.4-0.6: Similar composition or scene
- 0.6-0.8: Very similar, possible minor edits of same photo
- 0.8-1.0: Nearly identical or exact duplicate

Respond with ONLY a number between 0.0 and 1.0.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              ...otherImageUrls.map((url: string) => ({
                type: 'image_url',
                image_url: { url }
              }))
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI similarity check error:', response.status);
      return 0;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const similarity = parseFloat(content);
    
    if (isNaN(similarity)) {
      console.log('Could not parse similarity score:', content);
      return 0;
    }

    return Math.max(0, Math.min(1, similarity));

  } catch (error) {
    console.error('Error in checkDuplicateSimilarity:', error);
    return 0;
  }
}

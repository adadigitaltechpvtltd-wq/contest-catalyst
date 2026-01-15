import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// ZERO-COST CPU-BASED IMAGE ANALYSIS SYSTEM
// No external AI APIs - all analysis done locally
// ============================================================================

// Progress broadcast helper for real-time updates
async function broadcastProgress(
  supabase: any,
  submissionId: string,
  module: string,
  progress: number,
  status: 'running' | 'completed' | 'error',
  details?: string
) {
  try {
    const channel = supabase.channel('analysis-progress');
    await channel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        submission_id: submissionId,
        module,
        progress,
        status,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    // Non-critical - don't fail analysis if broadcast fails
    console.log('[Broadcast] Error (non-critical):', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { submission_id, batch_ids } = body;
    
    // Handle batch analysis
    if (batch_ids && Array.isArray(batch_ids) && batch_ids.length > 0) {
      console.log(`[CPU-Analysis] Starting batch analysis for ${batch_ids.length} submissions`);
      
      const results: any[] = [];
      for (let i = 0; i < batch_ids.length; i++) {
        const id = batch_ids[i];
        try {
          await broadcastProgress(supabase, id, 'batch', Math.round((i / batch_ids.length) * 100), 'running', `Processing ${i + 1}/${batch_ids.length}`);
          const result = await analyzeSubmission(supabase, id);
          results.push({ id, success: true, scores: result.scores });
        } catch (error: any) {
          console.error(`[Batch] Error analyzing ${id}:`, error);
          results.push({ id, success: false, error: error.message });
          await broadcastProgress(supabase, id, 'error', 0, 'error', error.message);
        }
      }
      
      await broadcastProgress(supabase, 'batch-complete', 'batch', 100, 'completed', `Completed ${results.filter(r => r.success).length}/${batch_ids.length}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          batch: true,
          total: batch_ids.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Single submission analysis
    if (!submission_id) {
      console.error('No submission_id provided');
      return new Response(
        JSON.stringify({ error: 'submission_id or batch_ids is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await analyzeSubmission(supabase, submission_id);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[CPU-Analysis] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

async function analyzeSubmission(supabase: any, submission_id: string) {
  console.log(`[CPU-Analysis] Starting analysis for submission: ${submission_id}`);

  // Broadcast: Starting
  await broadcastProgress(supabase, submission_id, 'init', 0, 'running', 'Fetching submission...');

  // Fetch the submission
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('id, image_url, campaign_id, user_id, title, description')
    .eq('id', submission_id)
    .single();

  if (fetchError || !submission) {
    console.error('Error fetching submission:', fetchError);
    await broadcastProgress(supabase, submission_id, 'error', 0, 'error', 'Submission not found');
    throw new Error('Submission not found');
  }

  console.log(`[CPU-Analysis] Fetching image for: ${submission.title}`);
  await broadcastProgress(supabase, submission_id, 'fetch', 10, 'running', 'Downloading image...');

  // Fetch the image
  const imageResponse = await fetch(submission.image_url);
  if (!imageResponse.ok) {
    await broadcastProgress(supabase, submission_id, 'error', 0, 'error', 'Failed to fetch image');
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBytes = new Uint8Array(imageBuffer);

  console.log(`[CPU-Analysis] Image size: ${imageBytes.length} bytes`);

  // Broadcast: EXIF Analysis
  await broadcastProgress(supabase, submission_id, 'exif', 20, 'running', 'Analyzing EXIF metadata...');
  const exifAnalysis = await analyzeExifMetadata(imageBytes);
  console.log('[CPU-Analysis] EXIF:', exifAnalysis);

  // Broadcast: Image Statistics
  await broadcastProgress(supabase, submission_id, 'quality', 40, 'running', 'Analyzing image quality...');
  const imageStats = await analyzeImageStatistics(imageBytes);
  console.log('[CPU-Analysis] Image Stats:', imageStats);

  // Broadcast: Duplicate Check
  await broadcastProgress(supabase, submission_id, 'duplicate', 60, 'running', 'Checking for duplicates...');
  const duplicateScore = await checkDuplicateSimilarity(supabase, submission.id, submission.campaign_id, imageBytes);
  console.log('[CPU-Analysis] Duplicate Score:', duplicateScore);

  // Broadcast: Calculating Scores
  await broadcastProgress(supabase, submission_id, 'scoring', 80, 'running', 'Calculating final scores...');

  // MODULE 1: Visual Anomaly Detection (0-100)
  const visualAnomaly = calculateVisualAnomaly(imageStats, exifAnalysis);
  const visualAnomalyReasons = getVisualAnomalyReasons(imageStats, exifAnalysis);

  // MODULE 2: Duplicate Similarity (already 0-1)
  const duplicateSimilarity = duplicateScore;

  // MODULE 3: Image Quality Score (0-100)
  const imageQuality = calculateImageQuality(imageStats, exifAnalysis);

  // SCORING LOGIC: Calculate Overall Risk as weighted average
  // Visual Anomaly (35%), Duplicate Similarity (35%), Low Image Quality (30%)
  const overallRisk = (
    (visualAnomaly / 100) * 0.35 +
    duplicateSimilarity * 0.35 +
    ((100 - imageQuality) / 100) * 0.30
  );

  // System Score = 100 - Overall Risk (converted to 0-100)
  const systemScore = Math.max(0, Math.min(100, 100 - (overallRisk * 100)));

  console.log(`[CPU-Analysis] Scores calculated:`);
  console.log(`  - Visual Anomaly: ${visualAnomaly.toFixed(1)}%`);
  console.log(`  - Duplicate: ${(duplicateSimilarity * 100).toFixed(1)}%`);
  console.log(`  - Quality: ${imageQuality.toFixed(1)}`);
  console.log(`  - Overall Risk: ${(overallRisk * 100).toFixed(1)}%`);
  console.log(`  - System Score: ${systemScore.toFixed(1)}`);

  // Generate perceptual hash for future duplicate detection
  const perceptualHash = generatePerceptualHash(imageBytes);

  // Broadcast: Saving
  await broadcastProgress(supabase, submission_id, 'saving', 90, 'running', 'Saving results...');

  // Helper to parse EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO format
  const parseExifDate = (exifDate: string | null): string | null => {
    if (!exifDate) return null;
    try {
      // EXIF format: "2025:12:17 13:24:59" -> "2025-12-17T13:24:59"
      const match = exifDate.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [, year, month, day, hour, minute, second] = match;
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      }
      return null; // Invalid format, return null instead of invalid date
    } catch {
      return null;
    }
  };

  // Update the submission with analysis results
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      visual_anomaly_score: visualAnomaly / 100,
      visual_anomaly_reasons: visualAnomalyReasons,
      duplicate_similarity_score: duplicateSimilarity,
      image_quality_score: imageQuality,
      risk_score: overallRisk,
      system_score: systemScore,
      // EXIF data
      exif_camera_make: exifAnalysis.cameraMake,
      exif_camera_model: exifAnalysis.cameraModel,
      exif_date_taken: parseExifDate(exifAnalysis.dateTaken),
      exif_software: exifAnalysis.software,
      exif_has_anomalies: exifAnalysis.hasAnomalies,
      exif_anomaly_reasons: exifAnalysis.anomalyReasons,
      // Detailed scores
      blur_score: imageStats.blurScore,
      exposure_score: imageStats.exposureScore,
      noise_score: imageStats.noiseScore,
      sharpness_score: imageStats.sharpnessScore,
      contrast_score: imageStats.contrastScore,
      // Metadata
      perceptual_hash: perceptualHash,
      analysis_method: 'cpu-local',
      analysis_completed_at: new Date().toISOString(),
    })
    .eq('id', submission_id);

  if (updateError) {
    console.error('Error updating submission:', updateError);
    await broadcastProgress(supabase, submission_id, 'error', 0, 'error', 'Failed to save results');
    throw new Error('Failed to update submission');
  }

  // Broadcast: Complete
  await broadcastProgress(supabase, submission_id, 'complete', 100, 'completed', `Score: ${systemScore.toFixed(0)}/100`);

  console.log(`[CPU-Analysis] Analysis completed for submission: ${submission_id}`);

  return { 
    success: true, 
    submission_id,
    analysis_method: 'cpu-local',
    scores: {
      visual_anomaly: visualAnomaly,
      duplicate_similarity: duplicateSimilarity * 100,
      image_quality: imageQuality,
      overall_risk: overallRisk * 100,
      system_score: systemScore,
    },
    exif: {
      camera: exifAnalysis.cameraMake ? `${exifAnalysis.cameraMake} ${exifAnalysis.cameraModel}` : null,
      software: exifAnalysis.software,
      has_anomalies: exifAnalysis.hasAnomalies,
    }
  };
}

// ============================================================================
// EXIF METADATA ANALYSIS
// Parses EXIF data to detect camera info, software tags, and anomalies
// ============================================================================

interface ExifAnalysis {
  hasExif: boolean;
  cameraMake: string | null;
  cameraModel: string | null;
  software: string | null;
  dateTaken: string | null;
  hasAnomalies: boolean;
  anomalyReasons: string[];
  isLikelySynthetic: boolean;
  syntheticConfidence: number;
}

async function analyzeExifMetadata(imageBytes: Uint8Array): Promise<ExifAnalysis> {
  const result: ExifAnalysis = {
    hasExif: false,
    cameraMake: null,
    cameraModel: null,
    software: null,
    dateTaken: null,
    hasAnomalies: false,
    anomalyReasons: [],
    isLikelySynthetic: false,
    syntheticConfidence: 0,
  };

  try {
    // Parse JPEG/TIFF EXIF manually
    const exifData = parseExifFromBytes(imageBytes);
    
    if (exifData) {
      result.hasExif = true;
      result.cameraMake = exifData.make || null;
      result.cameraModel = exifData.model || null;
      result.software = exifData.software || null;
      result.dateTaken = exifData.dateTime || null;

      // Check for AI-generation software signatures
      const aiSoftwarePatterns = [
        'stable diffusion', 'midjourney', 'dall-e', 'dall·e', 'openai',
        'runway', 'leonardo', 'adobe firefly', 'bing image creator',
        'ideogram', 'playground ai', 'nightcafe', 'artbreeder',
        'jasper art', 'canva ai', 'fotor ai', 'pixlr ai',
        'automatic1111', 'comfyui', 'invoke ai', 'fooocus',
        'stable-diffusion', 'novelai', 'nai diffusion',
      ];

      const editingSoftwarePatterns = [
        'photoshop', 'lightroom', 'gimp', 'affinity', 'capture one',
        'darktable', 'rawtherapee', 'luminar', 'on1', 'dxo',
        'snapseed', 'vsco', 'pixelmator', 'acorn', 'paint.net',
      ];

      const softwareLower = (exifData.software || '').toLowerCase();
      
      // Check for AI generation software
      for (const pattern of aiSoftwarePatterns) {
        if (softwareLower.includes(pattern)) {
          result.isLikelySynthetic = true;
          result.syntheticConfidence = 0.95;
          result.hasAnomalies = true;
          result.anomalyReasons.push(`AI generation software detected: ${exifData.software}`);
          break;
        }
      }

      // Check for heavy editing (not as severe)
      if (!result.isLikelySynthetic) {
        for (const pattern of editingSoftwarePatterns) {
          if (softwareLower.includes(pattern)) {
            result.syntheticConfidence = Math.max(result.syntheticConfidence, 0.2);
            result.anomalyReasons.push(`Editing software detected: ${exifData.software}`);
            break;
          }
        }
      }

      // Check for missing camera info (suspicious for "photos")
      if (!exifData.make && !exifData.model) {
        result.syntheticConfidence = Math.max(result.syntheticConfidence, 0.3);
        result.anomalyReasons.push('No camera manufacturer/model in EXIF');
      }

      // Check for missing date (common in AI images)
      if (!exifData.dateTime) {
        result.syntheticConfidence = Math.max(result.syntheticConfidence, 0.1);
      }

    } else {
      // No EXIF at all - could be AI-generated or stripped
      result.syntheticConfidence = 0.4;
      result.anomalyReasons.push('No EXIF metadata found');
    }

    result.hasAnomalies = result.anomalyReasons.length > 0;

  } catch (error) {
    console.error('[EXIF] Parse error:', error);
    result.anomalyReasons.push('EXIF parsing failed');
    result.syntheticConfidence = 0.2;
  }

  return result;
}

// Simple EXIF parser for JPEG files
function parseExifFromBytes(bytes: Uint8Array): { make?: string; model?: string; software?: string; dateTime?: string } | null {
  // Check for JPEG magic bytes
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    // Try PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      return parsePngMetadata(bytes);
    }
    return null;
  }

  // Find APP1 marker (EXIF)
  let offset = 2;
  while (offset < bytes.length - 4) {
    if (bytes[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];
    
    // APP1 marker (EXIF)
    if (marker === 0xE1) {
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const exifData = bytes.slice(offset + 4, offset + 2 + length);
      
      // Check for "Exif\0\0" header
      const exifHeader = String.fromCharCode(...exifData.slice(0, 4));
      if (exifHeader === 'Exif') {
        return parseExifIFD(exifData.slice(6));
      }
    }

    // Skip to next marker
    if (marker >= 0xE0 && marker <= 0xEF) {
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + length;
    } else if (marker === 0xD9 || marker === 0xDA) {
      break; // End of headers
    } else {
      offset++;
    }
  }

  return null;
}

function parseExifIFD(data: Uint8Array): { make?: string; model?: string; software?: string; dateTime?: string } {
  const result: { make?: string; model?: string; software?: string; dateTime?: string } = {};
  
  try {
    // Determine byte order
    const byteOrder = String.fromCharCode(data[0], data[1]);
    const isLittleEndian = byteOrder === 'II';

    const readUint16 = (offset: number) => {
      return isLittleEndian
        ? data[offset] | (data[offset + 1] << 8)
        : (data[offset] << 8) | data[offset + 1];
    };

    const readUint32 = (offset: number) => {
      return isLittleEndian
        ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
        : (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    };

    // IFD0 offset
    const ifdOffset = readUint32(4);
    const numEntries = readUint16(ifdOffset);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12);
      const tag = readUint16(entryOffset);
      const type = readUint16(entryOffset + 2);
      const count = readUint32(entryOffset + 4);
      
      let valueOffset = entryOffset + 8;
      if (type === 2 && count > 4) { // ASCII string > 4 bytes
        valueOffset = readUint32(entryOffset + 8);
      }

      // Read string value
      const readString = (offset: number, length: number): string => {
        const chars: number[] = [];
        for (let j = 0; j < length - 1 && data[offset + j] !== 0; j++) {
          chars.push(data[offset + j]);
        }
        return String.fromCharCode(...chars).trim();
      };

      // Tag IDs: 0x010F = Make, 0x0110 = Model, 0x0131 = Software, 0x0132 = DateTime
      if (tag === 0x010F && type === 2) {
        result.make = readString(valueOffset, count);
      } else if (tag === 0x0110 && type === 2) {
        result.model = readString(valueOffset, count);
      } else if (tag === 0x0131 && type === 2) {
        result.software = readString(valueOffset, count);
      } else if (tag === 0x0132 && type === 2) {
        result.dateTime = readString(valueOffset, count);
      }
    }
  } catch (e) {
    console.error('[EXIF] IFD parse error:', e);
  }

  return result;
}

function parsePngMetadata(bytes: Uint8Array): { make?: string; model?: string; software?: string; dateTime?: string } | null {
  const result: { make?: string; model?: string; software?: string; dateTime?: string } = {};
  
  try {
    // Parse PNG chunks looking for tEXt, iTXt, or eXIf
    let offset = 8; // Skip PNG signature
    
    while (offset < bytes.length - 12) {
      const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const chunkType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
      
      if (chunkType === 'tEXt' || chunkType === 'iTXt') {
        const chunkData = bytes.slice(offset + 8, offset + 8 + length);
        const text = new TextDecoder().decode(chunkData);
        
        // Look for software or generator info
        const lowerText = text.toLowerCase();
        if (lowerText.includes('software') || lowerText.includes('generator') || lowerText.includes('creator')) {
          // Extract the value after the keyword
          const parts = text.split('\0');
          if (parts.length >= 2) {
            result.software = parts[1] || parts[0];
          }
        }
      }
      
      offset += 12 + length; // 4 (length) + 4 (type) + length + 4 (CRC)
    }
  } catch (e) {
    console.error('[PNG] Metadata parse error:', e);
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ============================================================================
// IMAGE STATISTICS ANALYSIS
// Analyzes pixel data for blur, exposure, noise, sharpness, contrast
// ============================================================================

interface ImageStats {
  width: number;
  height: number;
  blurScore: number;      // 0-100, higher = more blur
  exposureScore: number;  // 0-100, deviation from ideal
  noiseScore: number;     // 0-100, higher = more noise
  sharpnessScore: number; // 0-100, higher = sharper
  contrastScore: number;  // 0-100, higher = more contrast
  brightness: number;     // 0-255 average
  saturation: number;     // 0-1 average
  hasUniformRegions: boolean;
  compressionArtifacts: number; // 0-100
}

async function analyzeImageStatistics(imageBytes: Uint8Array): Promise<ImageStats> {
  // Default stats for analysis
  const stats: ImageStats = {
    width: 0,
    height: 0,
    blurScore: 30,
    exposureScore: 50,
    noiseScore: 20,
    sharpnessScore: 60,
    contrastScore: 50,
    brightness: 128,
    saturation: 0.5,
    hasUniformRegions: false,
    compressionArtifacts: 20,
  };

  try {
    // Get image dimensions from header
    const dimensions = getImageDimensions(imageBytes);
    stats.width = dimensions.width;
    stats.height = dimensions.height;

    // Analyze based on file size vs dimensions (compression indicator)
    const expectedSize = stats.width * stats.height * 3; // Uncompressed RGB
    const compressionRatio = imageBytes.length / expectedSize;
    
    // Very high compression can indicate quality issues
    if (compressionRatio < 0.05) {
      stats.compressionArtifacts = 70;
    } else if (compressionRatio < 0.1) {
      stats.compressionArtifacts = 40;
    } else {
      stats.compressionArtifacts = 10;
    }

    // Sample pixels for statistical analysis
    const sampleResult = sampleImagePixels(imageBytes);
    if (sampleResult) {
      stats.brightness = sampleResult.avgBrightness;
      stats.saturation = sampleResult.avgSaturation;
      
      // Calculate exposure score (ideal is around 128)
      const brightnessDeviation = Math.abs(sampleResult.avgBrightness - 128) / 128;
      stats.exposureScore = brightnessDeviation * 100;

      // Estimate sharpness from variance
      stats.sharpnessScore = Math.min(100, sampleResult.variance / 2);
      stats.blurScore = 100 - stats.sharpnessScore;

      // Estimate noise from high-frequency variation
      stats.noiseScore = Math.min(100, sampleResult.highFreqVariance * 2);

      // Contrast from histogram spread
      stats.contrastScore = Math.min(100, sampleResult.histogramSpread);

      // Check for suspiciously uniform regions (AI artifacts)
      stats.hasUniformRegions = sampleResult.uniformRegionRatio > 0.3;
    }

    // Resolution quality check
    const megapixels = (stats.width * stats.height) / 1000000;
    if (megapixels < 0.5) {
      stats.sharpnessScore = Math.max(0, stats.sharpnessScore - 30);
    }

  } catch (error) {
    console.error('[ImageStats] Analysis error:', error);
  }

  return stats;
}

function getImageDimensions(bytes: Uint8Array): { width: number; height: number } {
  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2;
    while (offset < bytes.length - 9) {
      if (bytes[offset] !== 0xFF) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      
      // SOF markers contain dimensions
      if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + length;
    }
  }
  
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }

  // WebP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    // Simplified WebP parsing
    const width = (bytes[26] | (bytes[27] << 8)) + 1;
    const height = (bytes[28] | (bytes[29] << 8)) + 1;
    return { width, height };
  }

  return { width: 1920, height: 1080 }; // Default assumption
}

function sampleImagePixels(bytes: Uint8Array): {
  avgBrightness: number;
  avgSaturation: number;
  variance: number;
  highFreqVariance: number;
  histogramSpread: number;
  uniformRegionRatio: number;
} | null {
  try {
    // For compressed formats, we analyze the byte distribution as a proxy
    const sampleSize = Math.min(10000, bytes.length);
    const step = Math.max(1, Math.floor(bytes.length / sampleSize));
    
    const samples: number[] = [];
    for (let i = 0; i < bytes.length; i += step) {
      samples.push(bytes[i]);
    }

    // Calculate statistics
    const sum = samples.reduce((a, b) => a + b, 0);
    const avgBrightness = sum / samples.length;

    const variance = samples.reduce((acc, val) => acc + Math.pow(val - avgBrightness, 2), 0) / samples.length;

    // High frequency variance (difference between adjacent samples)
    let highFreqSum = 0;
    for (let i = 1; i < samples.length; i++) {
      highFreqSum += Math.abs(samples[i] - samples[i - 1]);
    }
    const highFreqVariance = highFreqSum / (samples.length - 1);

    // Histogram for spread calculation
    const histogram = new Array(16).fill(0);
    for (const sample of samples) {
      histogram[Math.floor(sample / 16)]++;
    }
    
    const nonEmptyBuckets = histogram.filter(count => count > samples.length * 0.01).length;
    const histogramSpread = (nonEmptyBuckets / 16) * 100;

    // Uniform region detection (many similar consecutive values)
    let uniformCount = 0;
    for (let i = 1; i < samples.length; i++) {
      if (Math.abs(samples[i] - samples[i - 1]) < 5) {
        uniformCount++;
      }
    }
    const uniformRegionRatio = uniformCount / (samples.length - 1);

    return {
      avgBrightness,
      avgSaturation: 0.5, // Cannot accurately determine without decoding
      variance: Math.sqrt(variance),
      highFreqVariance,
      histogramSpread,
      uniformRegionRatio,
    };
  } catch (e) {
    console.error('[PixelSample] Error:', e);
    return null;
  }
}

// ============================================================================
// DUPLICATE / SIMILARITY DETECTION
// Uses perceptual hashing (simplified dHash) for comparison
// ============================================================================

async function checkDuplicateSimilarity(
  supabase: any,
  submissionId: string,
  campaignId: string,
  imageBytes: Uint8Array
): Promise<number> {
  try {
    // Generate hash for current image
    const currentHash = generatePerceptualHash(imageBytes);
    
    if (!currentHash) {
      console.log('[Duplicate] Could not generate hash');
      return 0;
    }

    // Get existing submissions with hashes from the same campaign
    const { data: otherSubmissions, error } = await supabase
      .from('submissions')
      .select('id, perceptual_hash')
      .eq('campaign_id', campaignId)
      .neq('id', submissionId)
      .not('perceptual_hash', 'is', null)
      .limit(100);

    if (error || !otherSubmissions || otherSubmissions.length === 0) {
      console.log('[Duplicate] No other submissions to compare against');
      return 0;
    }

    // Compare hashes
    let maxSimilarity = 0;
    for (const other of otherSubmissions) {
      if (other.perceptual_hash) {
        const similarity = compareHashes(currentHash, other.perceptual_hash);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    console.log(`[Duplicate] Max similarity found: ${(maxSimilarity * 100).toFixed(1)}%`);
    return maxSimilarity;

  } catch (error) {
    console.error('[Duplicate] Error:', error);
    return 0;
  }
}

// Simplified perceptual hash based on byte patterns
function generatePerceptualHash(bytes: Uint8Array): string {
  try {
    // Sample the image at regular intervals
    const hashSize = 64; // 64 bits = 16 hex chars
    const hash: number[] = [];
    
    const step = Math.max(1, Math.floor(bytes.length / (hashSize * 8)));
    
    for (let i = 0; i < hashSize; i++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const idx = Math.min((i * 8 + bit) * step, bytes.length - 2);
        // Compare adjacent bytes to create gradient-based hash
        if (bytes[idx] > bytes[idx + 1]) {
          byte |= (1 << bit);
        }
      }
      hash.push(byte);
    }

    return hash.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.error('[Hash] Generation error:', e);
    return '';
  }
}

function compareHashes(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 0;
  }

  // Hamming distance
  let matchingBits = 0;
  const totalBits = hash1.length * 4; // Each hex char = 4 bits

  for (let i = 0; i < hash1.length; i++) {
    const a = parseInt(hash1[i], 16);
    const b = parseInt(hash2[i], 16);
    const xor = a ^ b;
    
    // Count matching bits (bits that are NOT different)
    matchingBits += 4 - countBits(xor);
  }

  return matchingBits / totalBits;
}

function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

// ============================================================================
// SCORING CALCULATIONS
// ============================================================================

function calculateVisualAnomaly(stats: ImageStats, exif: ExifAnalysis): number {
  let anomaly = 0;

  // Blur detection
  if (stats.blurScore > 60) {
    anomaly += 25;
  } else if (stats.blurScore > 40) {
    anomaly += 10;
  }

  // Exposure issues
  if (stats.exposureScore > 70) {
    anomaly += 20; // Severely over/under exposed
  } else if (stats.exposureScore > 50) {
    anomaly += 10;
  }

  // Compression artifacts
  if (stats.compressionArtifacts > 50) {
    anomaly += 15;
  }

  // Low contrast
  if (stats.contrastScore < 20) {
    anomaly += 10;
  }

  // EXIF anomalies
  if (exif.hasAnomalies) {
    anomaly += 15;
  }

  return Math.min(100, anomaly);
}

function getVisualAnomalyReasons(stats: ImageStats, exif: ExifAnalysis): string[] {
  const reasons: string[] = [];

  if (stats.blurScore > 60) {
    reasons.push('Image appears blurry');
  }

  if (stats.exposureScore > 70) {
    reasons.push(stats.brightness > 180 ? 'Overexposed' : 'Underexposed');
  }

  if (stats.compressionArtifacts > 50) {
    reasons.push('Heavy compression artifacts detected');
  }

  if (stats.contrastScore < 20) {
    reasons.push('Low contrast');
  }

  if (stats.noiseScore > 70) {
    reasons.push('High noise levels');
  }

  if (exif.anomalyReasons) {
    reasons.push(...exif.anomalyReasons);
  }

  return reasons;
}

function calculateImageQuality(stats: ImageStats, exif: ExifAnalysis): number {
  let quality = 50; // Start at neutral

  // Sharpness contribution (0-25 points)
  quality += (stats.sharpnessScore / 100) * 25;

  // Proper exposure (0-20 points, subtract for bad exposure)
  const exposurePenalty = Math.min(20, stats.exposureScore / 5);
  quality += 20 - exposurePenalty;

  // Contrast contribution (0-15 points)
  quality += (stats.contrastScore / 100) * 15;

  // Resolution bonus (0-15 points)
  const megapixels = (stats.width * stats.height) / 1000000;
  if (megapixels >= 8) {
    quality += 15;
  } else if (megapixels >= 4) {
    quality += 10;
  } else if (megapixels >= 2) {
    quality += 5;
  }

  // Low compression artifacts (0-10 points)
  quality += (100 - stats.compressionArtifacts) / 10;

  // Camera metadata bonus (indicates real camera)
  if (exif.cameraMake && exif.cameraModel) {
    quality += 5;
  }

  // Noise penalty
  if (stats.noiseScore > 50) {
    quality -= (stats.noiseScore - 50) / 5;
  }

  return Math.max(0, Math.min(100, quality));
}

# Supabase Setup Instructions: Conditional SEO Page Generation

## Overview
This implementation allows admins to selectively approve photos with or without SEO:
- **Approve only**: Photo stays in app, not indexed by Google
- **Approve + SEO**: Photo gets static HTML page, automatically indexed by Google

---

## STEP 1: Add Database Columns

Run these SQL commands in Supabase SQL Editor:

```sql
-- Add columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_page_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_page_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_submissions_seo_approved 
ON submissions(seo_approved) WHERE seo_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_submissions_seo_page_generated 
ON submissions(seo_page_generated) WHERE seo_page_generated = TRUE;
```

---

## STEP 2: Enable Required Extensions

Run in Supabase SQL Editor (usually already enabled by default):

```sql
-- Enable HTTP extension for webhooks
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

---

## STEP 3: Create Database Trigger Function

This function automatically calls the SEO generation Edge Function when a photo is approved WITH SEO.

Run in Supabase SQL Editor:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION public.on_submission_seo_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if seo_approved changed from false to true
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    -- Call Edge Function asynchronously
    PERFORM net.http_post(
      url := 'https://xoompskrczzucsohfcyy.supabase.co/functions/v1/generate-seo-page',
      headers := jsonb_build_object(
        'authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('submission_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS submission_seo_approved_trigger ON submissions;

-- Create trigger
CREATE TRIGGER submission_seo_approved_trigger
AFTER UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION public.on_submission_seo_approved();
```

**IMPORTANT**: Replace:
- `YOUR_PROJECT_ID` with your Supabase project ID (from URL: `https://YOUR_PROJECT_ID.supabase.co`)
- `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (Settings → API → Service role)

---

## STEP 4: Create Storage Bucket for SEO Pages

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named: `public-pages`
3. **Make it Public** (toggle on)
4. Click the bucket, go to Policies
5. Add this policy to allow the Edge Function to write:

```json
{
  "definition": {
    "bucket": "public-pages",
    "claims": {},
    "role": "authenticated",
    "grant": ["INSERT", "UPDATE", "DELETE"],
    "uses_service_role": true
  }
}
```

Or use SQL policy:
```sql
CREATE POLICY "Service role can insert seo pages" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'public-pages' AND auth.role() = 'service_role');

CREATE POLICY "Public read access seo pages" ON storage.objects
FOR SELECT
USING (bucket_id = 'public-pages');
```

---

## STEP 5: Verify Environment Variables in Edge Functions

All Edge Functions should have access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Check: Supabase Dashboard → Edge Functions → Settings

---

## Database Schema Summary

| Column | Type | Purpose |
|--------|------|---------|
| `seo_approved` | BOOLEAN | Admin checked "Generate SEO page" checkbox |
| `seo_page_generated` | BOOLEAN | Edge Function successfully created the page |
| `seo_page_url` | TEXT | Full URL to static SEO page in Storage |

---

## How It Works

1. **Admin approves photo** with ✅ "Generate SEO page" checkbox
2. **Database stores** `seo_approved = TRUE`
3. **Trigger fires** → calls Edge Function asynchronously
4. **Edge Function**:
   - Queries photo + contest + profile data
   - Generates complete HTML with SEO tags
   - Uploads to `public-pages/seo-pages/{category}/{contestSlug}/{photoSlug}.html`
   - Updates submission with `seo_page_url` and `seo_page_generated = TRUE`
5. **Google crawls** the static page directly
6. **App can redirect** to static page when available

---

## Rollback (If Needed)

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS submission_seo_approved_trigger ON submissions;

-- Drop function
DROP FUNCTION IF EXISTS public.on_submission_seo_approved();

-- Remove columns (optional - keeps data for reference)
-- ALTER TABLE submissions DROP COLUMN seo_approved;
-- ALTER TABLE submissions DROP COLUMN seo_page_generated;
-- ALTER TABLE submissions DROP COLUMN seo_page_url;
```

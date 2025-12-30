# SEO Approved Images Storage Fix - Deployment Guide

## Problem
After updating the code, SEO approved images were not being added to the "public-pages" storage bucket. The root cause was missing database infrastructure.

## What Was Missing
1. Database columns: `seo_approved`, `seo_page_generated`, `seo_page_url`
2. HTTP extension in the database
3. Database trigger function to call the edge function
4. Database trigger to fire on submission updates

## Solution Implemented
A new migration file has been created: `20251230130553_483da5ee-121b-43be-be7a-75471ade0900.sql`

This migration adds:
- Three new columns to the `submissions` table
- Performance indexes for the new columns
- HTTP extension for making webhook calls
- Trigger function that calls the `generate-seo-page` edge function
- Trigger that fires when `seo_approved` changes from false to true

## Deployment Steps

### 1. Apply the Migration
Run the migration in your Supabase SQL Editor:
```bash
# If using Supabase CLI
supabase migration up

# Or manually copy the SQL from:
# supabase/migrations/20251230130553_483da5ee-121b-43be-be7a-75471ade0900.sql
# And run it in Supabase Dashboard → SQL Editor
```

### 2. Verify Migration Success
Run this query to verify the changes:
```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'submissions' 
AND column_name IN ('seo_approved', 'seo_page_generated', 'seo_page_url');

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'submission_seo_approved_trigger';

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'on_submission_seo_approved';

-- Check HTTP extension
SELECT * FROM pg_extension WHERE extname = 'http';
```

### 3. Ensure Storage Bucket Exists
1. Go to Supabase Dashboard → Storage
2. Check if bucket `public-pages` exists
3. If not, create it:
   - Name: `public-pages`
   - Make it **Public** (toggle on)

### 4. Verify Edge Function is Deployed
1. Go to Supabase Dashboard → Edge Functions
2. Verify `generate-seo-page` function is deployed
3. Check the function logs for any errors

### 5. Test the Complete Flow
1. Go to Admin Dashboard → Submissions
2. Find a pending submission
3. Click "Review"
4. Set Action: "Approve"
5. ✅ Check the box: "Generate SEO page for Google indexing"
6. Click "Approve"
7. Wait 5-10 seconds
8. Check:
   - Supabase Storage → `public-pages` → should see the HTML file
   - Submissions table → `seo_page_generated` should be TRUE
   - Submissions table → `seo_page_url` should have a value

### 6. Monitor Edge Function Logs
If the file doesn't appear:
1. Go to Supabase Dashboard → Edge Functions → `generate-seo-page`
2. Click on "Logs" or "Invocations" tab
3. Check for any errors
4. Common issues:
   - Storage bucket permissions
   - Missing submission data
   - Network connectivity

## How It Works Now

```
Admin approves with SEO checkbox
        ↓
Database: submissions.seo_approved = TRUE
        ↓
Trigger fires: submission_seo_approved_trigger
        ↓
Trigger function calls: on_submission_seo_approved()
        ↓
HTTP POST to: generate-seo-page edge function
        ↓
Edge function:
  - Fetches submission data
  - Generates HTML with SEO tags
  - Uploads to public-pages storage
  - Updates submission record
        ↓
HTML file created at:
/public-pages/seo-pages/{category}/{contestSlug}/{photoSlug}.html
```

## Rollback Instructions
If you need to undo this migration:
```sql
-- Drop trigger
DROP TRIGGER IF EXISTS submission_seo_approved_trigger ON submissions;

-- Drop function
DROP FUNCTION IF EXISTS public.on_submission_seo_approved();

-- Drop indexes (optional)
DROP INDEX IF EXISTS idx_submissions_seo_approved;
DROP INDEX IF EXISTS idx_submissions_seo_page_generated;

-- Remove columns (optional - you may want to keep the data)
ALTER TABLE submissions DROP COLUMN IF EXISTS seo_approved;
ALTER TABLE submissions DROP COLUMN IF EXISTS seo_page_generated;
ALTER TABLE submissions DROP COLUMN IF EXISTS seo_page_url;
```

## Troubleshooting

### Problem: Trigger doesn't fire
**Solution:** Check if the HTTP extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'http';
```

### Problem: Edge function not called
**Solution:** Check trigger function definition and ensure the URL is correct:
```sql
SELECT routine_definition FROM information_schema.routines 
WHERE routine_name = 'on_submission_seo_approved';
```

### Problem: File not appearing in storage
**Solution:** 
1. Check edge function logs for errors
2. Verify storage bucket is public
3. Check storage bucket permissions/policies

### Problem: Permission denied when uploading to storage
**Solution:** Add storage policy:
```sql
CREATE POLICY "Service role can insert seo pages" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'public-pages' AND auth.role() = 'service_role');
```

## Related Files
- Migration: `supabase/migrations/20251230130553_483da5ee-121b-43be-be7a-75471ade0900.sql`
- Edge Function: `supabase/functions/generate-seo-page/index.ts`
- Admin UI: `src/pages/admin/AdminSubmissions.tsx`
- Implementation Guide: `IMPLEMENTATION_GUIDE_SEO_CONDITIONAL.md`
- Setup Instructions: `SUPABASE_SETUP_INSTRUCTIONS.md`

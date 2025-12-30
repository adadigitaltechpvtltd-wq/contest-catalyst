# Complete Implementation Guide: Conditional SEO Page Generation

## What This Does

When an admin approves a photo submission, they now have TWO options:

1. **✅ Approve** - Photo shows only in GAAL app, NOT indexed by Google
2. **✅ Approve + Generate SEO** - Photo gets a static HTML page automatically published to Google

This gives you complete control over which photos get SEO treatment, saving costs and Google indexing quota.

---

## File Changes Summary

### 1. UI Changes (DONE ✅)
**File**: [src/pages/admin/AdminSubmissions.tsx](src/pages/admin/AdminSubmissions.tsx)

**Changes made:**
- Added `seoApproval` state to track checkbox
- Added checkbox UI after "Action" dropdown in review modal
- Only shows checkbox when approving or making winner
- Sends `seo_approved` flag to database

**What it looks like:**
```
Action: [Approve dropdown]

☑ Generate SEO page for Google indexing  ⚡
```

### 2. Edge Function - NEW ✅
**File**: [supabase/functions/generate-seo-page/index.ts](supabase/functions/generate-seo-page/index.ts)

**What it does:**
- Receives submission ID from database trigger
- Queries photo + contest + profile data
- Generates complete HTML with:
  - `<h1>` title
  - `<img alt="title" title="title">` with image
  - Meta tags (title, description)
  - JSON-LD structured data (ImageObject, BreadcrumbList)
  - Open Graph & Twitter Card tags
- Uploads HTML to Supabase Storage
- Updates submission with `seo_page_url`

**Storage path**: `/public-pages/seo-pages/{category}/{contestSlug}/{photoSlug}.html`

### 3. Edge Function - UPDATED ✅
**File**: [supabase/functions/sitemap/index.ts](supabase/functions/sitemap/index.ts)

**Changes:**
- Now fetches `seo_approved` and `seo_page_url` for each photo
- If `seo_approved=TRUE`, uses static page URL in sitemap (higher priority)
- If `seo_approved=FALSE`, uses React route URL (lower priority)

---

## Database Changes REQUIRED

You need to execute these SQL scripts in Supabase SQL Editor. See [SUPABASE_SETUP_INSTRUCTIONS.md](SUPABASE_SETUP_INSTRUCTIONS.md) for complete copy-paste scripts.

### Columns to add:
```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_page_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_page_url TEXT;
```

### Trigger to create:
```sql
CREATE OR REPLACE FUNCTION public.on_submission_seo_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seo_approved = TRUE AND (OLD.seo_approved IS NULL OR OLD.seo_approved = FALSE) THEN
    PERFORM net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-seo-page',
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
```

### Storage bucket:
- Name: `public-pages`
- Public: YES
- Allows Edge Function to write files

---

## How to Set Up (Step by Step)

### Step 1: Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `public-pages`
4. **Check**: "Make it public"
5. Create

### Step 2: Run Database SQL
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy ALL scripts from [SUPABASE_SETUP_INSTRUCTIONS.md](SUPABASE_SETUP_INSTRUCTIONS.md)
4. **Replace placeholders**:
   - `YOUR_PROJECT_ID` → Your Supabase project ID (from URL)
   - `YOUR_SERVICE_ROLE_KEY` → From Settings → API → Service Role Key
5. Run query

### Step 3: Deploy Edge Function
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create function"
3. Name: `generate-seo-page`
4. Copy entire contents of [supabase/functions/generate-seo-page/index.ts](supabase/functions/generate-seo-page/index.ts)
5. Paste into editor
6. Deploy

### Step 4: Update Existing Edge Function
1. Go to Supabase Dashboard → Edge Functions → `sitemap`
2. Replace entire file with [supabase/functions/sitemap/index.ts](supabase/functions/sitemap/index.ts)
3. Deploy

### Step 5: Test It
1. Go to Admin Dashboard → Submissions
2. Find a pending submission
3. Click "Review"
4. Set Action: "Approve"
5. **Check the box**: "Generate SEO page for Google indexing"
6. Click "Approve"
7. Wait 5-10 seconds
8. Check Supabase Storage → `public-pages` → should see the HTML file there

---

## Workflow Diagram

```
Admin Dashboard (UI)
       ↓
   Click Review Button
       ↓
   Select "Approve" 
   Check ☑ "Generate SEO page"
       ↓
   Click "Approve" Button
       ↓
   Update submissions table:
   - status = 'approved'
   - seo_approved = TRUE  ← THIS TRIGGERS AUTOMATION
       ↓
   Database Trigger fires
       ↓
   Calls Edge Function: generate-seo-page
       ↓
   Edge Function:
   • Queries photo + contest + profile
   • Generates complete HTML
   • Uploads to Storage: /public-pages/seo-pages/{category}/{slug}/{slug}.html
   • Updates submission: seo_page_url, seo_page_generated = TRUE
       ↓
   Google can now crawl the static page
   ✅ Photo indexed with full SEO metadata
```

---

## What Gets Generated (HTML Content)

The Edge Function creates a complete HTML page with:

```html
<html>
  <head>
    <title>Photo Title | GAAL Photo Contest</title>
    <meta name="description" content="...">
    <meta name="keywords" content="...">
    
    <!-- Open Graph for social media -->
    <meta property="og:image" content="[photo_url]">
    <meta property="og:title" content="...">
    
    <!-- JSON-LD structured data -->
    <script type="application/ld+json">
    {
      "@type": "ImageObject",
      "name": "Photo Title",
      "image": "[photo_url]",
      "creator": { "name": "Photographer Name" }
    }
    </script>
  </head>
  <body>
    <h1>Photo Title</h1>
    <img alt="Photo Title" title="Photo Title" src="[photo_url]" />
    <p>Photo description and metadata...</p>
  </body>
</html>
```

**Key SEO elements:**
- ✅ Semantic HTML (`<h1>` at top level)
- ✅ Image alt text and title
- ✅ Meta description
- ✅ Canonical URL
- ✅ JSON-LD schemas
- ✅ Open Graph tags
- ✅ Twitter Card tags

---

## Sitemap Updates

The sitemap function now:
1. Checks each approved photo for `seo_approved` flag
2. If `seo_approved=TRUE`: includes direct link to static HTML page
   - Priority: **0.8** (higher)
3. If `seo_approved=FALSE`: includes link to React route
   - Priority: **0.6** (lower)

Google will crawl high-priority static pages first, improving indexing speed.

---

## Optional: Add React Redirect

If you want photos to redirect to their static SEO pages when they exist, add this to your photo detail page:

**File**: [src/pages/PhotoDetail.tsx](src/pages/PhotoDetail.tsx) (or equivalent)

```tsx
useEffect(() => {
  if (submission?.seo_page_url && submission?.seo_approved) {
    // Redirect to static page for better SEO
    window.location.href = submission.seo_page_url;
  }
}, [submission?.seo_page_url, submission?.seo_approved]);
```

This ensures:
- Users always see the static page (fast, cached)
- Google crawls the static page directly
- No React JS overhead

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Edge Function invocations | FREE (1M/month included) |
| Storage for HTML files | FREE (~50-100 KB per page) |
| Database queries | FREE |
| **Total monthly cost** | **$0** |

---

## Monitoring & Debugging

### Check if trigger is working:
1. Supabase Dashboard → Database → submissions
2. Find a recently approved photo with `seo_approved=TRUE`
3. Check if `seo_page_generated` changed to TRUE
4. Check if `seo_page_url` has a value

### Check if file was uploaded:
1. Supabase Dashboard → Storage → `public-pages`
2. Should see folder: `seo-pages/{category}/{slug}/`
3. Should contain: `{slug}.html`

### Check Edge Function logs:
1. Supabase Dashboard → Edge Functions → `generate-seo-page`
2. Click function name
3. See "Invocations" tab with logs

---

## Rollback (If Needed)

If you need to undo everything:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS submission_seo_approved_trigger ON submissions;

-- Drop function
DROP FUNCTION IF EXISTS public.on_submission_seo_approved();

-- Remove columns (optional)
ALTER TABLE submissions DROP COLUMN seo_approved;
ALTER TABLE submissions DROP COLUMN seo_page_generated;
ALTER TABLE submissions DROP COLUMN seo_page_url;
```

Then:
- Delete the `generate-seo-page` Edge Function
- Delete files from `public-pages` Storage bucket (optional)

---

## Next Steps

1. ✅ **Done**: UI modifications in AdminSubmissions.tsx
2. ✅ **Done**: generate-seo-page Edge Function created
3. ✅ **Done**: sitemap Edge Function updated
4. 🔨 **TODO**: Run SQL scripts in Supabase
5. 🔨 **TODO**: Create Storage bucket
6. 🔨 **TODO**: Deploy Edge Functions
7. 🧪 **TODO**: Test with one photo
8. 📈 **TODO**: Monitor in Google Search Console

---

## Questions?

- SEO pages not generating? Check Edge Function logs
- Files not uploading? Verify Storage bucket is public
- Google not indexing? Check sitemap has correct URLs, wait 48 hours
- Trigger not firing? Verify database function exists with `\df` in SQL editor

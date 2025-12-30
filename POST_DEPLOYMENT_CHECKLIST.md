# Post-Deployment Checklist

After merging this PR and deploying the changes, follow these steps:

## 1. Deploy the Migration ✅
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Copy the entire contents of `supabase/migrations/20251230130553_483da5ee-121b-43be-be7a-75471ade0900.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify no errors in the output

## 2. Verify Migration Success ✅
Run these queries in SQL Editor:

```sql
-- Check columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'submissions' 
AND column_name IN ('seo_approved', 'seo_page_generated', 'seo_page_url');
-- Should return 3 rows

-- Check trigger exists
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'submission_seo_approved_trigger';
-- Should return 1 row

-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'on_submission_seo_approved';
-- Should return 1 row

-- Check HTTP extension
SELECT * FROM pg_extension WHERE extname = 'http';
-- Should return 1 row
```

## 3. Verify Storage Bucket ✅
- [ ] Go to Supabase Dashboard → Storage
- [ ] Check if bucket `public-pages` exists
- [ ] If not, create it:
  - Click "New bucket"
  - Name: `public-pages`
  - **Toggle ON: "Public bucket"**
  - Create

## 4. Verify Edge Function ✅
- [ ] Go to Supabase Dashboard → Edge Functions
- [ ] Verify `generate-seo-page` function exists
- [ ] If not deployed, deploy the function from `supabase/functions/generate-seo-page/index.ts`

## 5. Test the Complete Flow 🧪

### Test Step 1: Approve with SEO
- [ ] Log in to your app as admin
- [ ] Navigate to Admin Dashboard → Submissions
- [ ] Find a pending submission (or create a test submission)
- [ ] Click "Review" button
- [ ] Set Action dropdown to "Approve"
- [ ] ✅ **Check the box**: "Generate SEO page for Google indexing"
- [ ] Click "Approve" button
- [ ] Wait 5-10 seconds

### Test Step 2: Verify File Creation
- [ ] Go to Supabase Dashboard → Storage → `public-pages`
- [ ] Navigate to: `seo-pages/{category}/{contestSlug}/`
- [ ] **Expected**: See a file named `{photoSlug}.html`
- [ ] Click on the file to view/download it
- [ ] **Expected**: Should see a complete HTML page with the photo and SEO tags

### Test Step 3: Verify Database Updates
Run this query in SQL Editor (replace `SUBMISSION_ID` with your test submission's ID):

```sql
SELECT 
  id,
  title,
  seo_approved,
  seo_page_generated,
  seo_page_url
FROM submissions
WHERE id = 'SUBMISSION_ID';
```

**Expected results**:
- `seo_approved` should be `true`
- `seo_page_generated` should be `true`
- `seo_page_url` should contain a URL like: `https://...supabase.co/storage/v1/object/public/public-pages/seo-pages/...`

### Test Step 4: Verify URL Works
- [ ] Copy the `seo_page_url` from the query above
- [ ] Open it in a new browser tab
- [ ] **Expected**: Should see the static HTML page with the photo and all SEO elements

## 6. Monitor Logs 📊

### Check PostgreSQL Logs
- [ ] Go to Supabase Dashboard → Logs → Postgres Logs
- [ ] Look for messages containing "SEO page generation"
- [ ] **Success message**: `NOTICE: SEO page generation triggered for submission ...`
- [ ] **Error message** (if any): `WARNING: Failed to call generate-seo-page edge function ...`

### Check Edge Function Logs
- [ ] Go to Supabase Dashboard → Edge Functions → `generate-seo-page`
- [ ] Click on "Logs" or "Invocations" tab
- [ ] **Expected**: Should see recent invocations with success status
- [ ] Check for any errors or failures

## 7. Test Error Handling 🛡️

### Test that submission approval works even if edge function fails:
- [ ] Temporarily disable the `generate-seo-page` edge function (or rename it)
- [ ] Approve another submission with SEO checkbox
- [ ] **Expected**: Submission should still be approved successfully
- [ ] **Expected**: PostgreSQL logs should show WARNING message
- [ ] Re-enable the edge function

## 8. Optional: Verify Sitemap Updates 🗺️
- [ ] Access your sitemap URL (usually `/sitemap.xml` or via the sitemap edge function)
- [ ] **Expected**: SEO-approved submissions should appear with their static page URLs
- [ ] **Expected**: Priority should be 0.8 for SEO pages vs 0.6 for React routes

## 9. Production Deployment Notes 📝

### Before deploying to production:
- [ ] Backup your database
- [ ] Review the Supabase project URL in the migration file
- [ ] Ensure the URL matches your production Supabase project
- [ ] If different, update line 32 of the migration file before running

### After production deployment:
- [ ] Monitor edge function invocations for first 24 hours
- [ ] Check storage bucket usage
- [ ] Verify a few SEO pages manually
- [ ] Test sitemap includes new pages
- [ ] Check Google Search Console (after a few days) for indexing

## Troubleshooting 🔧

If something doesn't work, refer to:
- `SEO_FIX_DEPLOYMENT_GUIDE.md` - Complete troubleshooting guide
- `SEO_FIX_SUMMARY.md` - Architecture and implementation details

### Common Issues:

**Files not appearing in storage?**
- Check edge function logs for errors
- Verify storage bucket is public
- Check storage bucket policies

**Trigger not firing?**
- Verify HTTP extension is enabled
- Check PostgreSQL logs for WARNING messages
- Verify trigger exists in database

**Edge function not called?**
- Check Supabase project URL in trigger function
- Verify edge function is deployed
- Check PostgreSQL logs for errors

## Success Criteria ✅

Your deployment is successful when:
- [x] Migration runs without errors
- [x] Test submission generates HTML file in storage
- [x] Database fields are updated correctly
- [x] Static HTML page is accessible via URL
- [x] Logs show successful trigger execution
- [x] Sitemap includes SEO-approved pages

## Need Help?

If you encounter issues:
1. Check the troubleshooting sections in the documentation
2. Review PostgreSQL and edge function logs
3. Verify all prerequisites are met
4. Try the test flow with a simple submission first

---

**Note**: This checklist should be completed after merging the PR to your main branch and deploying the code to your Supabase project.

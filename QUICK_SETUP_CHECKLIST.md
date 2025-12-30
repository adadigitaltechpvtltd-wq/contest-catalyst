# Quick Setup Checklist

## Files Ready to Deploy ✅

| File | Status | Action |
|------|--------|--------|
| AdminSubmissions.tsx | ✅ DONE | Already updated in your workspace |
| generate-seo-page/index.ts | ✅ DONE | New function created, ready to deploy |
| sitemap/index.ts | ✅ DONE | Updated, ready to deploy |

---

## What You Need to Do (In Order)

### Phase 1: Database Setup (Run once in Supabase)

```
Open: Supabase Dashboard → SQL Editor

Copy ALL from: SUPABASE_SETUP_INSTRUCTIONS.md

Replace:
  - YOUR_PROJECT_ID → [Your Project ID from URL]
  - YOUR_SERVICE_ROLE_KEY → [From Settings → API → Service Role]

Execute all scripts
```

**Time**: ~5 minutes

### Phase 2: Storage Bucket

```
Go to: Supabase Dashboard → Storage

Create New Bucket:
  Name: public-pages
  Check: Make it public
  Create
```

**Time**: ~2 minutes

### Phase 3: Deploy Edge Functions

#### Function 1: generate-seo-page

```
Go to: Supabase Dashboard → Edge Functions

Create Function:
  Name: generate-seo-page
  
Copy file contents from:
  supabase/functions/generate-seo-page/index.ts

Paste into editor
Deploy
```

**Time**: ~3 minutes

#### Function 2: Update sitemap

```
Go to: Supabase Dashboard → Edge Functions → sitemap

Replace entire file with:
  supabase/functions/sitemap/index.ts

Deploy
```

**Time**: ~2 minutes

### Phase 4: Test (Optional but Recommended)

```
Go to: Admin Dashboard → Submissions

Find any pending submission
Click: Review

Select Action: Approve
Check: ☑ Generate SEO page for Google indexing
Click: Approve

Wait: 5-10 seconds

Check: Supabase Storage → public-pages → should see HTML file
```

**Time**: ~5 minutes

---

## Total Time: ~20 minutes

---

## After Setup

### For Each Photo You Want Indexed:

1. Go to Admin Dashboard
2. Find photo in Pending
3. Click "Review"
4. Select "Approve" from Action dropdown
5. **CHECK the box** "Generate SEO page for Google indexing"
6. Click "Approve"
7. ✅ Done! Static page is auto-generated and Google can crawl it

### For Photos You DON'T Want Indexed:

1-4. Same as above
5. **DON'T CHECK** the SEO box
6. Click "Approve"
7. Photo shows only in app, not on Google

---

## Documents

| Document | Purpose |
|----------|---------|
| SUPABASE_SETUP_INSTRUCTIONS.md | SQL scripts, step-by-step DB setup |
| IMPLEMENTATION_GUIDE_SEO_CONDITIONAL.md | Complete guide with diagrams and details |
| This file | Quick checklist |

---

## File Locations in Workspace

```
src/pages/admin/
  └─ AdminSubmissions.tsx          ← UI UPDATED
  
supabase/functions/
  ├─ generate-seo-page/
  │  └─ index.ts                   ← NEW FUNCTION
  ├─ sitemap/
  │  └─ index.ts                   ← UPDATED
  ├─ prerender/
  │  └─ index.ts                   ← (can keep or remove)
  └─ analyze-submissions/
     └─ index.ts                   ← (unchanged)
```

---

## Environment Variables

Check that these are set in Supabase Edge Functions:

- `SUPABASE_URL` ← Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` ← Your service role key

Usually pre-configured by Supabase, but verify at:
Supabase Dashboard → Edge Functions → Settings

---

## Questions?

**"What if the trigger doesn't fire?"**
→ Check Edge Function logs, verify SQL trigger exists in database

**"How do I verify the page was created?"**
→ Go to Storage → public-pages → seo-pages → should see folder with HTML file

**"Can I change my mind about SEO?"**
→ Yes, uncheck the SEO option when re-approving, new page won't be generated

**"Will old pages still work?"**
→ Yes, they stay in Storage and remain indexed until you delete them manually

**"Can I delete a SEO page?"**
→ Yes, go to Storage → find file → delete, then update sitemap by regenerating it

---

## Cost

**Total monthly cost: $0**

- Edge Function invocations: Free (1,000,000/month included)
- Storage: Free (500 MB included)
- Database: Free

You could approve 10,000 photos per month and still be completely free.

---

## Success Indicators

✅ **You'll know it's working when:**

1. Admin sees checkbox in approve modal
2. After checking box and approving, HTML file appears in Storage
3. File is viewable at URL: `https://YOUR-STORAGE-URL/seo-pages/{category}/{slug}/{slug}.html`
4. When you view page source, see `<h1>`, `<img alt="...">`, `<meta description>`, `<script type="application/ld+json">`
5. Sitemap includes the static page URL
6. Google Search Console shows the page is crawlable

---

## Next: Monitor in Google Search Console

After deploying:

1. Go to Google Search Console
2. Submit your sitemap: `https://gaal.app/functions/v1/sitemap`
3. Request indexing for photos with SEO enabled
4. Wait 24-48 hours for Google to crawl and index
5. Check Search Analytics to see impressions from Google Images

---

## Need Help?

Check these files in order:
1. SUPABASE_SETUP_INSTRUCTIONS.md ← For SQL errors
2. IMPLEMENTATION_GUIDE_SEO_CONDITIONAL.md ← For general questions
3. Your Edge Function Logs ← For execution errors

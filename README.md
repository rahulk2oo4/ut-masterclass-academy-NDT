# UT Masterclass Academy

**Tagline:** Ultrasonic Testing · Learn. Practise. Master.  
**Theme:** burnt orange, dark maroon, white.

Repository: https://github.com/rahulk2oo4/ut-masterclass-academy-NDT  
Expected GitHub Pages URL: https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/

A responsive static learning platform for conventional UT, immersion/squirter UT, PAUT, TOFD, and inspection practice. GitHub Pages hosts the static website; Supabase provides email authentication and cloud learner-progress storage.

## Deploy
1. Repository **Settings → Pages** → choose **GitHub Actions** as the source.
2. Push to `main` (the workflow is already present). Open **Actions** and confirm the deployment succeeds.
3. Visit the Pages URL above. Treat it as published only when the workflow succeeds and it loads.

## Supabase setup
The frontend configuration is already connected to the existing Supabase project using its public publishable key. The database migration `ut_masterclass_rls_alignment` has been applied, and the `profiles` and `course_progress` tables have RLS enabled with owner-only policies.
1. In Supabase **Authentication → URL Configuration**, set the Site URL to the published Pages URL and allow `https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/`.
2. Enable email/password sign-in and email confirmation; test signup, verification, password reset and sign-in.
3. Test progress sync after logging in and check data isolation with a second account.

## Security
- The browser uses a Supabase publishable key; this is not a service-role secret.
- Never put a service-role key or database password in GitHub.
- RLS restricts learner profile/progress rows to the authenticated owner's ID.
- Course content is public. Do not store private training/customer data in the repository.

## Course scope
The app has 24 classes across seven phases. Each class includes objectives, prerequisite knowledge, notes, terminology, example, practical activity, common-mistake guidance, source note and a five-question quiz. Qualified UT/PAUT/TOFD technical review is required before formal release.

This resource does not provide accredited NDT personnel certification or authorisation to inspect production parts independently. Real inspections must follow the applicable approved procedure, governing standards, employer requirements and qualified supervision.

## Remaining release checks
- Enable GitHub Pages if not already enabled and verify the workflow passes.
- Configure Supabase auth redirect URL and verify real email flows.
- Phone OTP and admin lesson editor are not implemented in this version.

## Current interactive sections
- Formula Library: 23 searchable formulas with method/subject/difficulty filters, variable definitions and units, assumptions, worked examples, interactive calculators, local/cloud bookmarks, printing, and text-note export.
- NDT Methods: educational overview of UT, PAUT, TOFD, RT, MT, PT, ET, VT, AE, and IRT.
- Knowledge Centre: 18 topic categories spanning UT fundamentals, calibration, signal views, automated inspection, composites, reporting, and safety.
- Videos: supplementary video-search links grouped by topic.
- Practice Quizzes: mixed-method questions with explanations; the practice target is 50%.
- Registration profile: full name, learner category, and optional date-of-birth profile field. Date of birth is stored only when provided.

## Implementation note
The existing repository is a single-page static HTML/JavaScript application, not the React + TypeScript + Vite stack described in the original project brief. The new sections extend the working application incrementally to avoid discarding existing lesson and Supabase progress functionality. A full React migration, database-driven CMS, secure admin editor, formal final examination, and server-verified certificate workflow remain separate implementation stages.

## Deployment and configuration

This repository currently uses the existing single-page HTML/JavaScript app with GitHub Actions and GitHub Pages. It does **not** currently contain a React + TypeScript + Vite build, so the implementation has been extended incrementally rather than replacing the working lesson experience.

1. In GitHub, open **Settings → Pages** and set the build/deployment source to **GitHub Actions**.
2. Check the latest run under **Actions → Deploy academy to GitHub Pages**. The workflow validates the JavaScript files, copies the required static assets, and deploys the artifact.
3. The expected project URL is `https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/`. If a 404 persists after a successful deploy, check the URL shown in **Settings → Pages**, confirm the repository Pages source is GitHub Actions, and allow a few minutes for the first deployment to propagate.
4. The current static app reads its public Supabase URL and publishable key from `supabase-config.js`. The publishable key is designed for browser use; database access must remain protected by RLS. Never put a Supabase service-role/secret key in browser code or GitHub.
5. Database schema and migrations are under `supabase/schema.sql` and `supabase/migrations/`; repeatable starter content is in `supabase/seed.sql`. The connected Supabase project has the academy content, bookmark, exam and certificate tables, with RLS enabled.

### Supabase administrator setup

The CMS is visible only to an account whose **trusted Auth app metadata** includes `role: "admin"`. A client-editable profile field is deliberately not used for authorization. To authorize your own verified account, open the Supabase SQL Editor and run the following after replacing the email with the exact account you intend to administer:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'YOUR_VERIFIED_SIGNUP_EMAIL';
```

Then sign out and sign back in so the session receives the updated claim. Keep admin assignment restricted to trusted project administrators.

### Final exam and certificates

- The server-side final exam draws 50 randomized questions per attempt from a 60-question mixed-method bank, with a 60-minute time limit, a 50% pass mark, and at most two attempts.
- The exam service checks that all 24 existing lessons and lesson quizzes are marked complete before starting.
- The answer key remains in the Supabase Edge Function; scoring and certificate issuance occur server-side.
- Successful learners receive a unique Academy course-completion certificate. Use the certificate page's **Print / Save as PDF** action to save a PDF, and use the QR code/public verification page to check status.
- Certificates can be revoked by an authorized admin. Academy certificates are educational records and do **not** grant ASNT, ISO 9712 or other external personnel certification.

### Environment template

`.env.example` documents public configuration names for a future Vite migration. The current static site uses `supabase-config.js`; no real secrets belong in `.env.example`.

### Instructor practical assessment and remaining security setting

The admin CMS includes an instructor checklist and assessment status (pending, passed, or needs review), learner progress review, quiz/question editing with a separately protected answer-key table, resource uploads, and certificate revocation. Admin UI access requires the trusted `app_metadata.role = "admin"` claim described above.

The Supabase security advisor currently reports one remaining configuration warning: **Leaked Password Protection is disabled**. Enable it in the Supabase Dashboard under **Authentication → Password Security** (the exact label may vary) to reject passwords known to have been compromised. This is a project Auth setting that was not available through the connected database tools.

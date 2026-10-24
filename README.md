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

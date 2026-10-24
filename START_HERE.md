# Start here — GitHub Pages + Supabase

## GitHub repository
Repository: https://github.com/rahulk2oo4/ut-masterclass-academy-NDT

Expected Pages URL after a successful deployment:
https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/

## 1. Enable GitHub Pages
1. Open repository **Settings → Pages**.
2. Under Build and deployment, select **GitHub Actions**.
3. Open **Actions** and confirm the workflow named **Deploy UT Masterclass Academy to GitHub Pages** succeeds.
4. Then open the expected URL above. It is not considered live until the workflow succeeds and the site loads.

## 2. Supabase is connected in the source code
The current app config points to your existing Supabase project. The publishable key is safe for browser use; row-level security on progress/profile tables controls learner access.

The Supabase migration `ut_masterclass_rls_alignment` has been applied. RLS is enabled on `profiles` and `course_progress`; security/performance advisor checks returned no lints at the time of verification.

## 3. Configure auth redirect URLs
In Supabase **Authentication → URL Configuration**:
- Set **Site URL** to the published Pages URL above.
- Add that exact URL to the allowed redirect URLs:
  `https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/`
- Enable email/password provider and email confirmation.
- Test registration, email verification, sign-in, password recovery, and sign-out on the deployed domain.

If email delivery is unreliable, configure custom SMTP under Authentication email settings.

## 4. Test cloud progress
1. Register a test email, click the verification link, then sign in.
2. Mark a lesson complete and submit a quiz.
3. Check that your signed-in account's row updates in `public.course_progress`.
4. Sign in with a second test account and confirm it cannot read the first account's progress.

## Important limits
- SMS phone OTP is not implemented in this static version; it requires a phone-auth flow and an SMS provider.
- The admin content-management interface is not included yet.
- Never commit a Supabase service-role/secret key or database password.
- Course notes are educational summaries and need qualified UT/PAUT/TOFD review before use as formal or operational training.

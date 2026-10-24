# Build status — UT Masterclass Academy

## Implemented in GitHub repository
- Responsive static course app with burnt-orange, dark-maroon and white theme.
- 24 clickable class modules across seven learning phases.
- Five-question knowledge check per class (120 total question slots), scoring and feedback.
- Local progress and notes using browser storage.
- Supabase email/password sign-up and sign-in code, email confirmation handling, password recovery and updated-password flow.
- Cloud progress/profile integration adapted to the existing Supabase tables.
- GitHub Actions workflow for GitHub Pages.
- Setup documentation and course disclaimer.

## Supabase status
- Connected frontend config to the existing project using its public publishable key.
- Applied migration `ut_masterclass_rls_alignment`.
- Confirmed `public.profiles` and `public.course_progress` exist and have RLS enabled.
- Verified owner-only SELECT/INSERT/UPDATE policies for profiles and progress.
- Security and performance advisors returned no lints at the last check.
- No real learner/test account has been used to perform end-to-end auth testing yet.

## Remaining release checks
- In repository **Settings → Pages**, choose **GitHub Actions** as source and confirm the workflow passes.
- In Supabase **Authentication → URL Configuration**, set the Site URL to `https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/` and allow that redirect URL.
- Test sign-up, verification email, sign-in, reset password, cloud progress, and data isolation with separate test accounts.
- Phone OTP is not implemented; it requires a dedicated phone-auth flow and SMS provider configuration.
- An administrator lesson-management UI is not included.
- Have a qualified UT/PAUT/TOFD instructor review the lessons and quiz answers before formal training use.

Completion of this educational resource does not grant accredited NDT personnel certification or independent inspection authorisation.

# UT Masterclass Academy

**Tagline:** Ultrasonic Testing · Learn. Practise. Master.  
**Theme:** burnt orange, dark maroon, white.

A responsive static learning platform for conventional UT, immersion/squirter UT, PAUT, TOFD, and inspection practice. Hosted on GitHub Pages; Supabase provides optional real authentication and cloud learner-progress storage.

## Deploy to GitHub Pages
1. Ensure the repo is public if using GitHub Free Pages.
2. In repository **Settings → Pages**, set the source to **GitHub Actions**.
3. Push changes to \`main\`. The included workflow validates required files and deploys the site.
4. After a successful workflow, GitHub Pages displays the published URL in **Settings → Pages**.

## Configure Supabase
1. Create a Supabase project.
2. Open **SQL Editor** and execute \`supabase/schema.sql\`.
3. Open \`supabase-config.js\` and replace \`https://YOUR-PROJECT.supabase.co\` with your project URL and \`YOUR_SUPABASE_PUBLISHABLE_KEY\` with your project publishable key (legacy anon key is supported if needed).
4. In Supabase **Authentication → URL Configuration**, set the site URL to the published Pages URL and add that URL (and the relevant email-confirmation/reset redirect) to the allowed redirect URLs.
5. Enable email/password sign-in and email confirmation. Configure SMTP for reliable production email delivery where required.
6. Register a test account, verify email, sign in, complete a quiz and check that \`public.course_progress\` is updated. Confirm that a second account cannot access the first account's data.
7. SMS phone OTP is not implemented in this static version; it requires an SMS provider and an explicit phone-auth flow.

## Security notes
- Only the Supabase publishable/anon key belongs in browser code. **Never** put a service-role key or database password into GitHub.
- Row-level security restricts each learner's progress and profile to their own authenticated user ID.
- GitHub Pages is a static host. Course content is public; do not place private training/customer data in the repository.
- Email verification and cloud sync are not active until Supabase is configured and tested.

## Course content and scope
The app has 24 classes across seven phases. Each class includes objectives, prerequisite knowledge, notes, terms, a worked-example prompt, practical activity, common mistake, source note and a five-question quiz. The class pages are educational summaries; have a qualified UT/PAUT/TOFD reviewer verify technical details and quiz keys before release.

This resource does not provide accredited NDT personnel certification or authorisation to inspect production parts independently. Real inspections must follow the applicable approved procedure, governing standards, employer requirements and qualified supervision.

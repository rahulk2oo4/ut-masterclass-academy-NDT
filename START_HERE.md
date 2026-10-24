# Start here — GitHub Pages + Supabase

## 1. Publish the website
- Open this repository's **Settings → Pages**.
- Under Build and deployment, select **GitHub Actions**.
- The workflow in \`.github/workflows/deploy-pages.yml\` runs after each push to \`main\`.
- Open **Actions** and wait for the workflow run to complete. Then copy the deployed URL from **Settings → Pages**.

## 2. Connect Supabase
- Create a Supabase project.
- Execute \`supabase/schema.sql\` in Supabase **SQL Editor**.
- Update \`supabase-config.js\` with your project URL and public publishable key.
- Commit the configuration file to GitHub.
- Add the published GitHub Pages URL to Supabase **Authentication → URL Configuration**; enable email/password and email confirmation.
- Test signup, email confirmation, password reset, sign-in, quiz score sync, and row-level security with two separate learner accounts.

## Important
- The website can show lessons in local preview mode before Supabase is configured.
- Cloud progress sync requires a verified account and the schema/configuration above.
- Phone OTP is not implemented until you configure an SMS provider and build/test the phone flow.
- Never commit a Supabase service-role key, database password, or private credentials.

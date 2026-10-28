# NDT Masterclass Academy

**Tagline:** Ultrasonic Testing · Learn. Practise. Master.  
**Theme:** burnt orange `#C65D24`, dark maroon `#4A1020`, deep maroon `#2D0A14`, white and warm white.

- **Live website:** https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/
- **GitHub repository:** https://github.com/rahulk2oo4/ut-masterclass-academy-NDT
- **Supabase project:** `mwpinxnqrzomsonspyxk`

## Current website capability

The deployed root app is an existing static HTML/CSS/JavaScript application. The current course and exam extension preserves the Formula Library and existing method catalogue rather than replacing the main application.

- **24 NDT methods:** VT, PT, MT, RT, UT, PAUT, TOFD, ET, IRT, LT, AE, guided wave, MFL, shearography, GPR, neutron radiography, DR, LUT, CT, DIC, microwave, terahertz, robotic/automated NDT, and AI-assisted interpretation.
- **Method lesson pages:** 25 topic pages per method, rendered with objectives, principles, equipment, workflow, limitations, interpretation, examples, applicable formula references, safety, terminology and summary sections.
- **Formula Library:** the dedicated `formula-library.js` is loaded from the main app. Worked examples are calculated using the same formula functions as the interactive calculators and are visible without opening the formula detail panel.
- **Learning progress:** local browser progress, optional explicit sync to a learner account, and per-method Supabase lesson records protected by row-level security.
- **Practice Centre:** configurable filters for method, topic, subtopic, difficulty, type and question count. Its current question bank is generated from the method/topic metadata. Written-response checking is approximate.
- **Final exams:** a dedicated 100-question server-generated bank per method; 30/60/90/120-minute options; question navigation, flagging, saved answers/resume, server-side score calculation, 50/100 educational pass mark, history, review and retakes.
- **Educational completion records:** course-specific issue after all required lesson markers are saved to the account and a passing exam is submitted. A server-side Edge Function creates the certificate record. The private PDF download and public reference verification use separate deployed Edge Functions.
- **My Learning / Certificates:** per-method learning status, exam history, issued educational certificates, PDF download and a public verification page.

## Backend and data access

The site uses the Supabase public browser key only. The service-role key remains in Supabase Edge Function secrets and is not embedded in the website.

Deployed Edge Functions:

| Function | Access | Purpose |
|---|---|---|
| `final-exam` | Authenticated | Method eligibility, 100-question attempt, answer autosave/resume, scoring, history and certificate eligibility/issuance |
| `certificate-pdf` | Authenticated | Check certificate ownership and generate a private PDF download |
| `verify-certificate` | Public reference lookup | Verify a certificate reference and return its limited verification fields |

The database includes `academy_method_lesson_progress` with RLS policies scoped to `auth.uid()`. Course certificate records store course-completion and final-examination dates. Exam scoring and certificate eligibility are checked server-side, not accepted from browser-submitted scores.

## Important release limitations

The current implementation is a working development integration, **not yet ready to be described as a fully validated NDT examination or a complete professional training product**.

1. The 100-question banks are generated from the course metadata and shared question templates; they are not individually authored and validated by a qualified NDT subject-matter expert. They need technical review, answer-key verification and de-duplication before serious exam-preparation use.
2. The 25 lesson pages now have a consistent instructional structure, but many sections are generated from the current method descriptions and topic metadata. They are not 600 separately peer-reviewed, textbook-depth lessons.
3. The practice bank generates 9 core practice formats/items per topic lesson (plus supported formula questions), below the prompt's target of 15–25 questions per substantial lesson. Do not describe every topic bank as complete.
4. Code syntax and database/policy configuration have been inspected. A signed-in browser-level end-to-end test (sign-up, lesson completion, exam save/resume, submit/review, PDF generation and public verification) has not been completed in this environment.
5. An advisor check reports **Leaked Password Protection Disabled** in Supabase Auth. An administrator should consider enabling it in Authentication settings.
6. Educational certificate completion is not ASNT/ISO certification, employer authorisation, regulatory qualification, or proof of independent inspection competence.

## Deploy and verify

GitHub Actions publishes the static website through GitHub Pages. Confirm the latest workflow run at:
https://github.com/rahulk2oo4/ut-masterclass-academy-NDT/actions

In Supabase **Authentication → URL Configuration**, confirm the site URL and redirect allow-list include:
`https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/`

Use a dedicated test account and verify each flow before public release. Never place a service-role key, database password or private/customer inspection data in the repository.

## Educational disclaimer

The academy is a self-learning theory resource. Learners must follow applicable codes, standards, written procedures, safety controls and required supervision/authorisation for real inspection work. A course assessment does not confer an external personnel certification.

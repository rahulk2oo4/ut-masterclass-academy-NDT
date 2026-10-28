# NDT Masterclass Academy — Theory Learning Edition

This is a standalone first build in `academy-v2/`. It does not replace files in the repository root.

## Open locally
Open `index.html` in a modern browser. The page is a self-contained HTML/CSS/JavaScript prototype and does not require a build step.

## Included in this prototype
- Dashboard with eight NDT theory pathways: UT, PAUT, TOFD, RT, ET, MT, PT/LPT and VT, each with a 25-lesson curriculum (200 method lessons total).
- Method lesson navigation, browser-local lesson completion tracking, and account-based cloud progress sync.
- Theory lessons covering key concepts across all eight methods; UT currently has the most developed lesson text.
- Six educational formula calculators.
- Practice-question interface.
- Supabase-backed email/password sign-up and sign-in, learner profile sync, and per-user lesson progress stored under row-level security.
- Method-specific final examinations backed by the existing Supabase Edge Function: 100 server-generated method questions, a 120-minute attempt, server-side scoring, 50% pass mark, answer autosave, expiry submission, and eligibility-checked certificate records.
- Simple educational certificate print layout with completion date and marks; it deliberately avoids displaying a certificate ID or QR code.
- Maroon/orange/white academy theme.

## Current limitations — do not treat as production-ready
- Lessons provide a structured theory baseline; a qualified NDT subject-matter expert should review each method, explanation, and question against the applicable written practice and standards.
- The final-exam service constructs 100 distinct question records per method from a 25-topic blueprint, but question generation and technical content still require independent subject-matter review before formal educational use. Practice rounds use a smaller static sample bank.
- Final exam attempts, answer keys, scores, and certificate eligibility are handled by the Supabase Edge Function. The printable certificate view in this frontend is a local educational rendering; it is not a regulatory qualification or proof of practical competence.
- The app is a theory-learning tool only. It does not assess practical inspection skills and does not issue official NDT personnel certification.
- Formula calculators are educational demonstrations and need validation against defined units, assumptions and technical references before release.

## Before public release
1. Complete and technically review every lesson.
2. Independently validate the 100 generated questions per method, including answer explanations, technical accuracy and balanced coverage.
3. Have a qualified NDT subject-matter expert review the generated exam bank and lesson content. Keep the server-side scoring and eligibility checks enabled.
4. Add automated tests for navigation, progress gating, timer/refresh behaviour, formulas, answer selection, pass/fail and printing.
5. Enable leaked-password protection in Supabase Auth, then test sign-up, email verification, sign-in, progress sync, all eight exams, timeout handling, certificate records, and printing.
6. Test on mobile and desktop and verify the published GitHub Pages URL; deployment has not been confirmed from this code review.

## Design
Theme: dark maroon `#4A1020`, deep maroon `#2D0A14`, burnt orange `#C65D24`, soft orange `#F4B183`, warm white `#FFF8F3`.

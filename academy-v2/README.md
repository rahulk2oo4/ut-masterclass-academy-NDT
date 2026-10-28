# NDT Masterclass Academy — Theory Learning Edition

This is a standalone first build in `academy-v2/`. It does not replace files in the repository root.

## Open locally
Open `index.html` in a modern browser. The page is a self-contained HTML/CSS/JavaScript prototype and does not require a build step.

## Included in this prototype
- Dashboard with eight NDT theory pathways: UT, PAUT, TOFD, RT, ET, MT, PT/LPT and VT.
- Method lesson navigation and browser-local lesson completion tracking.
- Theory lessons covering key concepts across all eight methods; UT currently has the most developed lesson text.
- Six educational formula calculators.
- Practice-question interface.
- Method-specific exam selection, lesson-completion gating, 120-minute timer, browser-local answer persistence, automatic submission on expiry, and educational certificate print layout.
- Maroon/orange/white academy theme.

## Current limitations — do not treat as production-ready
- Several method lessons are still introductory theory content and require expert review, expansion, and references to applicable standards where licensed.
- The current question sets are development samples; they are **not yet 100 unique, technically validated questions per method**. Do not use the current score as a qualification or competency result.
- Exam results and certificates are stored in the browser and can be edited by the user. No Supabase authentication, database, row-level security, server-side scoring, or secure certificate validation is connected.
- The app is a theory-learning tool only. It does not assess practical inspection skills and does not issue official NDT personnel certification.
- Formula calculators are educational demonstrations and need validation against defined units, assumptions and technical references before release.

## Before public release
1. Complete and technically review every lesson.
2. Build and independently validate 100 unique questions per method, with answer explanations and balanced coverage.
3. Add Supabase authentication and persistence; implement server-side exam scoring and certificate eligibility if verified results are required.
4. Add automated tests for navigation, progress gating, timer/refresh behaviour, formulas, answer selection, pass/fail and printing.
5. Test on mobile and desktop and verify the published GitHub Pages URL.

## Design
Theme: dark maroon `#4A1020`, deep maroon `#2D0A14`, burnt orange `#C65D24`, soft orange `#F4B183`, warm white `#FFF8F3`.

# Build Status — NDT Masterclass

**Current phase:** course, progress, examination and educational-certificate integration added; technical-content validation and authenticated browser acceptance testing remain open.

## Implemented in repository

- Root static site preserved; existing formula library and calculator UI retained.
- 24 methods available in the existing catalogue.
- 25 topic-based lesson views per method (600 method/topic combinations), with structured sections for objectives, core principles, equipment, workflow, capability/limitations, interpretation, case example, formula references where relevant, mistakes, safety/quality, terminology and summary.
- Lesson completion can be saved locally and synced to a signed-in learner account.
- Method lesson progress uses `public.academy_method_lesson_progress`, with row-level security enabled and four owner-scoped policies.
- Practice Centre retains method/topic/subtopic/difficulty/type/count filters and nine generated practice formats, including multiple-select, matching, fill-in and short-response self-checks.
- Server-side final-exam Edge Function deployed at version 8. It builds a dedicated 100-item bank for each supported method; starts timed attempts; supports answer autosave/resume; validates attempt ownership and question IDs; blocks duplicate submissions; scores on the server; applies 50/100; and returns topic performance and answer review after submission.
- Public certificate verification Edge Function deployed at version 2.
- Authenticated private certificate-PDF Edge Function deployed at version 2. PDF records show course-completion date, final-exam date, score, issue date, reference ID and the requested educational disclaimer.
- Course dashboard, Final Examinations, My Learning, Certificates, attempt history, review, retake and verification navigation wired into the root app.
- GitHub Pages workflow configured. JavaScript syntax has been checked for both inline scripts and `method-exam-ui.js`.

## Supabase verification

- Migration added the method-specific progress table and certificate date columns.
- SQL verification confirmed the lesson-progress table exists, RLS is enabled, four policies exist, and both certificate date columns are present.
- Duplicate active-certificate index introduced during the migration work was removed; the existing active-user/course uniqueness index remains.
- Security advisor: warning `auth_leaked_password_protection` — leaked-password protection is disabled.
- Performance advisor currently reports unused indexes (informational); no further index cleanup was performed because the existing schema includes multiple legacy tables/features.

## Exam and certificate status

| Requirement | Current status |
|---|---|
| 100 questions per method | Implemented as generated method-topic question banks; not yet SME validated |
| 50/100 pass mark | Implemented in server scoring code; browser-level 49/100 and 50/100 acceptance tests still required |
| Question order randomisation | Implemented |
| Question navigation, flagging, unanswered state | Implemented in UI |
| Answer autosave/resume | Implemented through authenticated Edge Function; needs browser test |
| Per-method lesson completion gating | Server checks 25 cloud lesson markers for that method |
| Result review and explanation | Implemented after server submission |
| Retake and attempt history | Implemented |
| Certificate issuance | Server-side eligibility and record insertion implemented; real passing attempt not exercised here |
| Private PDF generation/download | Function deployed; not tested with a live authenticated certificate |
| Public certificate verification | Function and verification page wired; real issued reference not exercised here |

## Known content gaps

- The generated 100-question banks use four shared item patterns per topic and are not individually authored. They should **not** be marketed as official, ASNT/ISO-equivalent, or validated examination questions.
- Lesson pages have a richer reusable structure, but not all content reaches the full textbook-depth requirement yet. The pages must be expanded with method-specific worked calculations, distinct real-world case studies, verified source notes, full lesson-specific quizzes and review by qualified NDT specialists.
- Current practice generation provides nine core items per lesson topic (formula items where available), below the target of 15–25 meaningful questions for substantial lessons.
- This environment could verify source syntax, database schema/policies and Edge Function deployment metadata, but not perform a signed-in browser end-to-end test or complete a real certificate cycle. The latest GitHub Pages workflow must show success before live deployment should be called verified.

## Release checklist

1. Wait for and confirm the latest GitHub Actions workflow succeeds, then open the deployed site in a browser.
2. Test auth using a dedicated learner account and confirm the Site URL/redirect allow-list.
3. Mark a lesson complete; confirm it is persisted under that user in Supabase and stays separate from another account.
4. Complete all 25 topics for a test method; verify exam unlocks only for that method.
5. Test 49/100 = fail and 50/100 = pass in a controlled test path, plus timeout, autosave/resume, duplicate submit, history and review.
6. Generate a test certificate, verify PDF dates/disclaimer, download it, and verify the public reference.
7. Have a qualified NDT reviewer check method content, unique question quality, calculations, correct answers, sources and standards-related wording.
8. Consider enabling leaked-password protection in Supabase Auth before public use.

**Certification disclaimer:** This site provides educational learning records only. It does not issue ASNT, ISO personnel certification, employer authorisation, regulatory qualification, or independent inspection competence.

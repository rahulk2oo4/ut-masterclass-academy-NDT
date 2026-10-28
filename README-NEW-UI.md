# NDT Masterclass Academy — New UI preview

This branch introduces a redesigned responsive interface using the repository's existing static-site approach, keeping it compatible with GitHub Pages.

- **Branch:** `new-ui-redesign`
- **New entry point:** `index.html`
- **Preserved previous entry point:** `legacy-index.html`

## Stack
- HTML, CSS and JavaScript (static GitHub Pages-compatible app)
- Existing public Supabase browser configuration in `supabase-config.js`
- Existing course/method data in `academy-data.js`
- Supabase Auth for sign-in, sign-up and password recovery
- Supabase PostgreSQL for signed-in lesson progress and practice attempt sync
- Browser localStorage for guest progress and attempts

## Included in this redesign pass
- New maroon, burnt-orange and white responsive layout
- Home dashboard and eight primary NDT method cards
- Method syllabus pages and direct Start Lesson navigation
- Query-based deep lesson URLs, e.g. `?view=lesson&method=ut&lesson=0`
- Previous/next lesson navigation and completion tracking
- Searchable formula library with interactive calculators
- 25-question practice sessions with explanations and fresh question selection
- Supabase authentication and progress sync
- Links to the preserved legacy examination and certificate implementation

## Supabase integration
The frontend uses the existing publishable key only; it does not use a service-role key. It reuses the RLS-protected tables:
- `academy_method_lesson_progress`
- `academy_quiz_attempts`

Local progress remains available if a cloud sync fails. The application logs sync errors to the browser console.

## Review notes
This is a new UI implementation pass, not a claim that every feature in the master specification is complete. Formal exams and certificates currently link to the preserved legacy implementation. Review the branch and run production checks before merging it into `main`.

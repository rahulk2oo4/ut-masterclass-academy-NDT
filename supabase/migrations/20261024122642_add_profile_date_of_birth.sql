-- Add optional date of birth for newly registered learner profiles.
alter table public.profiles add column if not exists date_of_birth date;

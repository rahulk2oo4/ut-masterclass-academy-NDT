-- Add optional learner date of birth for registration profiles.
-- Safe and additive: existing profile rows remain valid.
alter table public.profiles
  add column if not exists date_of_birth date;

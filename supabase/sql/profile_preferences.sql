-- Preferenze utente su public.profiles (JSONB).
-- Esegui nel SQL Editor Supabase dopo roles_profiles_assignment.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.preferences IS
  'Preferenze UI per utente, es. defaultAssignScope: "all" | "mine".';

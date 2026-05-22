-- Preferenze utente su public.profiles (JSONB).
-- Esegui nel SQL Editor Supabase dopo roles_profiles_assignment.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.preferences IS
  'Preferenze UI per utente (defaultAssignScope, defaultHomePage, defaultRequestsView, …).';

-- Gli utenti non-admin non possono UPDATE profiles (RLS admin-only).
-- Salvataggio preferenze via funzione SECURITY DEFINER sul proprio profilo.
CREATE OR REPLACE FUNCTION public.update_my_preferences (prefs jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET preferences = COALESCE(prefs, '{}'::jsonb)
  WHERE user_id = auth.uid()
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found or inactive';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_preferences (jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_preferences (jsonb) TO authenticated;

-- Immagine profilo (avatar) su public.profiles.
-- Esegui nel SQL Editor Supabase dopo profile_preferences.sql. Rieseguibile.
--
-- La chiave identifica un'immagine del set integrato nell'app
-- (public/avatars/*.svg, catalogo in lib/avatars.ts). Colonna dedicata e non
-- dentro `preferences` perché deve essere leggibile dagli altri membri del
-- team tramite le select su profiles già consentite da RLS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_key text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_avatar_key_length'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_key_length
      CHECK (avatar_key IS NULL OR length(avatar_key) <= 40);
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.avatar_key IS
  'Chiave immagine profilo del set integrato (es. saturno, luna). NULL = iniziale.';

-- Gli utenti non-admin non possono UPDATE profiles (RLS admin-only):
-- salvataggio via funzione SECURITY DEFINER sul proprio profilo.
CREATE OR REPLACE FUNCTION public.update_my_avatar (key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF key IS NOT NULL AND length(key) > 40 THEN
    RAISE EXCEPTION 'Invalid avatar key';
  END IF;

  UPDATE public.profiles
  SET avatar_key = NULLIF(btrim(key), '')
  WHERE user_id = auth.uid()
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found or inactive';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_avatar (text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_avatar (text) TO authenticated;

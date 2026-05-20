-- Ruoli minimi + profili utente + assegnazione richieste + tipo attività
-- Esegui nel SQL Editor Supabase (PostgreSQL 15+ per ADD VALUE IF NOT EXISTS su ENUM).
--
-- Prima esecuzione: ordine naturale dall’alto verso il basso.
--
-- IMPORTANTE dopo il backfill: promuovere almeno un admin, esempio:
--   UPDATE public.profiles
--     SET role = 'admin'::public.app_role
--     WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- ---------------------------------------------------------------------------
-- ENUM ruolo applicativo
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'operator');

-- ---------------------------------------------------------------------------
-- Profilo (sincrono con auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'operator'::public.app_role,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE INDEX profiles_active_idx ON public.profiles (is_active)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.profiles_set_updated_at ()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.profiles_set_updated_at ();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_admin (uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = uid
      AND p.role = 'admin'::public.app_role
      AND p.is_active = true
  );
$$;

CREATE POLICY "profiles_authenticated_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Nessun INSERT client: solo trigger su auth.users

CREATE POLICY "profiles_authenticated_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "profiles_authenticated_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin (auth.uid()))
  WITH CHECK (public.is_active_admin (auth.uid()));

CREATE POLICY "profiles_authenticated_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- Trigger: nuovo utente → riga profilo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'Utente'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- Backfill profili per utenti già presenti
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (user_id, email, full_name, role, is_active)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(COALESCE(u.email, ''), '@', 1),
    'Utente'
  ),
  'operator'::public.app_role,
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- ---------------------------------------------------------------------------
-- Colonne assegnazione su requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS requests_assigned_user_id_idx
  ON public.requests (assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Estensione enum attività
-- ---------------------------------------------------------------------------
ALTER TYPE public.request_activity_type ADD VALUE IF NOT EXISTS 'assigned_user_changed';

GRANT EXECUTE ON FUNCTION public.is_active_admin (uuid) TO authenticated;

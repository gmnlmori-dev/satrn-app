-- Team isolation v1 — esegui nel SQL Editor Supabase DOPO:
--   roles_profiles_assignment.sql
--   profile_preferences.sql
--   request_activities.sql
--   inbox_items.sql
--
-- Crea team "Generale", backfill team_id, helper RLS, policy per team.

-- ---------------------------------------------------------------------------
-- Tabella teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teams_slug_idx ON public.teams (slug);
CREATE INDEX IF NOT EXISTS teams_active_idx ON public.teams (is_active)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.teams_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teams_set_updated_at ON public.teams;

CREATE TRIGGER teams_set_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.teams_set_updated_at();

-- ---------------------------------------------------------------------------
-- Colonne team_id (nullable fino a backfill)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_id uuid
    REFERENCES public.teams (id) ON DELETE RESTRICT;

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS team_id uuid
    REFERENCES public.teams (id) ON DELETE RESTRICT;

ALTER TABLE public.inbox_items
  ADD COLUMN IF NOT EXISTS team_id uuid
    REFERENCES public.teams (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS profiles_team_id_idx ON public.profiles (team_id);
CREATE INDEX IF NOT EXISTS requests_team_id_idx ON public.requests (team_id);
CREATE INDEX IF NOT EXISTS inbox_items_team_id_idx ON public.inbox_items (team_id);

-- ---------------------------------------------------------------------------
-- Backfill team "Generale"
-- ---------------------------------------------------------------------------
INSERT INTO public.teams (name, slug)
VALUES ('Generale', 'generale')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.profiles
SET team_id = (SELECT id FROM public.teams WHERE slug = 'generale' LIMIT 1)
WHERE team_id IS NULL;

UPDATE public.requests
SET team_id = (SELECT id FROM public.teams WHERE slug = 'generale' LIMIT 1)
WHERE team_id IS NULL;

UPDATE public.inbox_items
SET team_id = (SELECT id FROM public.teams WHERE slug = 'generale' LIMIT 1)
WHERE team_id IS NULL;

-- Verifica: tutti devono essere 0 prima di NOT NULL
-- SELECT COUNT(*) FROM public.profiles WHERE team_id IS NULL;
-- SELECT COUNT(*) FROM public.requests WHERE team_id IS NULL;
-- SELECT COUNT(*) FROM public.inbox_items WHERE team_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.requests
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.inbox_items
  ALTER COLUMN team_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Helper RLS (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.team_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_same_team(target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_admin(auth.uid())
    OR (
      target_team_id IS NOT NULL
      AND target_team_id = public.current_user_team_id()
    );
$$;

CREATE OR REPLACE FUNCTION public.request_in_user_team(p_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.requests r
    WHERE r.id = p_request_id
      AND public.is_same_team(r.team_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_team_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_same_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_in_user_team(uuid) TO authenticated;

-- Nuovo utente Auth → team Generale di default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_team_id uuid;
BEGIN
  SELECT id INTO default_team_id
  FROM public.teams
  WHERE slug = 'generale'
  LIMIT 1;

  INSERT INTO public.profiles (user_id, email, full_name, team_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'Utente'
    ),
    default_team_id
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS: teams
-- ---------------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_authenticated_select" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_delete" ON public.teams;

CREATE POLICY "teams_authenticated_select"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    public.is_active_admin(auth.uid())
    OR (
      id = public.current_user_team_id()
      AND is_active = true
    )
  );

CREATE POLICY "teams_admin_insert"
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "teams_admin_update"
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "teams_admin_delete"
  ON public.teams
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- RLS: profiles (SELECT team-scoped; UPDATE admin only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_authenticated_select" ON public.profiles;

CREATE POLICY "profiles_authenticated_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_active_admin(auth.uid())
    OR team_id = public.current_user_team_id()
  );

-- ---------------------------------------------------------------------------
-- RLS: requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_authenticated_all" ON public.requests;
DROP POLICY IF EXISTS "requests_team_select" ON public.requests;
DROP POLICY IF EXISTS "requests_team_insert" ON public.requests;
DROP POLICY IF EXISTS "requests_team_update" ON public.requests;
DROP POLICY IF EXISTS "requests_team_delete" ON public.requests;

CREATE POLICY "requests_team_select"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (public.is_same_team(team_id));

CREATE POLICY "requests_team_insert"
  ON public.requests
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "requests_team_update"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (public.is_same_team(team_id))
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "requests_team_delete"
  ON public.requests
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin(auth.uid()) AND public.is_same_team(team_id));

-- ---------------------------------------------------------------------------
-- RLS: inbox_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "inbox_items_authenticated_all" ON public.inbox_items;

CREATE POLICY "inbox_items_team_select"
  ON public.inbox_items
  FOR SELECT
  TO authenticated
  USING (public.is_same_team(team_id));

CREATE POLICY "inbox_items_team_insert"
  ON public.inbox_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "inbox_items_team_update"
  ON public.inbox_items
  FOR UPDATE
  TO authenticated
  USING (public.is_same_team(team_id))
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "inbox_items_team_delete"
  ON public.inbox_items
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin(auth.uid()) AND public.is_same_team(team_id));

-- ---------------------------------------------------------------------------
-- RLS: request_notes
-- ---------------------------------------------------------------------------
ALTER TABLE public.request_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_notes_authenticated_all" ON public.request_notes;
DROP POLICY IF EXISTS "request_notes_team_select" ON public.request_notes;
DROP POLICY IF EXISTS "request_notes_team_insert" ON public.request_notes;
DROP POLICY IF EXISTS "request_notes_team_update" ON public.request_notes;
DROP POLICY IF EXISTS "request_notes_team_delete" ON public.request_notes;

CREATE POLICY "request_notes_team_select"
  ON public.request_notes
  FOR SELECT
  TO authenticated
  USING (public.request_in_user_team(request_id));

CREATE POLICY "request_notes_team_insert"
  ON public.request_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.request_in_user_team(request_id));

CREATE POLICY "request_notes_team_update"
  ON public.request_notes
  FOR UPDATE
  TO authenticated
  USING (public.request_in_user_team(request_id))
  WITH CHECK (public.request_in_user_team(request_id));

CREATE POLICY "request_notes_team_delete"
  ON public.request_notes
  FOR DELETE
  TO authenticated
  USING (
    public.is_active_admin(auth.uid())
    AND public.request_in_user_team(request_id)
  );

-- ---------------------------------------------------------------------------
-- RLS: request_activities
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "request_activities_authenticated_all" ON public.request_activities;

CREATE POLICY "request_activities_team_select"
  ON public.request_activities
  FOR SELECT
  TO authenticated
  USING (public.request_in_user_team(request_id));

CREATE POLICY "request_activities_team_insert"
  ON public.request_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.request_in_user_team(request_id));

CREATE POLICY "request_activities_team_update"
  ON public.request_activities
  FOR UPDATE
  TO authenticated
  USING (public.request_in_user_team(request_id))
  WITH CHECK (public.request_in_user_team(request_id));

CREATE POLICY "request_activities_team_delete"
  ON public.request_activities
  FOR DELETE
  TO authenticated
  USING (
    public.is_active_admin(auth.uid())
    AND public.request_in_user_team(request_id)
  );

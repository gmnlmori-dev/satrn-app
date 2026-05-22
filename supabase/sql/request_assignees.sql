-- Assegnazione multipla richieste (N utenti per richiesta).
-- Esegui nel SQL Editor Supabase dopo roles_profiles_assignment.sql / teams.sql.

CREATE TABLE IF NOT EXISTS public.request_assignees (
  request_id uuid NOT NULL
    REFERENCES public.requests (id) ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS request_assignees_user_id_idx
  ON public.request_assignees (user_id);

CREATE INDEX IF NOT EXISTS request_assignees_request_id_idx
  ON public.request_assignees (request_id);

-- Backfill da colonna legacy assigned_user_id
INSERT INTO public.request_assignees (request_id, user_id, assigned_at)
SELECT
  r.id,
  r.assigned_user_id,
  COALESCE(r.assigned_at, r.updated_at, now())
FROM public.requests r
WHERE r.assigned_user_id IS NOT NULL
ON CONFLICT (request_id, user_id) DO NOTHING;

ALTER TABLE public.request_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_assignees_team_select" ON public.request_assignees;
DROP POLICY IF EXISTS "request_assignees_team_insert" ON public.request_assignees;
DROP POLICY IF EXISTS "request_assignees_team_update" ON public.request_assignees;
DROP POLICY IF EXISTS "request_assignees_team_delete" ON public.request_assignees;

CREATE POLICY "request_assignees_team_select"
  ON public.request_assignees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND public.is_same_team(r.team_id)
    )
  );

CREATE POLICY "request_assignees_team_insert"
  ON public.request_assignees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND public.is_same_team(r.team_id)
    )
  );

CREATE POLICY "request_assignees_team_update"
  ON public.request_assignees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND public.is_same_team(r.team_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND public.is_same_team(r.team_id)
    )
  );

CREATE POLICY "request_assignees_team_delete"
  ON public.request_assignees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND public.is_same_team(r.team_id)
    )
  );

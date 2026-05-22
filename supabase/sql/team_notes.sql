-- Note team stile Keep — visibilità private / team / shared.
-- Esegui nel SQL Editor Supabase dopo teams.sql.

CREATE TYPE public.team_note_visibility AS ENUM (
  'private',
  'team',
  'shared'
);

CREATE TABLE IF NOT EXISTS public.team_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL
    REFERENCES public.teams (id) ON DELETE RESTRICT,
  created_by_user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  visibility public.team_note_visibility NOT NULL DEFAULT 'private',
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_note_shared_users (
  note_id uuid NOT NULL
    REFERENCES public.team_notes (id) ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, user_id)
);

CREATE INDEX IF NOT EXISTS team_notes_team_id_idx
  ON public.team_notes (team_id);

CREATE INDEX IF NOT EXISTS team_notes_created_by_user_id_idx
  ON public.team_notes (created_by_user_id);

CREATE INDEX IF NOT EXISTS team_notes_updated_at_idx
  ON public.team_notes (updated_at DESC);

CREATE INDEX IF NOT EXISTS team_note_shared_users_user_id_idx
  ON public.team_note_shared_users (user_id);

CREATE OR REPLACE FUNCTION public.team_notes_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_notes_set_updated_at ON public.team_notes;

CREATE TRIGGER team_notes_set_updated_at
  BEFORE UPDATE ON public.team_notes
  FOR EACH ROW
  EXECUTE PROCEDURE public.team_notes_set_updated_at();

ALTER TABLE public.team_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_note_shared_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_notes_select" ON public.team_notes;
DROP POLICY IF EXISTS "team_notes_insert" ON public.team_notes;
DROP POLICY IF EXISTS "team_notes_update" ON public.team_notes;
DROP POLICY IF EXISTS "team_notes_delete" ON public.team_notes;

CREATE POLICY "team_notes_select"
  ON public.team_notes
  FOR SELECT
  TO authenticated
  USING (
    public.is_same_team(team_id)
    AND (
      (visibility = 'private'::public.team_note_visibility
        AND created_by_user_id = auth.uid())
      OR visibility = 'team'::public.team_note_visibility
      OR (
        visibility = 'shared'::public.team_note_visibility
        AND (
          created_by_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.team_note_shared_users s
            WHERE s.note_id = id
              AND s.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "team_notes_insert"
  ON public.team_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_same_team(team_id)
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "team_notes_update"
  ON public.team_notes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_same_team(team_id)
    AND created_by_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_same_team(team_id)
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "team_notes_delete"
  ON public.team_notes
  FOR DELETE
  TO authenticated
  USING (
    public.is_same_team(team_id)
    AND created_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "team_note_shared_users_select" ON public.team_note_shared_users;
DROP POLICY IF EXISTS "team_note_shared_users_insert" ON public.team_note_shared_users;
DROP POLICY IF EXISTS "team_note_shared_users_delete" ON public.team_note_shared_users;

CREATE POLICY "team_note_shared_users_select"
  ON public.team_note_shared_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_notes n
      WHERE n.id = note_id
        AND public.is_same_team(n.team_id)
        AND n.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_notes n
      WHERE n.id = note_id
        AND public.is_same_team(n.team_id)
        AND n.visibility = 'shared'::public.team_note_visibility
        AND (
          n.created_by_user_id = auth.uid()
          OR user_id = auth.uid()
        )
    )
  );

CREATE POLICY "team_note_shared_users_insert"
  ON public.team_note_shared_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.team_notes n
      WHERE n.id = note_id
        AND public.is_same_team(n.team_id)
        AND n.created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "team_note_shared_users_delete"
  ON public.team_note_shared_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_notes n
      WHERE n.id = note_id
        AND public.is_same_team(n.team_id)
        AND n.created_by_user_id = auth.uid()
    )
  );

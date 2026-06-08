-- Condivisione note cross-team (utenti e team interi) — esegui dopo team_notes.sql.
-- Consente agli admin di condividere note con utenti/team esterni al team della nota.

CREATE TABLE IF NOT EXISTS public.team_note_shared_teams (
  note_id uuid NOT NULL
    REFERENCES public.team_notes (id) ON DELETE CASCADE,
  team_id uuid NOT NULL
    REFERENCES public.teams (id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, team_id)
);

CREATE INDEX IF NOT EXISTS team_note_shared_teams_team_id_idx
  ON public.team_note_shared_teams (team_id);

ALTER TABLE public.team_note_shared_teams ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_team_note_shared_via_team(p_note_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_note_shared_teams st
    INNER JOIN public.profiles p
      ON p.team_id = st.team_id
      AND p.user_id = auth.uid()
      AND p.is_active = true
    WHERE st.note_id = p_note_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_team_note_shared_via_team(uuid) TO authenticated;

DROP POLICY IF EXISTS "team_notes_select" ON public.team_notes;
CREATE POLICY "team_notes_select"
  ON public.team_notes
  FOR SELECT
  TO authenticated
  USING (
    (
      public.is_same_team(team_id)
      AND (
        (visibility = 'private'::public.team_note_visibility
          AND created_by_user_id = auth.uid())
        OR visibility = 'team'::public.team_note_visibility
        OR (
          visibility = 'shared'::public.team_note_visibility
          AND created_by_user_id = auth.uid()
        )
      )
    )
    OR (
      visibility = 'shared'::public.team_note_visibility
      AND (
        public.user_is_team_note_shared_user(id)
        OR public.user_team_note_shared_via_team(id)
      )
    )
  );

DROP POLICY IF EXISTS "team_note_shared_teams_select" ON public.team_note_shared_teams;
DROP POLICY IF EXISTS "team_note_shared_teams_insert" ON public.team_note_shared_teams;
DROP POLICY IF EXISTS "team_note_shared_teams_delete" ON public.team_note_shared_teams;

CREATE POLICY "team_note_shared_teams_select"
  ON public.team_note_shared_teams
  FOR SELECT
  TO authenticated
  USING (
    public.team_note_is_creator(note_id)
    OR public.user_team_note_shared_via_team(note_id)
  );

CREATE POLICY "team_note_shared_teams_insert"
  ON public.team_note_shared_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (public.team_note_is_creator(note_id));

CREATE POLICY "team_note_shared_teams_delete"
  ON public.team_note_shared_teams
  FOR DELETE
  TO authenticated
  USING (public.team_note_is_creator(note_id));

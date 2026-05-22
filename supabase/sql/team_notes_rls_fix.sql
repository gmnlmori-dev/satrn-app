-- Fix ricorsione RLS team_notes ↔ team_note_shared_users.
-- Esegui nel SQL Editor se hai già applicato team_notes.sql con le policy originali.

CREATE OR REPLACE FUNCTION public.user_is_team_note_shared_user(p_note_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_note_shared_users s
    WHERE s.note_id = p_note_id
      AND s.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.team_note_is_creator(p_note_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_notes n
    WHERE n.id = p_note_id
      AND n.created_by_user_id = auth.uid()
      AND public.is_same_team(n.team_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_is_team_note_shared_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_note_is_creator(uuid) TO authenticated;

DROP POLICY IF EXISTS "team_notes_select" ON public.team_notes;
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
          OR public.user_is_team_note_shared_user(id)
        )
      )
    )
  );

DROP POLICY IF EXISTS "team_note_shared_users_select" ON public.team_note_shared_users;
CREATE POLICY "team_note_shared_users_select"
  ON public.team_note_shared_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.team_note_is_creator(note_id)
  );

DROP POLICY IF EXISTS "team_note_shared_users_insert" ON public.team_note_shared_users;
CREATE POLICY "team_note_shared_users_insert"
  ON public.team_note_shared_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.team_note_is_creator(note_id));

DROP POLICY IF EXISTS "team_note_shared_users_delete" ON public.team_note_shared_users;
CREATE POLICY "team_note_shared_users_delete"
  ON public.team_note_shared_users
  FOR DELETE
  TO authenticated
  USING (public.team_note_is_creator(note_id));

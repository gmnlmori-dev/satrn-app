-- Creatore inbox + eliminazione solo propri ingressi non convertiti.
-- Esegui nel SQL Editor Supabase dopo inbox_assigned_user.sql / teams.sql.

ALTER TABLE public.inbox_items
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inbox_items_created_by_user_id_idx
  ON public.inbox_items (created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

UPDATE public.inbox_items
SET created_by_user_id = assigned_user_id
WHERE created_by_user_id IS NULL
  AND assigned_user_id IS NOT NULL;

COMMENT ON COLUMN public.inbox_items.created_by_user_id IS
  'Utente che ha registrato manualmente l''ingresso inbox.';

DROP POLICY IF EXISTS "inbox_items_team_delete" ON public.inbox_items;

CREATE POLICY "inbox_items_team_delete"
  ON public.inbox_items
  FOR DELETE
  TO authenticated
  USING (
    public.is_same_team(team_id)
    AND created_by_user_id = auth.uid()
    AND linked_request_id IS NULL
    AND status <> 'converted'::public.inbox_item_status
  );

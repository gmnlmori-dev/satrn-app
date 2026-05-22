-- Assegnazione inbox (come richieste): creatore = assegnatario di default.
-- Esegui nel SQL Editor Supabase dopo inbox_items.sql / teams.sql.

ALTER TABLE public.inbox_items
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS inbox_items_assigned_user_id_idx
  ON public.inbox_items (assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

COMMENT ON COLUMN public.inbox_items.assigned_user_id IS
  'Utente assegnato (di default chi crea l''ingresso).';

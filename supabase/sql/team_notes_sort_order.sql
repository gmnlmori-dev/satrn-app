-- Ordine manuale note (drag-and-drop) — esegui nel SQL Editor Supabase.

ALTER TABLE public.team_notes
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS team_notes_user_pin_sort_idx
  ON public.team_notes (created_by_user_id, is_pinned, is_archived, sort_order);

-- Inizializza ordine stabile per note esistenti (pinned prima, poi per data).
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY created_by_user_id, is_pinned, is_archived
      ORDER BY updated_at DESC
    ) - 1 AS next_sort
  FROM public.team_notes
)
UPDATE public.team_notes n
SET sort_order = ranked.next_sort
FROM ranked
WHERE n.id = ranked.id;

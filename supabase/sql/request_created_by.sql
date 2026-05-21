-- Creatore richiesta — esegui nel SQL Editor Supabase (dopo roles_profiles_assignment.sql).

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid
  REFERENCES public.profiles (user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS requests_created_by_user_id_idx
  ON public.requests (created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

-- Backfill da prima attività di assegnazione (changed_by_user_id = creatore al momento della creazione).
UPDATE public.requests r
SET created_by_user_id = sub.creator_id
FROM (
  SELECT DISTINCT ON (a.request_id)
    a.request_id,
    (a.meta ->> 'changed_by_user_id')::uuid AS creator_id
  FROM public.request_activities a
  WHERE a.type = 'assigned_user_changed'
    AND a.meta ? 'changed_by_user_id'
  ORDER BY a.request_id, a.created_at ASC
) sub
WHERE r.id = sub.request_id
  AND r.created_by_user_id IS NULL
  AND sub.creator_id IS NOT NULL;

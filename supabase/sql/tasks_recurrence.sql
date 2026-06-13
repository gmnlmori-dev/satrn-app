-- Ricorrenza task libere — esegui dopo tasks.sql

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence jsonb NULL;

COMMENT ON COLUMN public.tasks.recurrence IS
  'Regola di ripetizione (JSON): interval, frequency, weekdays, monthlyBy, startAt, end, completedCount';

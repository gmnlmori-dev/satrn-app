-- Timeline attività per richiesta — esegui nel SQL Editor (richiede `public.requests`).

CREATE TYPE public.request_activity_type AS ENUM (
  'request_created',
  'status_changed',
  'priority_changed',
  'next_action_updated',
  'note_added',
  'converted_from_inbox'
);

CREATE TABLE public.request_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests (id) ON DELETE CASCADE,
  type public.request_activity_type NOT NULL,
  body text NOT NULL DEFAULT '',
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX request_activities_request_created_idx
  ON public.request_activities (request_id, created_at DESC);

ALTER TABLE public.request_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "request_activities_authenticated_all"
  ON public.request_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

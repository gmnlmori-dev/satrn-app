-- Inbox / intake manuale — esegui nel SQL Editor Supabase (dopo aver verificato che `public.requests` esista).

CREATE TYPE public.inbox_item_status AS ENUM (
  'new',
  'reviewed',
  'converted',
  'archived'
);

CREATE TABLE public.inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL DEFAULT '',
  raw_content text NOT NULL DEFAULT '',
  status public.inbox_item_status NOT NULL DEFAULT 'new',
  linked_request_id uuid REFERENCES public.requests (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inbox_items_status_idx ON public.inbox_items (status);
CREATE INDEX inbox_items_created_at_idx ON public.inbox_items (created_at DESC);
CREATE INDEX inbox_items_linked_request_id_idx ON public.inbox_items (linked_request_id)
  WHERE linked_request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.inbox_items_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inbox_items_set_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.inbox_items_set_updated_at();

ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_items_authenticated_all"
  ON public.inbox_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

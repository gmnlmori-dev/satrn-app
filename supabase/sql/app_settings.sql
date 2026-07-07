-- Impostazioni applicazione (singleton org-wide).
-- Esegui nel SQL Editor Supabase dopo teams.sql (usa is_active_admin).

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, settings)
VALUES ('global', '{"inboxEnabled": false}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.app_settings IS
  'Preferenze globali Satrn (es. inboxEnabled). Una riga id=global.';

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_admin_update" ON public.app_settings;

CREATE POLICY "app_settings_select"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "app_settings_admin_update"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

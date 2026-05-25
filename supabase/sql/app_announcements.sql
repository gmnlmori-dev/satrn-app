-- Novità / release notes — audience globale, team o utente, con finestra temporale.
-- Esegui nel SQL Editor Supabase dopo teams.sql.

CREATE TYPE public.app_announcement_audience AS ENUM (
  'all',
  'team',
  'user'
);

CREATE TABLE IF NOT EXISTS public.app_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  audience public.app_announcement_audience NOT NULL DEFAULT 'all',
  target_team_id uuid
    REFERENCES public.teams (id) ON DELETE RESTRICT,
  target_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by_user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_announcements_audience_targets_chk CHECK (
    (audience = 'all'::public.app_announcement_audience
      AND target_team_id IS NULL
      AND target_user_id IS NULL)
    OR (audience = 'team'::public.app_announcement_audience
      AND target_team_id IS NOT NULL
      AND target_user_id IS NULL)
    OR (audience = 'user'::public.app_announcement_audience
      AND target_team_id IS NULL
      AND target_user_id IS NOT NULL)
  ),
  CONSTRAINT app_announcements_window_chk CHECK (
    starts_at IS NULL
    OR ends_at IS NULL
    OR ends_at > starts_at
  )
);

CREATE TABLE IF NOT EXISTS public.app_announcement_reads (
  user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL
    REFERENCES public.app_announcements (id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS app_announcements_created_at_idx
  ON public.app_announcements (created_at DESC);

CREATE INDEX IF NOT EXISTS app_announcements_audience_idx
  ON public.app_announcements (audience);

CREATE INDEX IF NOT EXISTS app_announcement_reads_user_id_idx
  ON public.app_announcement_reads (user_id);

CREATE OR REPLACE FUNCTION public.app_announcements_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_announcements_set_updated_at ON public.app_announcements;

CREATE TRIGGER app_announcements_set_updated_at
  BEFORE UPDATE ON public.app_announcements
  FOR EACH ROW
  EXECUTE PROCEDURE public.app_announcements_set_updated_at();

CREATE OR REPLACE FUNCTION public.announcement_is_active(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_now timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (p_starts_at IS NULL OR p_starts_at <= p_now)
    AND (p_ends_at IS NULL OR p_ends_at > p_now);
$$;

CREATE OR REPLACE FUNCTION public.announcement_visible_to_user(
  p_audience public.app_announcement_audience,
  p_target_team_id uuid,
  p_target_user_id uuid,
  p_uid uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_audience = 'all'::public.app_announcement_audience THEN true
    WHEN p_audience = 'team'::public.app_announcement_audience THEN
      p_target_team_id IS NOT NULL
      AND p_target_team_id = (
        SELECT pr.team_id
        FROM public.profiles pr
        WHERE pr.user_id = p_uid
      )
    WHEN p_audience = 'user'::public.app_announcement_audience THEN
      p_target_user_id = p_uid
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.announcement_is_active(timestamptz, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.announcement_visible_to_user(public.app_announcement_audience, uuid, uuid, uuid) TO authenticated;

ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_announcements_admin_all" ON public.app_announcements;
DROP POLICY IF EXISTS "app_announcements_user_select" ON public.app_announcements;
DROP POLICY IF EXISTS "app_announcements_admin_insert" ON public.app_announcements;
DROP POLICY IF EXISTS "app_announcements_admin_update" ON public.app_announcements;
DROP POLICY IF EXISTS "app_announcements_admin_delete" ON public.app_announcements;

CREATE POLICY "app_announcements_user_select"
  ON public.app_announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_active_admin(auth.uid())
    OR public.announcement_visible_to_user(
      audience,
      target_team_id,
      target_user_id,
      auth.uid()
    )
  );

CREATE POLICY "app_announcements_admin_insert"
  ON public.app_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "app_announcements_admin_update"
  ON public.app_announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "app_announcements_admin_delete"
  ON public.app_announcements
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "app_announcement_reads_select_own" ON public.app_announcement_reads;
DROP POLICY IF EXISTS "app_announcement_reads_insert_own" ON public.app_announcement_reads;

CREATE POLICY "app_announcement_reads_select_own"
  ON public.app_announcement_reads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "app_announcement_reads_insert_own"
  ON public.app_announcement_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Consente upsert su app_announcement_reads (ON CONFLICT UPDATE read_at).
-- Eseguire in Supabase SQL Editor se markAnnouncementRead fallisce su righe esistenti.

DROP POLICY IF EXISTS "app_announcement_reads_update_own" ON public.app_announcement_reads;

CREATE POLICY "app_announcement_reads_update_own"
  ON public.app_announcement_reads
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

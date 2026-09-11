-- Tag di team (definizioni + assegnazioni) — esegui dopo teams.sql / tasks.sql / team_notes.sql / inbox_items.sql.
-- Rieseguibile: crea le tabelle mancanti (es. inbox_tag_assignments) e riallinea policy/colonne.
-- CRUD definizioni: admin (qualsiasi team) o manager (solo il proprio team).
-- SELECT / applicazione assegnazioni: membri dello stesso team.

CREATE OR REPLACE FUNCTION public.can_manage_team_tags(target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_admin(auth.uid())
    OR (
      public.current_user_role() = 'manager'::public.app_role
      AND target_team_id IS NOT NULL
      AND target_team_id = public.current_user_team_id()
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_team_tags(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.team_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL
    REFERENCES public.teams (id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  created_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_tags_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS team_tags_team_id_lower_name_uidx
  ON public.team_tags (team_id, lower(trim(name)));

CREATE INDEX IF NOT EXISTS team_tags_team_id_sort_idx
  ON public.team_tags (team_id, sort_order, name);

CREATE OR REPLACE FUNCTION public.team_tags_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_tags_set_updated_at ON public.team_tags;

CREATE TRIGGER team_tags_set_updated_at
  BEFORE UPDATE ON public.team_tags
  FOR EACH ROW
  EXECUTE PROCEDURE public.team_tags_set_updated_at();

CREATE TABLE IF NOT EXISTS public.request_tag_assignments (
  request_id uuid NOT NULL
    REFERENCES public.requests (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL
    REFERENCES public.team_tags (id) ON DELETE CASCADE,
  applied_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, tag_id)
);

CREATE INDEX IF NOT EXISTS request_tag_assignments_tag_id_idx
  ON public.request_tag_assignments (tag_id);

CREATE TABLE IF NOT EXISTS public.task_tag_assignments (
  task_id uuid NOT NULL
    REFERENCES public.tasks (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL
    REFERENCES public.team_tags (id) ON DELETE CASCADE,
  applied_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX IF NOT EXISTS task_tag_assignments_tag_id_idx
  ON public.task_tag_assignments (tag_id);

CREATE TABLE IF NOT EXISTS public.team_note_tag_assignments (
  note_id uuid NOT NULL
    REFERENCES public.team_notes (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL
    REFERENCES public.team_tags (id) ON DELETE CASCADE,
  applied_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS team_note_tag_assignments_tag_id_idx
  ON public.team_note_tag_assignments (tag_id);

-- Le voci checklist vivono nel JSON `requests.next_action`; l'id è generato
-- lato client (uuid o fallback testuale), quindi la colonna è `text`.
CREATE TABLE IF NOT EXISTS public.checklist_tag_assignments (
  request_id uuid NOT NULL
    REFERENCES public.requests (id) ON DELETE CASCADE,
  checklist_task_id text NOT NULL,
  tag_id uuid NOT NULL
    REFERENCES public.team_tags (id) ON DELETE CASCADE,
  applied_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, checklist_task_id, tag_id)
);

-- Migrazione da versione precedente (colonna uuid): idempotente.
ALTER TABLE public.checklist_tag_assignments
  ALTER COLUMN checklist_task_id TYPE text USING checklist_task_id::text;

CREATE INDEX IF NOT EXISTS checklist_tag_assignments_tag_id_idx
  ON public.checklist_tag_assignments (tag_id);

CREATE INDEX IF NOT EXISTS checklist_tag_assignments_request_id_idx
  ON public.checklist_tag_assignments (request_id);

CREATE TABLE IF NOT EXISTS public.inbox_tag_assignments (
  inbox_item_id uuid NOT NULL
    REFERENCES public.inbox_items (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL
    REFERENCES public.team_tags (id) ON DELETE CASCADE,
  applied_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (inbox_item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS inbox_tag_assignments_tag_id_idx
  ON public.inbox_tag_assignments (tag_id);

ALTER TABLE public.team_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_note_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_tag_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_tags_select" ON public.team_tags;
DROP POLICY IF EXISTS "team_tags_insert" ON public.team_tags;
DROP POLICY IF EXISTS "team_tags_update" ON public.team_tags;
DROP POLICY IF EXISTS "team_tags_delete" ON public.team_tags;

CREATE POLICY "team_tags_select"
  ON public.team_tags
  FOR SELECT
  TO authenticated
  USING (public.is_same_team(team_id));

CREATE POLICY "team_tags_insert"
  ON public.team_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_team_tags(team_id));

CREATE POLICY "team_tags_update"
  ON public.team_tags
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_team_tags(team_id))
  WITH CHECK (public.can_manage_team_tags(team_id));

CREATE POLICY "team_tags_delete"
  ON public.team_tags
  FOR DELETE
  TO authenticated
  USING (public.can_manage_team_tags(team_id));

-- Request assignments: stesso team del progetto e del tag
DROP POLICY IF EXISTS "request_tag_assignments_select" ON public.request_tag_assignments;
DROP POLICY IF EXISTS "request_tag_assignments_insert" ON public.request_tag_assignments;
DROP POLICY IF EXISTS "request_tag_assignments_delete" ON public.request_tag_assignments;

CREATE POLICY "request_tag_assignments_select"
  ON public.request_tag_assignments
  FOR SELECT
  TO authenticated
  USING (public.request_in_user_team(request_id));

CREATE POLICY "request_tag_assignments_insert"
  ON public.request_tag_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.request_in_user_team(request_id)
    AND EXISTS (
      SELECT 1
      FROM public.team_tags t
      JOIN public.requests r ON r.id = request_id
      WHERE t.id = tag_id
        AND t.team_id = r.team_id
        AND public.is_same_team(t.team_id)
    )
  );

CREATE POLICY "request_tag_assignments_delete"
  ON public.request_tag_assignments
  FOR DELETE
  TO authenticated
  USING (public.request_in_user_team(request_id));

-- Task assignments
DROP POLICY IF EXISTS "task_tag_assignments_select" ON public.task_tag_assignments;
DROP POLICY IF EXISTS "task_tag_assignments_insert" ON public.task_tag_assignments;
DROP POLICY IF EXISTS "task_tag_assignments_delete" ON public.task_tag_assignments;

CREATE POLICY "task_tag_assignments_select"
  ON public.task_tag_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks tk
      WHERE tk.id = task_id AND public.is_same_team(tk.team_id)
    )
  );

CREATE POLICY "task_tag_assignments_insert"
  ON public.task_tag_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks tk
      JOIN public.team_tags t ON t.id = tag_id AND t.team_id = tk.team_id
      WHERE tk.id = task_id
        AND public.is_same_team(tk.team_id)
    )
  );

CREATE POLICY "task_tag_assignments_delete"
  ON public.task_tag_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks tk
      WHERE tk.id = task_id AND public.is_same_team(tk.team_id)
    )
  );

-- Note assignments
DROP POLICY IF EXISTS "team_note_tag_assignments_select" ON public.team_note_tag_assignments;
DROP POLICY IF EXISTS "team_note_tag_assignments_insert" ON public.team_note_tag_assignments;
DROP POLICY IF EXISTS "team_note_tag_assignments_delete" ON public.team_note_tag_assignments;

CREATE POLICY "team_note_tag_assignments_select"
  ON public.team_note_tag_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_notes n
      WHERE n.id = note_id AND public.is_same_team(n.team_id)
    )
  );

CREATE POLICY "team_note_tag_assignments_insert"
  ON public.team_note_tag_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.team_notes n
      JOIN public.team_tags t ON t.id = tag_id AND t.team_id = n.team_id
      WHERE n.id = note_id
        AND public.is_same_team(n.team_id)
    )
  );

CREATE POLICY "team_note_tag_assignments_delete"
  ON public.team_note_tag_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_notes n
      WHERE n.id = note_id AND public.is_same_team(n.team_id)
    )
  );

-- Checklist assignments (stesso team del progetto)
DROP POLICY IF EXISTS "checklist_tag_assignments_select" ON public.checklist_tag_assignments;
DROP POLICY IF EXISTS "checklist_tag_assignments_insert" ON public.checklist_tag_assignments;
DROP POLICY IF EXISTS "checklist_tag_assignments_delete" ON public.checklist_tag_assignments;

CREATE POLICY "checklist_tag_assignments_select"
  ON public.checklist_tag_assignments
  FOR SELECT
  TO authenticated
  USING (public.request_in_user_team(request_id));

CREATE POLICY "checklist_tag_assignments_insert"
  ON public.checklist_tag_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.request_in_user_team(request_id)
    AND EXISTS (
      SELECT 1
      FROM public.team_tags t
      JOIN public.requests r ON r.id = request_id
      WHERE t.id = tag_id
        AND t.team_id = r.team_id
        AND public.is_same_team(t.team_id)
    )
  );

CREATE POLICY "checklist_tag_assignments_delete"
  ON public.checklist_tag_assignments
  FOR DELETE
  TO authenticated
  USING (public.request_in_user_team(request_id));

-- Inbox assignments (stesso team dell'ingresso e del tag)
DROP POLICY IF EXISTS "inbox_tag_assignments_select" ON public.inbox_tag_assignments;
DROP POLICY IF EXISTS "inbox_tag_assignments_insert" ON public.inbox_tag_assignments;
DROP POLICY IF EXISTS "inbox_tag_assignments_delete" ON public.inbox_tag_assignments;

CREATE POLICY "inbox_tag_assignments_select"
  ON public.inbox_tag_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inbox_items i
      WHERE i.id = inbox_item_id AND public.is_same_team(i.team_id)
    )
  );

CREATE POLICY "inbox_tag_assignments_insert"
  ON public.inbox_tag_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.inbox_items i
      JOIN public.team_tags t ON t.id = tag_id AND t.team_id = i.team_id
      WHERE i.id = inbox_item_id
        AND public.is_same_team(i.team_id)
    )
  );

CREATE POLICY "inbox_tag_assignments_delete"
  ON public.inbox_tag_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inbox_items i
      WHERE i.id = inbox_item_id AND public.is_same_team(i.team_id)
    )
  );

-- Task libere (non collegate a richieste) — esegui nel SQL Editor dopo teams.sql / request_assignees.sql.

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL
    REFERENCES public.teams (id) ON DELETE RESTRICT,
  created_by_user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id uuid NOT NULL
    REFERENCES public.tasks (id) ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by_user_id uuid
    REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS tasks_team_id_idx
  ON public.tasks (team_id);

CREATE INDEX IF NOT EXISTS tasks_created_by_user_id_idx
  ON public.tasks (created_by_user_id);

CREATE INDEX IF NOT EXISTS tasks_due_at_open_idx
  ON public.tasks (due_at)
  WHERE NOT done AND due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS task_assignees_user_id_idx
  ON public.task_assignees (user_id);

CREATE INDEX IF NOT EXISTS task_assignees_task_id_idx
  ON public.task_assignees (task_id);

CREATE OR REPLACE FUNCTION public.tasks_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.tasks_set_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_team_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_team_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_team_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_team_delete" ON public.tasks;

CREATE POLICY "tasks_team_select"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (public.is_same_team(team_id));

CREATE POLICY "tasks_team_insert"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "tasks_team_update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (public.is_same_team(team_id))
  WITH CHECK (public.is_same_team(team_id));

CREATE POLICY "tasks_team_delete"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (public.is_same_team(team_id));

DROP POLICY IF EXISTS "task_assignees_team_select" ON public.task_assignees;
DROP POLICY IF EXISTS "task_assignees_team_insert" ON public.task_assignees;
DROP POLICY IF EXISTS "task_assignees_team_update" ON public.task_assignees;
DROP POLICY IF EXISTS "task_assignees_team_delete" ON public.task_assignees;

CREATE POLICY "task_assignees_team_select"
  ON public.task_assignees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND public.is_same_team(t.team_id)
    )
  );

CREATE POLICY "task_assignees_team_insert"
  ON public.task_assignees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND public.is_same_team(t.team_id)
    )
  );

CREATE POLICY "task_assignees_team_update"
  ON public.task_assignees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND public.is_same_team(t.team_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND public.is_same_team(t.team_id)
    )
  );

CREATE POLICY "task_assignees_team_delete"
  ON public.task_assignees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND public.is_same_team(t.team_id)
    )
  );

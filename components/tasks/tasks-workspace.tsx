"use client";

import { useEffect, useMemo, useState } from "react";
import { useOpenCreateTask } from "@/components/app/create-task-context";
import { TaskEditSlideOver } from "@/components/tasks/task-edit-slide-over";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { taskIsAssignedTo } from "@/lib/task-assignees";
import {
  defaultTaskToolbarFilters,
  filterTasksByToolbar,
} from "@/lib/tasks-query";
import { resolveDefaultAssignScope } from "@/lib/user-preferences";
import { uiBtnPrimary } from "@/lib/ui-classes";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { Task } from "@/types/task";
import type { AssigneeOption, AppRole } from "@/types/profile";
import type { UserPreferences } from "@/lib/user-preferences";
import { cn } from "@/lib/cn";

type Props = {
  tasks: Task[];
  currentUserId: string;
  currentUserRole: AppRole;
  assigneeOptions: AssigneeOption[];
  preferences?: UserPreferences;
};

export function TasksWorkspace({
  tasks: initialTasks,
  currentUserId,
  currentUserRole,
  assigneeOptions,
  preferences = {},
}: Props) {
  const openNewTask = useOpenCreateTask();
  const [tasks, setTasks] = useState(initialTasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  const defaultScope = resolveDefaultAssignScope(preferences, currentUserRole);
  const [toolbar, setToolbar] = useState(() =>
    defaultTaskToolbarFilters(defaultScope === "mine" ? "mine" : "all"),
  );

  const myAssignedCount = useMemo(
    () =>
      tasks.filter((t) => !t.done && taskIsAssignedTo(t, currentUserId)).length,
    [tasks, currentUserId],
  );

  const filtered = useMemo(
    () =>
      filterTasksByToolbar(tasks, toolbar, { currentUserId }),
    [tasks, toolbar, currentUserId],
  );

  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <header className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={uiPageTitle}>Task</h1>
            <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
              Azioni operative interne, con scadenza e assegnazione — senza
              legame a una richiesta cliente.
            </p>
          </div>
          <button type="button" className={uiBtnPrimary} onClick={openNewTask}>
            Nuova task
          </button>
        </div>
      </header>

      <TasksToolbar
        toolbar={toolbar}
        onToolbarChange={setToolbar}
        currentUserId={currentUserId}
        assigneeOptions={assigneeOptions}
        myAssignedCount={myAssignedCount}
      />

      {filtered.length === 0 ? (
        <AppEmptyState
          icon="task"
          title={tasks.length === 0 ? "Nessuna task" : "Nessun risultato"}
          description={
            tasks.length === 0
              ? "Crea la prima task per organizzare il lavoro interno del team."
              : "Prova a modificare i filtri di ricerca o assegnazione."
          }
        >
          {tasks.length === 0 ? (
            <button type="button" className={uiBtnPrimary} onClick={openNewTask}>
              Nuova task
            </button>
          ) : null}
        </AppEmptyState>
      ) : (
        <TasksTable
          tasks={filtered}
          onTasksChange={setTasks}
          onEditTask={setEditingTask}
        />
      )}

      <TaskEditSlideOver
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)),
          );
        }}
        onDeleted={(taskId) => {
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        }}
      />
    </div>
  );
}

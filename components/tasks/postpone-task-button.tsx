"use client";

import { IconCalendarDays } from "@/components/follow-up/postpone-due-at-popover";
import { cn } from "@/lib/cn";
import { uiBtnIcon } from "@/lib/ui-classes";
import type { Task } from "@/types/task";

export function PostponeTaskButton({
  task,
  active,
  disabled,
  onToggle,
}: {
  task: Task;
  active: boolean;
  disabled: boolean;
  onToggle: (task: Task, rect: DOMRectReadOnly) => void;
}) {
  return (
    <button
      type="button"
      data-postpone-trigger={task.id}
      title="Sposta scadenza"
      aria-label="Sposta scadenza"
      disabled={disabled}
      aria-expanded={active}
      className={cn(
        uiBtnIcon,
        active && "border-accent/40 bg-accent-subtle text-accent",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task, e.currentTarget.getBoundingClientRect());
      }}
    >
      <IconCalendarDays className="h-4 w-4" />
    </button>
  );
}

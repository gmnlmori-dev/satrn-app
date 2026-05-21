"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";
import { uiBtnGhost, uiControl, uiTransition } from "@/lib/ui-classes";
import {
  createNextActionTask,
  parseNextAction,
  serializeNextAction,
  switchNextActionMode,
  type NextActionContent,
  type NextActionTask,
} from "@/lib/next-action-tasks";

type Props = {
  value: string;
  onChange: (serialized: string) => void;
  disabled?: boolean;
  name?: string;
  idPrefix?: string;
  textRows?: number;
  className?: string;
};

function updateTask(
  tasks: NextActionTask[],
  id: string,
  patch: Partial<Pick<NextActionTask, "text" | "done">>,
): NextActionTask[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

export function NextActionField({
  value,
  onChange,
  disabled,
  name = "nextAction",
  idPrefix = "next-action",
  textRows = 4,
  className,
}: Props) {
  const [content, setContent] = useState<NextActionContent>(() =>
    parseNextAction(value),
  );
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setContent(parseNextAction(value));
    }
  }, [value]);

  const serialized = useMemo(() => serializeNextAction(content), [content]);

  useEffect(() => {
    if (serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    onChange(serialized);
  }, [serialized, onChange]);

  function patchContent(next: NextActionContent) {
    setContent(next);
  }

  function setMode(mode: NextActionContent["mode"]) {
    if (disabled) return;
    patchContent(switchNextActionMode(content, mode));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input type="hidden" name={name} value={serialized} readOnly />

      <SegmentedControl
        ariaLabel="Formato prossima azione"
        value={content.mode}
        options={[
          { value: "text", label: "Testo" },
          { value: "tasks", label: "Checklist" },
        ]}
        onChange={setMode}
        className={disabled ? "pointer-events-none opacity-60" : undefined}
      />

      {content.mode === "text" ? (
        <textarea
          id={`${idPrefix}-text`}
          rows={textRows}
          disabled={disabled}
          value={content.text}
          onChange={(e) =>
            patchContent({
              ...content,
              text: e.target.value,
            })
          }
          className={cn(uiControl, "min-h-[5rem] resize-y text-[15px]")}
          placeholder="Prossimo passo operativo…"
        />
      ) : (
        <div className="space-y-2">
          <ul className="space-y-2">
            {content.tasks.map((task, index) => (
              <li key={task.id} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={disabled}
                  onChange={(e) =>
                    patchContent({
                      ...content,
                      tasks: updateTask(content.tasks, task.id, {
                        done: e.target.checked,
                      }),
                    })
                  }
                  aria-label={`Segna task ${index + 1} come completato`}
                  className="mt-2.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={task.text}
                  onChange={(e) =>
                    patchContent({
                      ...content,
                      tasks: updateTask(content.tasks, task.id, {
                        text: e.target.value,
                      }),
                    })
                  }
                  placeholder={`Task ${index + 1}`}
                  className={cn(
                    uiControl,
                    "min-w-0 flex-1 py-2 text-[15px]",
                    task.done && "text-fg-tertiary line-through",
                  )}
                />
                <button
                  type="button"
                  disabled={disabled || content.tasks.length <= 1}
                  onClick={() =>
                    patchContent({
                      ...content,
                      tasks: content.tasks.filter((t) => t.id !== task.id),
                    })
                  }
                  className={cn(
                    uiBtnGhost,
                    uiTransition,
                    "mt-0.5 h-9 w-9 shrink-0 px-0 text-fg-tertiary hover:text-danger",
                  )}
                  aria-label={`Rimuovi task ${index + 1}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              patchContent({
                ...content,
                tasks: [...content.tasks, createNextActionTask()],
              })
            }
            className={cn(uiBtnGhost, "text-sm")}
          >
            Aggiungi task
          </button>
        </div>
      )}
    </div>
  );
}

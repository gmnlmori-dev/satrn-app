"use client";

import { cn } from "@/lib/cn";
import { uiFormLabel } from "@/lib/typography";
import type { AssigneeOption } from "@/types/profile";

export function RequestAssigneesField({
  options,
  selectedIds,
  disabled,
  onChange,
  idPrefix,
  className,
}: {
  options: AssigneeOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
  idPrefix: string;
  className?: string;
}) {
  const toggle = (userId: string) => {
    const next = new Set(selectedIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    onChange([...next]);
  };

  if (options.length === 0) {
    return (
      <p className="mt-1.5 text-sm text-fg-tertiary">
        Nessun utente disponibile per l’assegnazione.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mt-1.5 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-line-default bg-surface p-2",
        className,
      )}
    >
      {options.map((option) => {
        const checked = selectedIds.includes(option.userId);
        const inputId = `${idPrefix}-assignee-${option.userId}`;
        return (
          <label
            key={option.userId}
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-fg-primary transition-colors hover:bg-surface-muted",
              disabled && "cursor-not-allowed opacity-70",
            )}
          >
            <input
              id={inputId}
              type="checkbox"
              className="size-4 shrink-0 rounded border-line-strong accent-accent"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option.userId)}
            />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function RequestAssigneeFormFields({
  options,
  selectedIds,
  disabled,
  onChange,
  idPrefix,
  loadError,
  loading,
}: {
  options: AssigneeOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
  idPrefix: string;
  loadError?: string | null;
  loading?: boolean;
}) {
  return (
    <div>
      <p className={uiFormLabel}>Assegnato a</p>
      <RequestAssigneesField
        idPrefix={idPrefix}
        options={options}
        selectedIds={selectedIds}
        disabled={disabled || loading}
        onChange={onChange}
        className={loading ? "opacity-70" : undefined}
      />
      {selectedIds.map((userId) => (
        <input
          key={userId}
          type="hidden"
          name="assignedUserIds"
          value={userId}
        />
      ))}
      {loadError ? (
        <p className="mt-1.5 text-xs text-danger">{loadError}</p>
      ) : null}
    </div>
  );
}

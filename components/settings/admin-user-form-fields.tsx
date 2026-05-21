"use client";

import { useId } from "react";
import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiControl } from "@/lib/ui-classes";
import { uiFormLabel, uiSectionHeading } from "@/lib/typography";
import type { AppRole } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

export const ADMIN_USER_ROLES: AppRole[] = ["admin", "manager", "operator"];

export const adminUserInputClass = cn(uiControl, "py-2.5 text-[15px]");

export function RequiredMark() {
  return <span className="text-danger">*</span>;
}

export function AdminFormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5 first:pt-0">
      <h3 className={cn(uiSectionHeading, "mb-3")}>{title}</h3>
      {children}
    </section>
  );
}

export function AdminUserRoleFields({
  role,
  isActive,
  onRoleChange,
  onActiveChange,
  disabled,
  idPrefix,
}: {
  role: AppRole;
  isActive: boolean;
  onRoleChange: (r: AppRole) => void;
  onActiveChange: (v: boolean) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-role`} className={uiFormLabel}>
          Ruolo
        </label>
        <select
          id={`${idPrefix}-role`}
          className={adminUserInputClass}
          value={role}
          disabled={disabled}
          onChange={(e) => onRoleChange(e.target.value as AppRole)}
        >
          {ADMIN_USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {appRoleLabel[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end pb-2">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-fg-primary">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line-default accent-accent"
            checked={isActive}
            disabled={disabled}
            onChange={(e) => onActiveChange(e.target.checked)}
          />
          Account attivo
        </label>
      </div>
    </div>
  );
}

export function AdminUserTeamFields({
  teamId,
  teams,
  onTeamChange,
  disabled,
  idPrefix,
}: {
  teamId: string;
  teams: TeamSelectOption[];
  onTeamChange: (id: string) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div>
      <label htmlFor={`${idPrefix}-team`} className={uiFormLabel}>
        Team <RequiredMark />
      </label>
      <select
        id={`${idPrefix}-team`}
        className={adminUserInputClass}
        value={teamId}
        disabled={disabled || teams.length === 0}
        required
        onChange={(e) => onTeamChange(e.target.value)}
      >
        {teams.length === 0 ? (
          <option value="">Nessun team attivo</option>
        ) : (
          teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

export function useAdminFormIds() {
  const uid = useId();
  return (name: string) => `${uid}-${name}`;
}

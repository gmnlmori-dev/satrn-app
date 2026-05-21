import type { UserPreferences } from "@/lib/user-preferences";

/** Ruoli applicativo (mirror di public.app_role). */
export type AppRole = "admin" | "manager" | "operator";

export type ProfileSummary = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  isActive: boolean;
  teamId: string;
  teamName?: string;
  preferences: UserPreferences;
};

/** Per select / combobox assegnazione. */
export type AssigneeOption = {
  userId: string;
  label: string;
};

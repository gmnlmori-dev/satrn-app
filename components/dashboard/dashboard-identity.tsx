import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";
import { uiCaption } from "@/lib/typography";
import type { ProfileSummary } from "@/types/profile";

export function DashboardIdentity({
  profile,
}: {
  profile: ProfileSummary | null;
}) {
  if (!profile) return null;

  const displayName =
    profile.fullName.trim() || profile.email.trim() || "Utente";
  const teamLabel = profile.teamName?.trim() || "—";

  return (
    <section
      className={cn(uiCard, "px-4 py-4 sm:px-5 sm:py-5")}
      aria-label="Profilo operativo"
    >
      <dl className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        <div className="min-w-0">
          <dt className={uiCaption}>Chi sei</dt>
          <dd className="mt-1 truncate text-sm font-medium text-fg-primary">
            {displayName}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={uiCaption}>Ruolo</dt>
          <dd className="mt-1 text-sm font-medium text-fg-primary">
            {appRoleLabel[profile.role]}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={uiCaption}>Team</dt>
          <dd className="mt-1 truncate text-sm font-medium text-fg-primary">
            {teamLabel}
          </dd>
        </div>
      </dl>
    </section>
  );
}

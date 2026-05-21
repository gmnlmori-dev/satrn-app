"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminTeamEditForm } from "@/components/settings/admin-team-edit-form";
import type { TeamSummary } from "@/types/team";

export function AdminTeamEditSheet({
  open,
  team,
  onClose,
}: {
  open: boolean;
  team: TeamSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!team) return null;

  return (
    <AdminSlideOver
      open={open}
      onClose={onClose}
      title="Modifica team"
      description="Aggiorna nome, slug o stato del team."
    >
      <AdminTeamEditForm
        team={team}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

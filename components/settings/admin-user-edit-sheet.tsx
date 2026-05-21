"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminUserEditForm } from "@/components/settings/admin-user-edit-form";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

export function AdminUserEditSheet({
  open,
  user,
  teams,
  onClose,
}: {
  open: boolean;
  user: ProfileSummary | null;
  teams: TeamSelectOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  if (!user) return null;

  return (
    <AdminSlideOver
      open={open}
      onClose={onClose}
      title="Modifica utente"
      description="Aggiorna profilo, permessi o password di accesso."
    >
      <AdminUserEditForm
        user={user}
        teams={teams}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminAnnouncementCreateForm } from "@/components/settings/admin-announcement-create-form";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

export function AdminAnnouncementCreateSheet({
  open,
  onClose,
  teams,
  profiles,
}: {
  open: boolean;
  onClose: () => void;
  teams: TeamSelectOption[];
  profiles: ProfileSummary[];
}) {
  const router = useRouter();

  return (
    <AdminSlideOver
      open={open}
      onClose={onClose}
      title="Nuova novità"
      description="Comunica aggiornamenti dell'app a tutti o a destinatari mirati."
    >
      <AdminAnnouncementCreateForm
        teams={teams}
        profiles={profiles}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

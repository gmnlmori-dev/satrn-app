"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminAnnouncementEditForm } from "@/components/settings/admin-announcement-edit-form";
import type { AppAnnouncement } from "@/types/announcement";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

export function AdminAnnouncementEditSheet({
  open,
  announcement,
  onClose,
  teams,
  profiles,
}: {
  open: boolean;
  announcement: AppAnnouncement | null;
  onClose: () => void;
  teams: TeamSelectOption[];
  profiles: ProfileSummary[];
}) {
  const router = useRouter();

  return (
    <AdminSlideOver
      open={open && announcement != null}
      onClose={onClose}
      title="Modifica novità"
      description="Aggiorna titolo, contenuto, destinatari o finestra di visibilità."
    >
      {announcement ? (
        <AdminAnnouncementEditForm
          announcement={announcement}
          teams={teams}
          profiles={profiles}
          onCancel={onClose}
          onSuccess={() => {
            onClose();
            router.refresh();
          }}
        />
      ) : null}
    </AdminSlideOver>
  );
}

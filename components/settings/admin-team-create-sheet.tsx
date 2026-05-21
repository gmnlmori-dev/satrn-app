"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminTeamCreateForm } from "@/components/settings/admin-team-create-form";

export function AdminTeamCreateSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <AdminSlideOver
      open={open}
      onClose={onClose}
      title="Nuovo team"
      description="Crea un team per isolare utenti, richieste e inbox."
    >
      <AdminTeamCreateForm
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

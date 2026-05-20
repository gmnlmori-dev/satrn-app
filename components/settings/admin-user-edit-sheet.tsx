"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminUserEditForm } from "@/components/settings/admin-user-edit-form";
import type { ProfileSummary } from "@/types/profile";

export function AdminUserEditSheet({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: ProfileSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!user) return null;

  return (
    <AdminSlideOver
      open={open}
      onClose={onClose}
      title="Modifica utente"
      description={user.email || user.userId}
    >
      <AdminUserEditForm
        user={user}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

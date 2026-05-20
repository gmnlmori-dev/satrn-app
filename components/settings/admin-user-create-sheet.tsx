"use client";

import { useRouter } from "next/navigation";
import { AdminSlideOver } from "@/components/settings/admin-slide-over";
import { AdminUserCreateForm } from "@/components/settings/admin-user-create-form";

export function AdminUserCreateSheet({
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
      title="Nuovo utente"
      description="Crea un account Supabase Auth collegato al profilo interno."
    >
      <AdminUserCreateForm
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
      />
    </AdminSlideOver>
  );
}

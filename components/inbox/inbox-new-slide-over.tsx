"use client";

import { useRouter } from "next/navigation";
import { AppSlideOver } from "@/components/app/app-slide-over";
import { InboxNewForm } from "@/components/inbox/inbox-new-form";

export function InboxNewSlideOver({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <AppSlideOver
      open={open}
      onClose={onClose}
      title="Nuovo inbox"
      description="Registra un messaggio grezzo da convertire in progetto in un secondo momento."
      slideFrom="left"
      portal
    >
      <InboxNewForm
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
        onCancel={onClose}
      />
    </AppSlideOver>
  );
}

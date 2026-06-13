"use client";

import { useRouter } from "next/navigation";
import { AppSlideOver } from "@/components/app/app-slide-over";
import { NewRequestForm } from "@/components/requests/new-request-form";

export function NewRequestSlideOver({
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
      title="Nuova richiesta"
      description="Apri una richiesta cliente con i dati essenziali; potrai completarla dal dettaglio."
      slideFrom="left"
      portal
    >
      <NewRequestForm
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
        onCancel={onClose}
      />
    </AppSlideOver>
  );
}

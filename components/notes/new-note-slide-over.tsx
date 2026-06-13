"use client";

import { useRouter } from "next/navigation";
import { AppSlideOver } from "@/components/app/app-slide-over";
import { NewNoteForm } from "@/components/notes/new-note-form";

export function NewNoteSlideOver({
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
      title="Nuova nota"
      description="Appunti visibili al team o condivisi con persone selezionate."
      slideFrom="left"
      portal
    >
      <NewNoteForm
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
        onCancel={onClose}
      />
    </AppSlideOver>
  );
}

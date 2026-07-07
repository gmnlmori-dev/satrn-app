"use client";

import { useRouter } from "next/navigation";
import { AppSlideOver } from "@/components/app/app-slide-over";
import { NewTaskForm } from "@/components/tasks/new-task-form";

export function NewTaskSlideOver({
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
      title="Nuova task"
      description="Azione operativa senza legame a un progetto cliente."
      slideFrom="left"
      portal
    >
      <NewTaskForm
        onSuccess={() => {
          onClose();
          router.refresh();
        }}
        onCancel={onClose}
      />
    </AppSlideOver>
  );
}

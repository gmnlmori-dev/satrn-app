"use client";

import type { ReactNode } from "react";
import { AppSlideOver } from "@/components/app/app-slide-over";

export function AdminSlideOver({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <AppSlideOver
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      slideFrom="left"
      portal
    >
      {children}
    </AppSlideOver>
  );
}

import type { InboxItemStatus } from "@/types/inbox";
import type { RequestPriority, RequestStatus } from "@/types/request";

export const statusLabel: Record<RequestStatus, string> = {
  new: "Nuova",
  in_review: "In valutazione",
  waiting: "In attesa",
  follow_up: "Da seguire",
  closed: "Chiusa",
};

export const priorityLabel: Record<RequestPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

export const inboxStatusLabel: Record<InboxItemStatus, string> = {
  new: "Nuovo",
  reviewed: "Esaminato",
  converted: "Convertito",
  archived: "Archiviato",
};

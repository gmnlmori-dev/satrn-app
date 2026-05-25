import type { RequestActivityType } from "@/types/activity";
import type { InboxItemStatus } from "@/types/inbox";
import type { AppRole } from "@/types/profile";
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

export const activityTypeLabel: Record<RequestActivityType, string> = {
  request_created: "Creazione",
  status_changed: "Stato",
  priority_changed: "Priorità",
  next_action_updated: "Prossima azione",
  assigned_user_changed: "Assegnazione",
  note_added: "Nota",
  converted_from_inbox: "Inbox",
};

export const appRoleLabel: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  operator: "Operatore",
};

export const announcementAudienceLabel = {
  all: "Tutti",
  team: "Team",
  user: "Utente",
} as const;

export type RequestActivityType =
  | "request_created"
  | "status_changed"
  | "priority_changed"
  | "next_action_updated"
  | "note_added"
  | "converted_from_inbox";

export interface RequestActivity {
  id: string;
  requestId: string;
  type: RequestActivityType;
  body: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

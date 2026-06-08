import { legacyAssigneeFieldsFromAssignees } from "@/lib/request-assignees";
import type {
  InboxItemRowWithAssignee,
  RequestActivityRow,
  RequestNoteRow,
  RequestRowWithAssignee,
  TeamNoteRowWithRelations,
} from "@/types/database";
import type { RequestActivity } from "@/types/activity";
import type { InboxItem } from "@/types/inbox";
import type { TeamNote } from "@/types/note";
import { parseNoteColor } from "@/lib/team-note-access";
import type { Request, RequestAssignee, RequestNote } from "@/types/request";

export function requestActivityRowToActivity(row: RequestActivityRow): RequestActivity {
  return {
    id: row.id,
    requestId: row.request_id,
    type: row.type,
    body: row.body,
    meta: row.meta,
    createdAt: row.created_at,
  };
}

function assigneeDisplayName(
  a: { full_name?: string | null; email?: string | null } | null | undefined,
): string | null {
  if (!a) return null;
  const name = (a.full_name ?? "").trim();
  if (name) return name;
  const mail = (a.email ?? "").trim();
  return mail || null;
}

function profileDisplayName(
  p: RequestRowWithAssignee["creator"],
): string | null {
  if (!p) return null;
  const name = (p.full_name ?? "").trim();
  if (name) return name;
  const mail = (p.email ?? "").trim();
  return mail || null;
}

function mapRequestAssignees(row: RequestRowWithAssignee): RequestAssignee[] {
  const junction = row.request_assignees ?? [];
  if (junction.length > 0) {
    return junction
      .map((entry) => ({
        userId: entry.user_id,
        label:
          assigneeDisplayName(entry.assignee) ??
          entry.user_id,
        assignedAt: entry.assigned_at,
      }))
      .sort(
        (a, b) =>
          new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
      );
  }

  if (row.assigned_user_id) {
    return [
      {
        userId: row.assigned_user_id,
        label:
          assigneeDisplayName(row.assignee) ??
          row.assigned_user_id,
        assignedAt: row.assigned_at ?? row.updated_at,
      },
    ];
  }

  return [];
}

export function requestRowToRequest(row: RequestRowWithAssignee): Request {
  const assignees = mapRequestAssignees(row);
  const legacy = legacyAssigneeFieldsFromAssignees(assignees);

  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    source: row.source,
    status: row.status,
    priority: row.priority,
    description: row.description,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    lastInteractionAt: row.last_interaction_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignees,
    assignedUserId: legacy.assignedUserId,
    assignedAt: legacy.assignedAt,
    assignedToLabel: legacy.assignedToLabel,
    teamId: row.team_id,
    teamName: row.team?.name?.trim() || null,
    createdByUserId: row.created_by_user_id ?? null,
    createdByLabel: profileDisplayName(row.creator),
  };
}

export function requestNoteRowToNote(row: RequestNoteRow): RequestNote {
  return {
    id: row.id,
    requestId: row.request_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function inboxItemRowToInboxItem(row: InboxItemRowWithAssignee): InboxItem {
  return {
    id: row.id,
    source: row.source,
    subject: row.subject,
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    rawContent: row.raw_content,
    status: row.status,
    linkedRequestId: row.linked_request_id,
    teamId: row.team_id,
    assignedUserId: row.assigned_user_id,
    assignedAt: row.assigned_at,
    assignedToLabel: assigneeDisplayName(row.assignee),
    createdByUserId: row.created_by_user_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function teamNoteRowToNote(row: TeamNoteRowWithRelations): TeamNote {
  return {
    id: row.id,
    teamId: row.team_id,
    createdByUserId: row.created_by_user_id,
    createdByLabel: profileDisplayName(row.creator),
    title: row.title,
    body: row.body,
    visibility: row.visibility,
    isPinned: row.is_pinned,
    isArchived: row.is_archived,
    color: parseNoteColor(row.color),
    sortOrder: row.sort_order ?? 0,
    sharedUserIds: (row.team_note_shared_users ?? []).map((s) => s.user_id),
    sharedTeamIds: (row.team_note_shared_teams ?? []).map((s) => s.team_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

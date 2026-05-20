import { notFound } from "next/navigation";
import { RequestDetailWorkspace } from "@/components/requests/request-detail-workspace";
import { canAssignRequests } from "@/lib/permissions";
import { getRequestActivities } from "@/lib/supabase/activity-queries";
import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import { getRequestById, getRequestNotes } from "@/lib/supabase/queries";

type Props = { params: Promise<{ id: string }> };

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getRequestById(id);
  if (!request) notFound();

  const [notes, activities, profile, assignees] = await Promise.all([
    getRequestNotes(id),
    getRequestActivities(id),
    getCurrentProfileSummary(),
    getActiveAssigneeOptions(),
  ]);

  return (
    <RequestDetailWorkspace
      key={id}
      initialRequest={request}
      initialNotes={notes}
      initialActivities={activities}
      canAssignRequests={canAssignRequests(profile?.role ?? "operator")}
      assigneeOptions={assignees}
    />
  );
}

import { notFound } from "next/navigation";
import { RequestDetailWorkspace } from "@/components/requests/request-detail-workspace";
import { getRequestActivities } from "@/lib/supabase/activity-queries";
import { getRequestById, getRequestNotes } from "@/lib/supabase/queries";

type Props = { params: Promise<{ id: string }> };

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getRequestById(id);
  if (!request) notFound();

  const [notes, activities] = await Promise.all([
    getRequestNotes(id),
    getRequestActivities(id),
  ]);

  return (
    <RequestDetailWorkspace
      key={id}
      initialRequest={request}
      initialNotes={notes}
      initialActivities={activities}
    />
  );
}

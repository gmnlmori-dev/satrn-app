import { Suspense } from "react";
import { NotesWorkspace } from "@/components/notes/notes-workspace";
import { getTeamNotes } from "@/lib/supabase/note-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamTags } from "@/lib/supabase/tag-queries";

export const metadata = {
  title: "Note",
};

export default async function NotesPage() {
  const [notes, profile] = await Promise.all([
    getTeamNotes(),
    getCurrentProfileSummary(),
  ]);
  const teamTags = await getTeamTags(
    profile?.role === "admin" ? undefined : profile?.teamId,
  );

  return (
    <Suspense fallback={null}>
      <NotesWorkspace
        notes={notes}
        currentUserId={profile?.userId ?? ""}
        teamId={profile?.teamId ?? ""}
        teamTags={teamTags}
      />
    </Suspense>
  );
}

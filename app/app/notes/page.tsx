import { Suspense } from "react";
import { NotesWorkspace } from "@/components/notes/notes-workspace";
import { getTeamNotes } from "@/lib/supabase/note-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export const metadata = {
  title: "Note",
};

export default async function NotesPage() {
  const [notes, profile] = await Promise.all([
    getTeamNotes(),
    getCurrentProfileSummary(),
  ]);

  return (
    <Suspense fallback={null}>
      <NotesWorkspace
        notes={notes}
        currentUserId={profile?.userId ?? ""}
        teamId={profile?.teamId ?? ""}
      />
    </Suspense>
  );
}

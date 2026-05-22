import { Suspense } from "react";
import { InboxWorkspace } from "@/components/inbox/inbox-workspace";
import { getInboxItems } from "@/lib/supabase/inbox-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { resolveDefaultAssignScope } from "@/lib/user-preferences";

export const metadata = {
  title: "Inbox",
};

export default async function InboxPage() {
  const [items, profile] = await Promise.all([
    getInboxItems(),
    getCurrentProfileSummary(),
  ]);
  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";

  return (
    <Suspense fallback={null}>
      <InboxWorkspace
        items={items}
        currentUserId={profile?.userId ?? ""}
        defaultScope={defaultScope}
      />
    </Suspense>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InboxUnconvertedActions } from "@/components/inbox/inbox-unconverted-actions";
import { InboxStatusControls } from "@/components/inbox/inbox-status-controls";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { Panel } from "@/components/ui/panel";
import { formatDateTime } from "@/lib/date";
import { inboxStatusLabel } from "@/lib/labels";
import { isInboxEnabledServer } from "@/lib/supabase/app-settings-queries";
import { getInboxItemById } from "@/lib/supabase/inbox-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiPageLead, uiPageTitle } from "@/lib/typography";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInboxItemById(id);
  if (!item) return { title: "Inbox" };
  return { title: item.subject || "Inbox" };
}

export default async function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isInboxEnabledServer())) {
    redirect("/app/dashboard");
  }

  const { id } = await params;
  const [item, profile] = await Promise.all([
    getInboxItemById(id),
    getCurrentProfileSummary(),
  ]);
  if (!item) notFound();

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>
          {item.subject || "Senza oggetto"}
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ingresso registrato manualmente · stato {inboxStatusLabel[item.status]}
          {item.linkedRequestId ? " · collegato a un progetto esistente." : "."}
        </p>
      </header>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className={uiFormLabel}>Fonte</p>
              <p className="text-fg-primary">
                {item.source || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Mittente</p>
              <p className="text-fg-primary">
                {item.senderName || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Email mittente</p>
              <p className="break-all text-fg-primary">
                {item.senderEmail || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Ricevuto</p>
              <p className="tabular-nums text-fg-primary">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Aggiornato</p>
              <p className="tabular-nums text-fg-primary">
                {formatDateTime(item.updatedAt)}
              </p>
            </div>
          </div>
          <div className="sm:pt-1">
            <p className={`${uiFormLabel} mb-2`}>Stato</p>
            <InboxStatusControls item={item} />
          </div>
        </div>

        {item.linkedRequestId ? (
          <div className="mt-5 border-t border-line-default pt-5">
            <Link
              href={`/app/requests/${item.linkedRequestId}`}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "inline-flex font-semibold text-accent underline-offset-2 hover:underline",
              )}
            >
              Apri progetto collegato
            </Link>
          </div>
        ) : null}
      </Panel>

      <Panel className={cn(!item.linkedRequestId && "pb-5")}>
        <h2 className="text-[15px] font-semibold text-fg-primary">
          Contenuto grezzo
        </h2>
        {item.rawContent?.trim() ? (
          <pre
            className={cn(
              "mt-3 max-h-[min(28rem,55vh)] overflow-auto whitespace-pre-wrap rounded-[10px] border border-line-default bg-field p-4 text-[13px] leading-relaxed text-fg-primary",
            )}
          >
            {item.rawContent}
          </pre>
        ) : (
          <AppEmptyHint
            className="mt-3"
            title="Nessun testo incollato"
            description="Il contenuto grezzo non è presente. Puoi aggiornare l’ingresso se ti serve recuperare il messaggio originale."
          />
        )}
      </Panel>

      {!item.linkedRequestId ? (
        <InboxUnconvertedActions
          item={item}
          currentUserId={profile?.userId ?? ""}
        />
      ) : null}
    </div>
  );
}

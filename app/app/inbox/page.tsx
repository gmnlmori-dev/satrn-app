import { InboxListTable } from "@/components/inbox/inbox-list-table";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { getInboxItems } from "@/lib/supabase/inbox-queries";
import { cn } from "@/lib/cn";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export const metadata = {
  title: "Inbox",
};

export default async function InboxPage() {
  const items = await getInboxItems();

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>
          Inbox
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Raccogli testi grezzi da email, chat o note; dal dettaglio puoi convertirli in una richiesta strutturata.
        </p>
      </header>

      {items.length === 0 ? (
        <AppEmptyState
          icon="inbox"
          title="Nessun ingresso registrato"
          description="Quando arrivano messaggi, email o appunti da sistemare prima di aprire una richiesta, aggiungili con Crea → Nuovo inbox nella barra laterale."
        />
      ) : (
        <InboxListTable items={items} />
      )}
    </div>
  );
}

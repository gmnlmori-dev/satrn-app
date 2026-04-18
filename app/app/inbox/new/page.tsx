import { InboxNewForm } from "@/components/inbox/inbox-new-form";
import { cn } from "@/lib/cn";
import { uiPageLead } from "@/lib/typography";

export const metadata = {
  title: "Nuovo ingresso",
};

export default function InboxNewPage() {
  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Nuovo ingresso inbox
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Incolla o scrivi il contenuto così com&apos;è arrivato; potrai classificarlo e convertirlo in una richiesta dal dettaglio.
        </p>
      </header>
      <InboxNewForm />
    </div>
  );
}

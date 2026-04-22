import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export default function RequestNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className={uiPageTitle}>
        Richiesta non trovata
      </h1>
      <p className={cn(uiPageLead, "mt-2")}>
        L’identificativo non corrisponde a nessuna richiesta nel database.
      </p>
      <Link
        href="/app/requests"
        className={cn(
          uiBtnSecondary,
          "mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm",
        )}
      >
        Torna alle richieste
      </Link>
    </div>
  );
}

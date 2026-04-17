import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { uiPageLead } from "@/lib/typography";

export default function RequestNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Richiesta non trovata
      </h2>
      <p className={cn(uiPageLead, "mt-2")}>
        L’identificativo non corrisponde a nessuna richiesta nel database.
      </p>
      <Link
        href="/app/requests"
        className={cn(
          uiTransition,
          uiFocusRingOffset,
          "mt-6 inline-block rounded-md text-[15px] font-semibold text-slate-700 underline-offset-2 hover:underline dark:text-slate-300"
        )}
      >
        Torna alle richieste
      </Link>
    </div>
  );
}

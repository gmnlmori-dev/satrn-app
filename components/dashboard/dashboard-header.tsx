import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { uiBtnSecondary } from "@/lib/ui-classes";

export function DashboardHeader() {
  return (
    <PageHeader
      title="Operazioni"
      lead="Ritardi, scadenze, inbox e attività recenti — punto di partenza della giornata."
      actions={
        <>
          <Link href="/app/follow-up" className={uiBtnSecondary}>
            Da seguire
          </Link>
          <Link href="/app/requests" className={uiBtnSecondary}>
            Richieste
          </Link>
        </>
      }
    />
  );
}

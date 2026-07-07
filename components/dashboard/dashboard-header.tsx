import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { uiBtnSecondary } from "@/lib/ui-classes";

export function DashboardHeader() {
  return (
    <PageHeader
      title="Dashboard"
      lead="Il tuo punto di partenza: carico personale, coda del team e accesso rapido alle scrivanie."
      actions={
        <>
          <Link href="/app/follow-up" className={uiBtnSecondary}>
            Da seguire
          </Link>
          <Link href="/app/requests" className={uiBtnSecondary}>
            Progetti
          </Link>
        </>
      }
    />
  );
}

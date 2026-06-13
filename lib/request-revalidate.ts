import { revalidatePath } from "next/cache";

/** Invalida le viste che dipendono da richieste (liste, dashboard, follow-up, calendario). */
export function revalidateRequestViews(requestId?: string) {
  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");
  if (requestId) {
    revalidatePath(`/app/requests/${requestId}`);
  }
}

/** Invalida le viste inbox e dashboard. */
export function revalidateInboxViews(inboxItemId?: string) {
  revalidatePath("/app/inbox");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/dashboard");
  if (inboxItemId) {
    revalidatePath(`/app/inbox/${inboxItemId}`);
  }
}

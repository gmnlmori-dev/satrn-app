import { revalidatePath } from "next/cache";

export function revalidateTaskViews() {
  revalidatePath("/app/tasks");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
}

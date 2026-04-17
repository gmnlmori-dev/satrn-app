import { redirect } from "next/navigation";

export default function LegacyNewRequestPage() {
  redirect("/app/requests?nuova=1");
}

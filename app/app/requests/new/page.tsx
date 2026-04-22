import { redirect } from "next/navigation";

export const metadata = {
  title: "Nuova richiesta",
};

export default function LegacyNewRequestPage() {
  redirect("/app/requests?nuova=1");
}

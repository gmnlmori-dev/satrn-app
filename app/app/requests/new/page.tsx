import { redirect } from "next/navigation";

export const metadata = {
  title: "Nuovo progetto",
};

export default function LegacyNewRequestPage() {
  redirect("/app/requests?nuova=1");
}

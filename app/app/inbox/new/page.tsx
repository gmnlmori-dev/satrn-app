import { redirect } from "next/navigation";

export const metadata = {
  title: "Nuovo inbox",
};

export default function InboxNewPage() {
  redirect("/app/inbox?nuova=1");
}

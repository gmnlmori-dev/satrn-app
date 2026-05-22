import { redirect } from "next/navigation";

export default function NewNotePage() {
  redirect("/app/notes?nuova=1");
}

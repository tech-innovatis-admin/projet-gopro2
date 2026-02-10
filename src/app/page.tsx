import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona a raiz (/) para /home (dashboard)
  redirect("/home");
}

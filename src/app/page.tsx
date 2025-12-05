import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona a raiz (/) para /home (dashboard)
  // O middleware já garante que só usuários autenticados cheguem aqui
  redirect("/home");
}

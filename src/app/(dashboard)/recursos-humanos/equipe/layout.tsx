import type { ReactNode } from "react";
import { redirect } from "next/navigation";

export default function EquipeLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  redirect("/admin/usuarios");
}

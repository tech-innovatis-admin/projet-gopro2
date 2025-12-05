// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold mb-2">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        A página que você tentou acessar não existe ou foi movida.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Ir para o dashboard
        </Link>
        <Link
          href="/login"
          className="text-sm underline"
        >
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}

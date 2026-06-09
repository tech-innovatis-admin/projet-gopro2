 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFrameReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <iframe
        src="/ceo-easteregg.html"
        title="Easter egg"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => setFrameReady(true)}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/45" />

      <section
        className={`relative z-10 flex min-h-screen items-end justify-center px-4 pb-16 transition-opacity duration-500 md:pb-24 ${
          frameReady ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="floating-card w-full max-w-3xl rounded-2xl border border-white/25 bg-black/35 p-5 text-white shadow-2xl backdrop-blur-lg md:p-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-semibold md:text-3xl">Essa página não existe, Jovem!</h1>
              <p className="text-sm text-white/85 md:text-base">
                Clique no botão ao lado para voltar ao dashboard.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .floating-card {
          will-change: transform;
          transform: translate3d(0, 0, 0);
          animation: cardFloat 6.5s ease-in-out infinite;
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -5px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-card {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

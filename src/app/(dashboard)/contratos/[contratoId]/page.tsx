"use client";

import { useParams } from "next/navigation";
import { NavBar } from "@/components/ui/NavBar";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                  Detalhes do Projeto
                </h1>
                <p className="text-zinc-600">
                  Projeto ID: {projectId}
                </p>
              </div>
            </div>
          </div>

          {/* Project Content */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
            <p className="text-zinc-600">
              Conteúdo detalhado do projeto será implementado aqui.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

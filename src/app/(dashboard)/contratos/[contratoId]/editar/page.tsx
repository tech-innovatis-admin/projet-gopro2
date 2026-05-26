"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditarContratoPage() {
  const params = useParams();
  const router = useRouter();
  const contratoId = params.contratoId as string;

  useEffect(() => {
    if (!contratoId) return;
    router.replace(`/contratos/novo-contrato?editContractId=${contratoId}`);
  }, [contratoId, router]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
      <p className="text-sm text-gray-600">Redirecionando para edição do contrato...</p>
    </div>
  );
}
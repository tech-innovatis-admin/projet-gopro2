"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getPartnerById, updatePartner } from "@/src/lib/api/endpoints";
import { Parceiro } from "../../types";
import {
  getFriendlyApiError,
  mapParceiroFormToPartnerRequestDTO,
  mapPartnerToParceiro,
} from "../../mappers";

export default function EditarParceiroPage() {
  const params = useParams();
  const router = useRouter();
  const parceiroId = params.parceiroId as string;

  const [formData, setFormData] = useState<Partial<Parceiro>>({});
  const [originalData, setOriginalData] = useState<Parceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔥 Carrega parceiro REAL (igual tela de detalhe)
  useEffect(() => {
    async function load() {
      try {
        const response = await getPartnerById(parceiroId);

        const parceiro = mapPartnerToParceiro(response, []);

        setOriginalData(parceiro);
        setFormData(parceiro);
      } catch {
        alert("Erro ao carregar parceiro");
        router.push("/parceiros");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [parceiroId]);

  // Detecta alterações
  useEffect(() => {
    if (!originalData) return;
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  // Validação
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔥 PUT no backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);

    try {
      const payload = mapParceiroFormToPartnerRequestDTO({
        nome: formData.nome?.trim() ?? "",
        sigla: formData.sigla?.trim() || undefined,
        tipo: formData.tipo ?? "FUNDACAO",
        cnpj: formData.cnpj ?? "",
        email: formData.email?.trim() || undefined,
        telefone: formData.telefone?.trim() || undefined,
        site: formData.site?.trim() || undefined,
        cep: formData.cep?.trim() || undefined,
        uf: formData.uf?.trim() ?? "",
        municipio: formData.municipio?.trim() ?? "",
        endereco: formData.endereco?.trim() || undefined,
        status: formData.status ?? "ATIVO",
      });

      await updatePartner(parceiroId, payload);

      alert("Parceiro atualizado com sucesso!");
      router.push(`/parceiros/${parceiroId}`);
    } catch (error) {
      alert(getFriendlyApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Aviso */}
        {hasChanges && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700">
              Você tem alterações não salvas.
            </p>
          </div>
        )}

        {/* Dados básicos */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-lg font-semibold">Dados Básicos</h3>

          <input
            type="text"
            value={formData.nome || ""}
            onChange={(e) =>
              setFormData({ ...formData, nome: e.target.value })
            }
            placeholder="Nome"
            className={cn("w-full border p-2 rounded", errors.nome && "border-red-500")}
          />
          {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}

          <input
            type="text"
            value={formData.sigla || ""}
            onChange={(e) =>
              setFormData({ ...formData, sigla: e.target.value })
            }
            placeholder="Sigla"
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            value={formData.cnpj || ""}
            onChange={(e) =>
              setFormData({ ...formData, cnpj: e.target.value })
            }
            placeholder="CNPJ"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Contato */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-lg font-semibold">Contato</h3>

          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Email"
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            value={formData.telefone || ""}
            onChange={(e) =>
              setFormData({ ...formData, telefone: e.target.value })
            }
            placeholder="Telefone"
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            value={formData.site || ""}
            onChange={(e) =>
              setFormData({ ...formData, site: e.target.value })
            }
            placeholder="Site"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Endereço */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-lg font-semibold">Endereço</h3>

          <input
            type="text"
            value={formData.endereco || ""}
            onChange={(e) =>
              setFormData({ ...formData, endereco: e.target.value })
            }
            placeholder="Endereço"
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            value={formData.municipio || ""}
            onChange={(e) =>
              setFormData({ ...formData, municipio: e.target.value })
            }
            placeholder="Município"
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            value={formData.uf || ""}
            onChange={(e) =>
              setFormData({ ...formData, uf: e.target.value })
            }
            placeholder="UF"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Observações */}
        <div className="bg-white p-6 rounded-xl border">
          <textarea
            value={formData.observacoes || ""}
            onChange={(e) =>
              setFormData({ ...formData, observacoes: e.target.value })
            }
            placeholder="Observações"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/parceiros/${parceiroId}`)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>

          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

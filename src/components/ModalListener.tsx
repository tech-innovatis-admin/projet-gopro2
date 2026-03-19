"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NovoContratoModal } from "../app/(dashboard)/contratos/_components/NovoContratoModal";
import NovoPreProjetoModal, {
  type PreProjetoFormData,
  type TipoDocumento,
} from "../app/(dashboard)/contratos/pre-projetos/_components/NovoPreProjetoModal";
import { uploadDocument } from "@/src/lib/api/endpoints/documents";
import { createProject } from "@/src/lib/api/endpoints/projects";
import type { ProjectRequestDTO } from "@/src/lib/api/types";

const DOCUMENT_CATEGORY_BY_TYPE: Record<TipoDocumento, string> = {
  contrato: "CONTRATO",
  tr: "TERMO_REFERENCIA",
  planoTrabalho: "PLANO_TRABALHO",
  outro: "OUTRO",
};

function parseCurrencyToNumber(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitLocation(location: string): { city?: string; state?: string } {
  const parts = location
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return {};
  }

  return {
    city: parts.slice(0, -1).join(" - "),
    state: parts[parts.length - 1],
  };
}

function buildPreProjectCode(): string {
  return `PRE-${Date.now().toString().slice(-8)}`;
}

/**
 * Global listener for modal open events dispatched by navigation or pages.
 */
export function ModalListener() {
  const [isNovoContratoModalOpen, setIsNovoContratoModalOpen] = useState(false);
  const [isNovoPreProjetoModalOpen, setIsNovoPreProjetoModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      const { modalName } = event.detail || {};

      switch (modalName) {
        case "novo-contrato":
          setIsNovoContratoModalOpen(true);
          break;
        case "novo-pre-projeto":
          setIsNovoPreProjetoModalOpen(true);
          break;
        default:
          console.warn(`Modal desconhecido: ${modalName}`);
      }
    };

    window.addEventListener("open-modal", handleOpenModal as EventListener);
    return () => {
      window.removeEventListener("open-modal", handleOpenModal as EventListener);
    };
  }, []);

  const handleNovoContratoSubmit = async (data: unknown) => {
    // TODO: integrate novo contrato modal with backend flow
    console.log("Novo contrato criado:", data);

    window.dispatchEvent(new CustomEvent("contrato-criado", { detail: data }));
    setIsNovoContratoModalOpen(false);

    if (!window.location.pathname.startsWith("/contratos")) {
      router.push("/contratos");
      router.refresh();
    }
  };

  const handleNovoPreProjetoSubmit = async (data: PreProjetoFormData) => {
    if (!data.primaryPartnerId || !data.primaryClientId) {
      throw new Error("Selecione parceiro primario e cliente primario.");
    }

    const contractValue = parseCurrencyToNumber(data.valorTotal);
    const { city, state } = splitLocation(data.localidade);

    const payload: ProjectRequestDTO = {
      name: data.titulo.trim(),
      code: buildPreProjectCode(),
      projectStatus: "PRE_PROJETO",
      object: data.objeto.trim(),
      primaryPartnerId: data.primaryPartnerId,
      primaryClientId: data.primaryClientId,
      projectGovIf: data.govIf === "Gov" ? "GOV" : "IF",
      projectType: data.tipo || undefined,
      contractValue: contractValue > 0 ? contractValue : undefined,
      city,
      state,
      executionLocation: data.localidade.trim() || undefined,
      executedByInnovatis: false,
    };

    const createdProject = await createProject(payload);

    const uploadedDocumentIds: Partial<Record<TipoDocumento, string>> = {};
    const failedUploads: TipoDocumento[] = [];

    const documentsEntries = Object.entries(data.documentos) as Array<
      [TipoDocumento, File | undefined]
    >;

    for (const [docType, file] of documentsEntries) {
      if (!file) {
        continue;
      }

      try {
        const uploaded = await uploadDocument({
          file,
          ownerType: "PROJECT",
          ownerId: createdProject.id,
          category: DOCUMENT_CATEGORY_BY_TYPE[docType],
        });
        uploadedDocumentIds[docType] = uploaded.id;
      } catch (uploadError) {
        console.error("Falha no upload do documento", {
          docType,
          projectId: createdProject.id,
          error: uploadError,
        });
        failedUploads.push(docType);
      }
    }

    window.dispatchEvent(
      new CustomEvent("pre-projeto-criado", {
        detail: {
          id: String(createdProject.id),
          titulo: createdProject.name,
          govIf: createdProject.projectGovIf === "GOV" ? "Gov" : "IF",
          tipo: createdProject.projectType === "PRODUTO" ? "PRODUTO" : "PROJETO",
          parceiro: data.primaryPartnerName || "Não informado",
          localidade: createdProject.executionLocation || data.localidade || "Não informado",
          valorTotal: createdProject.contractValue ?? contractValue,
          dataCriacao: createdProject.createdAt ?? new Date().toISOString(),
          documentos: uploadedDocumentIds,
          uploadWarnings: failedUploads,
        },
      })
    );

    setIsNovoPreProjetoModalOpen(false);

    if (!window.location.pathname.startsWith("/contratos/pre-projetos")) {
      router.push("/contratos/pre-projetos");
      router.refresh();
    } else if (failedUploads.length > 0) {
      console.warn("Pre-contrato criado, mas houve falha no upload de documentos", {
        projectId: createdProject.id,
        failedUploads,
      });
    }
  };

  return (
    <>
      <NovoContratoModal
        isOpen={isNovoContratoModalOpen}
        onClose={() => setIsNovoContratoModalOpen(false)}
        onSubmit={handleNovoContratoSubmit}
      />
      <NovoPreProjetoModal
        isOpen={isNovoPreProjetoModalOpen}
        onClose={() => setIsNovoPreProjetoModalOpen(false)}
        onSubmit={handleNovoPreProjetoSubmit}
      />
    </>
  );
}

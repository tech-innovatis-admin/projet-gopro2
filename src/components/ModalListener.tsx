"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NovoContratoModal } from "../app/(dashboard)/contratos/_components/NovoContratoModal";
import { NovoPreProjetoModal } from "../app/(dashboard)/contratos/pre-projetos/_components";

/**
 * Componente global que escuta eventos de abertura de modais
 * disparados pela navegação ou outros componentes.
 * 
 * Adicione este componente no layout principal para habilitar
 * a abertura de modais de qualquer lugar da aplicação.
 */
export function ModalListener() {
  const [isNovoContratoModalOpen, setIsNovoContratoModalOpen] = useState(false);
  const [isNovoPreProjetoModalOpen, setIsNovoPreProjetoModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      const { modalName } = event.detail || {};

      switch (modalName) {
        case 'novo-contrato':
          setIsNovoContratoModalOpen(true);
          break;
        case 'novo-pre-projeto':
          setIsNovoPreProjetoModalOpen(true);
          break;
        // Adicione mais modais aqui conforme necessário
        default:
          console.warn(`Modal desconhecido: ${modalName}`);
      }
    };

    window.addEventListener('open-modal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('open-modal', handleOpenModal as EventListener);
    };
  }, []);

  const handleNovoContratoSubmit = async (data: any) => {
    // TODO: Integrar com API real
    console.log("Novo contrato criado:", data);
    
    // Dispara evento para notificar outras páginas sobre o novo contrato
    window.dispatchEvent(new CustomEvent('contrato-criado', { detail: data }));
    
    // Fecha o modal
    setIsNovoContratoModalOpen(false);
    
    // Se não estiver na página de contratos, redireciona
    if (!window.location.pathname.startsWith('/contratos')) {
      router.push('/contratos');
      router.refresh();
    }
  };

  const handleNovoPreProjetoSubmit = async (data: any) => {
    // TODO: Integrar com API real
    console.log("Novo pré-projeto criado:", data);
    
    // Dispara evento para notificar outras páginas sobre o novo pré-projeto
    window.dispatchEvent(new CustomEvent('pre-projeto-criado', { detail: data }));
    
    // Fecha o modal
    setIsNovoPreProjetoModalOpen(false);
    
    // Se não estiver na página de pré-projetos, redireciona
    if (!window.location.pathname.startsWith('/contratos/pre-projetos')) {
      router.push('/contratos/pre-projetos');
      router.refresh();
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
      {/* Adicione outros modais globais aqui */}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessToastProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  duration?: number;
}

export function SuccessToast({
  show,
  onClose,
  title = "Criado com sucesso",
  message = "O contrato foi cadastrado no sistema",
  duration = 5000,
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      // Pequeno delay para permitir a animação de entrada
      requestAnimationFrame(() => {
        setIsVisible(true);
      });

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onClose();
    }, 300);
  };

  if (!show && !isVisible) return null;

  return (
    <div
      className={`
        fixed top-6 right-6 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Barra de progresso animada */}
        <div className="h-1 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all ease-linear"
            style={{
              width: isVisible && !isLeaving ? "0%" : "100%",
              transitionDuration: `${duration}ms`,
            }}
          />
        </div>

        <div className="p-4 flex items-start gap-3">
          {/* Ícone */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>

          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1.5 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

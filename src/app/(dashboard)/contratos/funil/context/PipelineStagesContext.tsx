"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { type InitiationStage, MOCK_STAGES } from "../types";

// =============================================================================
// PIPELINE STAGES CONTEXT - Compartilha estado de etapas entre páginas
// =============================================================================

type PipelineStagesContextType = {
  stages: InitiationStage[];
  updateStages: (newStages: InitiationStage[]) => void;
  resetStages: () => void;
};

const PipelineStagesContext = createContext<PipelineStagesContextType | undefined>(
  undefined
);

export function PipelineStagesProvider({ children }: { children: React.ReactNode }) {
  const [stages, setStages] = useState<InitiationStage[]>(MOCK_STAGES);

  const updateStages = useCallback((newStages: InitiationStage[]) => {
    setStages(newStages);
  }, []);

  const resetStages = useCallback(() => {
    setStages(MOCK_STAGES);
  }, []);

  return (
    <PipelineStagesContext.Provider value={{ stages, updateStages, resetStages }}>
      {children}
    </PipelineStagesContext.Provider>
  );
}

export function usePipelineStages() {
  const context = useContext(PipelineStagesContext);
  if (context === undefined) {
    throw new Error(
      "usePipelineStages deve ser usado dentro de PipelineStagesProvider"
    );
  }
  return context;
}

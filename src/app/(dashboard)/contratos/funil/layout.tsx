import { PipelineStagesProvider } from "./context/PipelineStagesContext";

export default function FunilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PipelineStagesProvider>{children}</PipelineStagesProvider>;
}

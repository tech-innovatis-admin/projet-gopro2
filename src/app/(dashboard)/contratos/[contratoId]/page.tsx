import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    contratoId: string;
  }>;
};

export default async function ContratoPage({ params }: PageProps) {
  const { contratoId } = await params;
  redirect(`/contratos/${contratoId}/meta-etapa-fase`);
}

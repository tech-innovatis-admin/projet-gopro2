import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Serviço | GoPro2",
  description: "Termos de serviço da plataforma GoPro2",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-[#004225] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <article className="bg-white rounded-2xl shadow-lg shadow-zinc-200/50 p-10 md:p-16 space-y-10">
          {/* Title */}
          <header className="space-y-4 border-b border-zinc-100 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">
              Termos de Serviço
            </h1>
            <p className="text-sm text-zinc-500">
              Última atualização: 26 de janeiro de 2026
            </p>
          </header>

          {/* Sections */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">1. Aceitação dos Termos</h2>
            <p className="text-zinc-600 leading-relaxed">
              Ao acessar e usar a plataforma GoPro2, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">2. Descrição do Serviço</h2>
            <p className="text-zinc-600 leading-relaxed">
              O GoPro2 é uma plataforma de gestão de projetos e contratos desenvolvida pela Innovatis. 
              O serviço permite o gerenciamento de contratos, documentos, equipes e fluxos de trabalho 
              relacionados a projetos institucionais.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">3. Contas de Usuário</h2>
            <p className="text-zinc-600 leading-relaxed">
              Para utilizar determinadas funcionalidades do GoPro2, você deve solicitar uma conta ao atual head do setor de Execução. 
              Você é responsável por manter a confidencialidade de suas credenciais de acesso 
              e por todas as atividades que ocorram em sua conta.
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Manter suas credenciais seguras e confidenciais</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Fornecer informações precisas e atualizadas</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">4. Uso Aceitável</h2>
            <p className="text-zinc-600 leading-relaxed">
              Você concorda em usar o GoPro2 apenas para fins legais e de acordo com estes Termos. 
              É proibido utilizar o serviço para atividades ilegais, fraudulentas ou que possam 
              prejudicar outros usuários ou a plataforma.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">5. Limitação de Responsabilidade</h2>
            <p className="text-zinc-600 leading-relaxed">
              O GoPro2 é fornecido "como está", sem garantias de qualquer tipo. A Innovatis não será 
              responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais 
              decorrentes do uso ou impossibilidade de uso do serviço.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">6. Modificações dos Termos</h2>
            <p className="text-zinc-600 leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações 
              entrarão em vigor imediatamente após a públicação. O uso contínuo do serviço após 
              as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">7. Contato</h2>
            <p className="text-zinc-600 leading-relaxed">
              Para dúvidas sobre estes Termos de Serviço, entre em contato conosco:
            </p>
            <div className="bg-zinc-50 rounded-xl p-6 text-zinc-600">
              <p><strong>Innovatis</strong></p>
              <p>Email: contato@innovatismc.com.br</p>
              <p>Website: www.innovatismc.com.br</p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
          <p>© 2026 Innovatis. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | GoPro2",
  description: "Política de privacidade da plataforma GoPro2",
};

export default function PrivacyPage() {
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
          <div className="flex items-center gap-2">
            <img src="/Logos/logo_innovatis_preta.svg" alt="Logo" className="h-6 w-6" />
            <span className="text-xl font-semibold text-zinc-900">GoPro2</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <article className="bg-white rounded-2xl shadow-lg shadow-zinc-200/50 p-10 md:p-16 space-y-10">
          {/* Title */}
          <header className="space-y-4 border-b border-zinc-100 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">
              Política de Privacidade
            </h1>
            <p className="text-sm text-zinc-500">
              Última atualização: 26 de janeiro de 2026
            </p>
          </header>

          {/* Introduction */}
          <section className="space-y-6">
            <p className="text-zinc-600 leading-relaxed">
              A Innovatis valoriza a privacidade dos usuários do GoPro2. Esta Política de Privacidade 
              descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
              quando você utiliza nossa plataforma.
            </p>
          </section>

          {/* Sections */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">1. Informações que Coletamos</h2>
            <p className="text-zinc-600 leading-relaxed">
              Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:
            </p>
            <div className="space-y-4 ml-4">
              <div>
                <h3 className="font-medium text-zinc-700 mb-2">Informações de Conta</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Nome completo e nome de usuário</li>
                  <li>Endereço de email institucional</li>
                  <li>Cargo e departamento</li>
                  <li>Informações de contato profissional</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-zinc-700 mb-2">Informações de Uso</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Logs de acesso e atividades na plataforma</li>
                  <li>Dados de navegação e interações</li>
                  <li>Informações do dispositivo e navegador</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">2. Como Usamos suas Informações</h2>
            <p className="text-zinc-600 leading-relaxed">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Fornecer, operar e manter a plataforma GoPro2</li>
              <li>Gerenciar sua conta e autenticação</li>
              <li>Personalizar sua experiência de uso</li>
              <li>Comunicar atualizações, alertas e notificações importantes</li>
              <li>Melhorar a segurança e prevenir fraudes</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">3. Compartilhamento de Dados</h2>
            <p className="text-zinc-600 leading-relaxed">
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas nas 
              seguintes circunstâncias:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Com sua organização/instituição vinculada ao contrato</li>
              <li>Com prestadores de serviço que nos auxiliam na operação da plataforma</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger direitos, propriedade ou segurança da Innovatis e usuários</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">4. Segurança dos Dados</h2>
            <p className="text-zinc-600 leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas 
              informações, incluindo:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso baseados em função (RBAC)</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e planos de recuperação</li>
              <li>Treinamento de segurança para nossa equipe</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">5. Retenção de Dados</h2>
            <p className="text-zinc-600 leading-relaxed">
              Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades 
              descritas nesta política, a menos que um período de retenção maior seja exigido ou 
              permitido por lei. Dados de contratos podem ser retidos conforme requisitos legais 
              e contratuais específicos.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">6. Alterações nesta Política</h2>
            <p className="text-zinc-600 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
              sobre mudanças significativas através da plataforma ou por email. Recomendamos 
              revisar esta página regularmente.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-800">7. Contato</h2>
            <p className="text-zinc-600 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <div className="bg-zinc-50 rounded-xl p-6 text-zinc-600">
              <p><strong>Encarregado de Proteção de Dados (DPO)</strong></p>
              <p>Innovatis</p>
              <p>Email: privacidade@innovatismc.com.br</p>
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

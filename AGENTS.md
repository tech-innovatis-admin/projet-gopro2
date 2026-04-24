# Contexto do projeto

Considere esta arquitetura como padrão:
- Front-end em Next.js App Router.
- O front usa BFF em /api/backend.
- O front é orientado a cookies/sessão e não fala diretamente com banco.
- O backend é Spring Boot separado.
- Mudanças relevantes devem ser pensadas ponta a ponta: UI, route handlers, backend, env, CORS, autenticação/autorização, contratos e deploy.

Deploy é containerizado. Sempre considere Dockerfile, build multi-stage, runtime standalone do front, profiles do Spring Boot, portas, envs e impacto de produção. Não proponha deploy “mágico” de plataforma sem aderência explícita à arquitetura atual.

## Fonte de verdade
Inspecione código, env e runtime antes de concluir qualquer coisa.
Quando documentação e código divergirem:
- sinalize a divergência;
- use o comportamento real da aplicação como evidência técnica mais forte para diagnóstico;
- consulte o usuário antes de alterar comportamento com base nessa divergência.

## Git / worktrees
- Trabalhe no worktree atual por padrão.
- Nunca assuma árvore limpa.
- Nunca reverta alteração alheia.
- Respeite worktrees paralelos.
- Prefira diffs pequenos e fáceis de revisar.

## UI / copy
- Preservar PT-BR.
- Preservar vocabulário do domínio de contratos, execução, auditoria e RH.
- Preservar identidade visual corporativa e o DNA atual da marca.
- Evitar interface genérica de “startup dashboard”.
- Evolução visual é permitida, mas sem romper a identidade existente.

## Estilo de implementação
- Preferir mudanças cirúrgicas e de baixo risco.
- Não fazer refatoração ampla por impulso.
- Não introduzir abstrações ou dependências novas sem necessidade clara e justificativa.
- Pensar sempre em compatibilidade com o padrão já existente no código.

## Segurança
- Tratar .env, .env.local, .env.example e similares como sensíveis.
- Nunca expor segredos em resposta.
- Resumir configuração sem ecoar valores.
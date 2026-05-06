# Padrão Seguro de Modais - Guia de Implementação

## Componentes Base

### 1. AppModalShell (Melhorado)
- ✅ Suporta `isDirty` - detecta formulário sujo
- ✅ Suporta `closeOnBackdropClick` - controla fechamento por backdrop
- ✅ Suporta `closeDisabled` - bloqueia fechamento durante operações
- ✅ Integra `ConfirmDiscardModal` - confirmação de descarte

### 2. ConfirmDiscardModal (Novo)
- Componente genérico de confirmação
- Reutilizável em todos os modais
- UI consistente com aviso e botões de ação

## Padrão de Uso por Tipo de Modal

### Modalfor Cadastro/Edição Crítico (Novo Contrato, Parceiro, Fornecedor)

```typescript
// Estado necessário
const [isDirty, setIsDirty] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

// Ao alterar qualquer campo
const handleFieldChange = (e) => {
  setIsDirty(true);
  // ... resto da lógica
};

// Renderizar com segurança
<AppModalShell
  isOpen={isOpen}
  title="Novo Parceiro"
  onClose={onClose}
  isDirty={isDirty}
  closeDisabled={isSubmitting}
  closeOnBackdropClick={false} // CRÍTICO: não fecha ao clicar fora
  onDiscardConfirm={() => resetForm()} // Opcional: limpeza
>
  {/* Conteúdo */}
</AppModalShell>
```

### Modal de Upload/Anexos

```typescript
// Estado
const [hasFiles, setHasFiles] = useState(false);
const [isUploading, setIsUploading] = useState(false);

// Renderizar
<AppModalShell
  isOpen={isOpen}
  title="Enviar Documentos"
  isDirty={hasFiles}
  closeDisabled={isUploading}
  closeOnBackdropClick={!hasFiles} // Permite fechar se vazio
>
  {/* Conteúdo */}
</AppModalShell>
```

### Modal Informativo Simples (Confirmação, Alerta)

```typescript
// Essas podem permitir fechar livremente
<AppModalShell
  isOpen={isOpen}
  title="Excluir Item?"
  closeOnBackdropClick={true} // OK fechar livremente
>
  {/* Conteúdo simples */}
</AppModalShell>
```

## Regras de Transição de Estado

### 1️⃣ Usuário abre o modal
- `isDirty = false`
- `closeDisabled = false`
- ✅ Pode fechar por: button X, backdrop, ESC

### 2️⃣ Usuário começa a digitar
- `isDirty = true`
- `closeDisabled = false`
- ⚠️ Tenta fechar → CONFIRMAÇÃO: "Descartar alterações?"
- ✅ Pode confirmar/cancelar descarte

### 3️⃣ Usuário clica em Salvar
- `isDirty = true`
- `closeDisabled = true` ← **BLOQUEADO**
- ❌ Não pode fechar por nenhuma forma
- ⏳ Visual de carregamento
- ✅ Botões X e cancelar ficam desabilitados

### 4️⃣ Envio completa
- `closeDisabled = false`
- `isDirty = false` (reset após sucesso)
- ✅ Modal fecha automaticamente OU
- ✅ Pode fechar manualmente

## Fluxos Testáveis

### Cenário 1: Fechar Vazio
1. Abrir modal
2. Não alterar nada
3. Clicar X, backdrop ou ESC
4. ✅ Deve fechar sem confirmação

### Cenário 2: Sair com Alterações
1. Abrir modal
2. Preencher alguns campos
3. Clicar X
4. ⚠️ Deve mostrar: "Descartar alterações?"
5. Usuário confirma
6. ✅ Modal fecha, dados perdidos

### Cenário 3: Envio em Andamento
1. Preencher formulário
2. Clicar "Salvar"
3. Durante envio, tentar:
   - Clicar X → ❌ Desabilitado
   - Clicar backdrop → ❌ Sem efeito
   - Pressionar ESC → ❌ Sem efeito
4. ✅ Só finaliza quando envio completa

### Cenário 4: Envio Falha
1. Envio falha
2. `closeDisabled = false` automaticamente
3. ✅ Usuário pode tentar novamente ou fechar

## Checklist de Implementação

Para cada modal crítico:

- [ ] Criar estado `isDirty` (rastreia alterações)
- [ ] Criar estado `isSubmitting` ou `isUploading`
- [ ] Usar `AppModalShell` com props de segurança
- [ ] `closeOnBackdropClick={false}` em cadastros
- [ ] Adicionar handlers para `handleFieldChange` → `setIsDirty(true)`
- [ ] Resetar `isDirty` após sucesso
- [ ] Bloquear `closeDisabled` durante operação
- [ ] Testar 4 cenários acima
- [ ] Validar com Lint/TypeScript

## Exemplos de Modais para Aplicar

1. **NovoContratoModal** - Cadastro contrato
2. **Pré-projeto modal** - Cadastro pré-projeto
3. **Parceiro modal** - Cadastro/edição parceiro
4. **Fornecedor modal** - Cadastro fornecedor
5. **Equipe técnica** - Modais de equipe
6. **Empresas modals** - Modais de empresas
7. **Pagamentos modals** - Modais de pagamento
8. **Rubricas modals** - Modais de rubricas
9. **Upload/Arquivos** - Modais de anexos

## Notas Técnicas

- ✅ ESC automático via AppModalShell (respeita `closeDisabled` e `isDirty`)
- ✅ Backdrop automático via AppModalShell
- ✅ Confirmação via `ConfirmDiscardModal` genérico
- ✅ Type-safe com TypeScript
- ✅ Sem duplicação de código
- ⚠️ Cada modal deve ter próprio estado `isDirty`
- ⚠️ `closeOnBackdropClick=false` é seguro por default em cadastros

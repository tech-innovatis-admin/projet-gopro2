# Dropdown Component

Componente de dropdown customizado com o mesmo estilo visual do NavBar da aplicação GoPro 2.

## Características

- ✅ **Estilo consistente** com o NavBar
- ✅ **Animações suaves** de abertura/fechamento
- ✅ **Fechamento automático** ao clicar fora
- ✅ **Suporte a ícones** nas opções
- ✅ **Type-safe** com TypeScript
- ✅ **Acessível** e responsivo

## Instalação

O componente já está disponível em `components/ui/dropdown.tsx`. Certifique-se de ter as dependências necessárias:

```bash
npm install lucide-react
```

## Uso Básico

```tsx
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";

const options: DropdownOption[] = [
  { value: "opcao1", label: "Opção 1" },
  { value: "opcao2", label: "Opção 2" },
  { value: "opcao3", label: "Opção 3" },
];

function MeuComponente() {
  const [valor, setValor] = useState<string | undefined>();

  return (
    <Dropdown
      options={options}
      value={valor}
      placeholder="Selecionar opção..."
      onChange={(value) => setValor(value)}
    />
  );
}
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `options` | `DropdownOption[]` | **obrigatório** | Array de opções disponíveis |
| `value` | `string \| undefined` | `undefined` | Valor selecionado atualmente |
| `placeholder` | `string` | `"Selecionar..."` | Texto exibido quando nenhuma opção está selecionada |
| `onChange` | `(value: string \| undefined) => void` | **obrigatório** | Callback chamado ao selecionar uma opção |
| `className` | `string` | `undefined` | Classes CSS adicionais para o botão |
| `disabled` | `boolean` | `false` | Desabilita o dropdown |

## Tipo DropdownOption

```tsx
interface DropdownOption {
  value: string;        // Valor único da opção
  label: string;        // Texto exibido
  icon?: ReactNode;     // Ícone opcional (ReactNode)
}
```

## Exemplos

### Exemplo 1: Dropdown Simples

```tsx
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";

const frutas: DropdownOption[] = [
  { value: "maca", label: "Maçã" },
  { value: "banana", label: "Banana" },
  { value: "laranja", label: "Laranja" },
];

function ExemploFrutas() {
  const [frutaSelecionada, setFrutaSelecionada] = useState<string | undefined>();

  return (
    <Dropdown
      options={frutas}
      value={frutaSelecionada}
      placeholder="Selecione uma fruta"
      onChange={(value) => setFrutaSelecionada(value)}
    />
  );
}
```

### Exemplo 2: Dropdown com Ícones

```tsx
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Home, User, Settings } from "lucide-react";

const menuOptions: DropdownOption[] = [
  { value: "home", label: "Início", icon: <Home className="h-4 w-4" /> },
  { value: "profile", label: "Perfil", icon: <User className="h-4 w-4" /> },
  { value: "settings", label: "Configurações", icon: <Settings className="h-4 w-4" /> },
];

function ExemploComIcones() {
  const [menuSelecionado, setMenuSelecionado] = useState<string | undefined>();

  return (
    <Dropdown
      options={menuOptions}
      value={menuSelecionado}
      placeholder="Selecione um menu"
      onChange={(value) => setMenuSelecionado(value)}
    />
  );
}
```

### Exemplo 3: Dropdown em Filtros (Tabela de Usuários)

```tsx
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { PERMISSION_LEVELS, ROLE_LABELS } from "@/app/(dashboard)/equipe/mockData";

// Preparar opções
const roleOptions: DropdownOption[] = uniqueRoles.map(role => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const levelOptions: DropdownOption[] = PERMISSION_LEVELS.map(level => ({
  value: level.level,
  label: `${level.name} - ${level.description}`,
}));

function FiltrosTabela() {
  const [filters, setFilters] = useState({
    role: undefined as string | undefined,
    level: undefined as string | undefined,
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Dropdown
        options={roleOptions}
        value={filters.role}
        placeholder="Todas as funções"
        onChange={(value) => setFilters({ ...filters, role: value })}
      />
      
      <Dropdown
        options={levelOptions}
        value={filters.level}
        placeholder="Todos os níveis"
        onChange={(value) => setFilters({ ...filters, level: value })}
      />
    </div>
  );
}
```

### Exemplo 4: Dropdown Desabilitado

```tsx
<Dropdown
  options={options}
  value={valor}
  placeholder="Selecionar..."
  onChange={(value) => setValor(value)}
  disabled={true}
/>
```

### Exemplo 5: Dropdown com Classes Customizadas

```tsx
<Dropdown
  options={options}
  value={valor}
  placeholder="Selecionar..."
  onChange={(value) => setValor(value)}
  className="border-2 border-blue-500"
/>
```

## Comportamento

### Fechamento Automático
O dropdown fecha automaticamente quando:
- O usuário clica fora do componente
- Uma opção é selecionada
- O componente é desmontado

### Seleção de Opção
- Ao selecionar uma opção, o `onChange` é chamado com o `value` da opção
- Ao selecionar o placeholder (primeira opção), `onChange` é chamado com `undefined`
- A opção selecionada fica destacada visualmente (`bg-zinc-50 font-medium`)

### Animações
- **Abertura**: Fade in + slide down + scale
- **Chevron**: Rotaciona 180° quando aberto
- **Hover**: Background muda para `bg-zinc-50` nas opções

## Estilização

O componente usa as seguintes classes Tailwind:

- **Botão**: `border-gray-300`, `bg-white`, `hover:bg-gray-50`
- **Dropdown**: `border-zinc-200`, `shadow-lg`, `rounded-lg`
- **Opções**: `hover:bg-zinc-50`, `text-zinc-700`
- **Selecionado**: `bg-zinc-50 font-medium`

Você pode sobrescrever estilos usando a prop `className` no botão principal.

## Acessibilidade

- ✅ Suporte a teclado (Enter para abrir/fechar)
- ✅ Fechamento ao clicar fora
- ✅ Estados visuais claros (hover, selected, disabled)
- ✅ Contraste adequado de cores

## Dicas

1. **Performance**: Se você tiver muitas opções (>50), considere adicionar busca ou virtualização
2. **Mobile**: O componente funciona bem em mobile, mas considere usar um modal em telas muito pequenas
3. **Z-index**: O dropdown usa `z-50`, ajuste se necessário para evitar conflitos
4. **Largura**: O dropdown herda a largura do container pai, use `w-full` ou classes específicas

## Troubleshooting

### Dropdown não fecha ao clicar fora
- Certifique-se de que o componente está dentro de um container que não bloqueia eventos
- Verifique se há outros event listeners interferindo

### Opções não aparecem
- Verifique se o array `options` não está vazio
- Confirme que os valores são strings únicas

### Estilos não aplicados
- Certifique-se de que o Tailwind está configurado corretamente
- Verifique se as classes não estão sendo sobrescritas

## Changelog

### v1.0.0
- Versão inicial
- Suporte a opções com ícones
- Animações suaves
- Fechamento automático


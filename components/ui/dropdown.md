# Dropdown (Padrão de formulários)

Este é o componente padrão de dropdown/select para **cadastros críticos** na aplicação.

Use este componente para evitar misturar `<select>` nativo, Radix Select e dropdowns customizados com comportamentos diferentes (principalmente dentro de modais/overlays).

Arquivo: `components/ui/dropdown.tsx`

## Quando usar

- Campos de seleção em formulários e modais (cadastros críticos).
- Quando precisa de **portal** (lista não fica “atrás” do overlay).
- Quando precisa de **busca** (`searchable`) em listas maiores.

## API

```tsx
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
```

Props principais:

- `options: DropdownOption[]` (obrigatório)
- `value?: string`
- `onChange: (value: string | undefined) => void` (obrigatório)
- `placeholder?: string` (default: `"Selecionar..."`)
- `disabled?: boolean`
- `searchable?: boolean` (habilita busca)

Estados obrigatórios (padronizados):

- `loading?: boolean` e `loadingText?: string`
- `error?: string | null` e `onRetry?: () => void`
- `emptyText?: string`

Opções:

```ts
export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}
```

## Exemplos

### Dropdown simples

```tsx
const options: DropdownOption[] = [
  { value: "INDEPENDENTE", label: "Independente" },
  { value: "INCUBADA", label: "Incubada" },
];

<Dropdown
  options={options}
  value={tipoEmpresa}
  onChange={(v) => setTipoEmpresa(v as any)}
  placeholder="Selecione..."
/>
```

### Com busca (listas maiores)

```tsx
<Dropdown
  options={peopleOptions}
  value={selectedPersonId ? String(selectedPersonId) : undefined}
  onChange={(v) => setSelectedPersonId(v ? Number(v) : "")}
  placeholder="Pesquise por nome ou CPF"
  searchable
/>
```

### Loading / erro / vazio

```tsx
<Dropdown
  options={options}
  value={value}
  onChange={setValue}
  loading={isLoading}
  error={loadError}
  onRetry={refetch}
  emptyText="Nenhuma opção encontrada"
/>
```

## Nota sobre modais/overlay

O menu é renderizado via portal no `document.body` com `position: fixed` e `z-index` alto, para evitar o bug de dropdown ficar atrás do overlay.


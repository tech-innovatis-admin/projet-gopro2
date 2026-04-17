# Guia de uso da API do IBGE

## Objetivo

Este guia documenta como a API do IBGE esta sendo usada hoje no projeto e como reaproveitar esse padrao em um novo sistema com menos duplicacao e mais organizacao.

## Onde a API do IBGE aparece no projeto atual

Hoje a integracao aparece em dois pontos:

- `src/app/(dashboard)/contratos/novo-contrato/page.tsx`
- `src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/page.tsx`

Nos dois casos o uso e o mesmo:

1. Buscar a lista de estados brasileiros.
2. Converter o retorno em opcoes de dropdown.
3. Quando a UF muda, buscar os municipios daquela UF.
4. Limpar a cidade selecionada para evitar combinacoes invalidas.
5. Exibir estados de loading e erro no formulario.

## Endpoints usados hoje

```txt
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios
```

Exemplo:

```txt
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios
```

## Como o fluxo funciona no projeto atual

### 1. Tipos locais

Cada pagina define tipos simples para o retorno:

```ts
type IbgeStateResponse = {
  id: number;
  sigla: string;
  nome: string;
};

type IbgeCityResponse = {
  id: number;
  nome: string;
};
```

### 2. Busca de estados

O projeto faz `fetch` direto para o endpoint de estados, valida `response.ok`, ordena por `sigla` e transforma o retorno em opcoes no formato:

```ts
{ value: "SP", label: "SP - Sao Paulo" }
```

### 3. Busca de municipios por UF

Quando o usuario seleciona uma UF:

- a UF e normalizada com `trim().toUpperCase()`
- a cidade atual e limpa
- a lista de cidades e zerada
- o sistema chama o endpoint `/estados/{UF}/municipios`
- o retorno e ordenado por `nome`
- o resultado vira dropdown no formato:

```ts
{ value: "Campinas", label: "Campinas" }
```

### 4. Comportamento de interface

O projeto atual faz uma UX boa para esse caso:

- desabilita o campo de cidade enquanto a UF nao foi escolhida
- mostra placeholder de carregamento
- mostra mensagem de erro se a consulta falhar
- evita manter cidade antiga quando a UF muda

## O que esta bom no padrao atual

- Integracao simples e direta.
- Normalizacao da UF antes da busca.
- Ordenacao consistente para estados e cidades.
- Boas mensagens de loading no formulario.
- Limpeza da cidade ao trocar a UF.
- Reuso da mesma ideia em mais de uma tela.

## O que pode melhorar

- As funcoes `fetchBrazilStates` e `fetchCitiesByState` estao duplicadas em mais de uma pagina.
- A regra de integracao esta dentro das pages, em vez de ficar em um modulo compartilhado.
- O carregamento das cidades usa controle por `isMounted`, mas pode ficar melhor com `AbortController`.
- Nao existe uma camada unica para cache, log ou tratamento de falha.
- Se o proximo projeto tiver varios formularios, copiar e colar esse codigo vai escalar mal.

## Recomendacao para o proximo projeto

Para o novo projeto, a recomendacao e separar a integracao em tres camadas:

```txt
src/
  lib/
    ibge.ts
  hooks/
    useIbgeLocations.ts
  components/
    forms/
      AddressFields.tsx
```

### Responsabilidade de cada camada

- `lib/ibge.ts`: fala com a API do IBGE e centraliza tipos e funcoes.
- `hooks/useIbgeLocations.ts`: controla loading, erro, cancelamento e atualizacao das listas.
- `AddressFields.tsx`: renderiza os campos de UF e cidade.

## Implementacao base recomendada

### 1. Servico centralizado

Arquivo sugerido: `src/lib/ibge.ts`

```ts
export type IbgeStateResponse = {
  id: number;
  sigla: string;
  nome: string;
};

export type IbgeCityResponse = {
  id: number;
  nome: string;
};

export type SelectOption = {
  value: string;
  label: string;
};

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export async function fetchBrazilStates(signal?: AbortSignal): Promise<SelectOption[]> {
  const response = await fetch(`${IBGE_BASE_URL}/estados`, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os estados.");
  }

  const data = (await response.json()) as IbgeStateResponse[];

  return data
    .filter((item) => item.sigla?.trim())
    .sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"))
    .map((item) => ({
      value: item.sigla.trim().toUpperCase(),
      label: `${item.sigla.trim().toUpperCase()} - ${item.nome}`,
    }));
}

export async function fetchCitiesByState(
  uf: string,
  signal?: AbortSignal,
): Promise<SelectOption[]> {
  const normalizedUf = uf.trim().toUpperCase();

  if (!normalizedUf) {
    return [];
  }

  const response = await fetch(`${IBGE_BASE_URL}/estados/${normalizedUf}/municipios`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as cidades.");
  }

  const data = (await response.json()) as IbgeCityResponse[];

  return data
    .filter((item) => item.nome?.trim())
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((item) => ({
      value: item.nome.trim(),
      label: item.nome.trim(),
    }));
}
```

### 2. Hook reutilizavel

Arquivo sugerido: `src/hooks/useIbgeLocations.ts`

```ts
import { useEffect, useState } from "react";
import { fetchBrazilStates, fetchCitiesByState, type SelectOption } from "@/lib/ibge";

export function useIbgeLocations(selectedUf: string) {
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [isStatesLoading, setIsStatesLoading] = useState(true);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setIsStatesLoading(true);
    setStatesError(null);

    void fetchBrazilStates(controller.signal)
      .then(setStateOptions)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setStateOptions([]);
        setStatesError("Nao foi possivel carregar os estados.");
      })
      .finally(() => {
        setIsStatesLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const normalizedUf = selectedUf.trim().toUpperCase();

    if (!normalizedUf) {
      setCityOptions([]);
      setCitiesError(null);
      setIsCitiesLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsCitiesLoading(true);
    setCitiesError(null);

    void fetchCitiesByState(normalizedUf, controller.signal)
      .then(setCityOptions)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCityOptions([]);
        setCitiesError("Nao foi possivel carregar as cidades deste estado.");
      })
      .finally(() => {
        setIsCitiesLoading(false);
      });

    return () => controller.abort();
  }, [selectedUf]);

  return {
    stateOptions,
    cityOptions,
    isStatesLoading,
    isCitiesLoading,
    statesError,
    citiesError,
  };
}
```

### 3. Exemplo de uso no formulario

```tsx
const [form, setForm] = useState({
  uf: "",
  cidade: "",
});

const {
  stateOptions,
  cityOptions,
  isStatesLoading,
  isCitiesLoading,
  statesError,
  citiesError,
} = useIbgeLocations(form.uf);

function handleUfChange(value?: string) {
  const uf = (value ?? "").trim().toUpperCase();

  setForm((prev) => ({
    ...prev,
    uf,
    cidade: "",
  }));
}
```

Regras importantes nesse formulario:

- sempre limpar `cidade` quando `uf` mudar
- sempre normalizar `uf`
- nao permitir selecionar cidade sem UF
- exibir erro separado para estados e cidades

## Quando usar fetch direto no client

Pode continuar com fetch direto no client quando:

- os dados sao publicos
- o formulario e simples
- nao existe necessidade de autenticar a chamada
- voce quer implementar rapido

## Quando vale criar uma rota interna no projeto

Prefira rota interna, por exemplo `/api/ibge/...`, quando:

- mais de uma tela depende da mesma integracao
- voce quer centralizar cache
- voce quer logs de falha
- voce quer trocar o provedor no futuro sem mexer na UI
- voce quer isolar a aplicacao de mudancas externas

## Checklist para copiar no proximo projeto

- Criar `src/lib/ibge.ts`.
- Centralizar os tipos `IbgeStateResponse` e `IbgeCityResponse`.
- Criar funcao para estados e funcao para municipios por UF.
- Normalizar UF com `trim().toUpperCase()`.
- Ordenar estados por sigla.
- Ordenar cidades por nome.
- Criar hook para loading, erro e cancelamento.
- Limpar a cidade sempre que a UF mudar.
- Desabilitar cidade enquanto a UF nao existir.
- Mostrar placeholder e mensagem de erro no campo.
- Evitar duplicar essa logica em varias pages.

## Resumo pratico

O projeto atual usa a API do IBGE de forma correta para formularios dependentes de UF e cidade. O principal ajuste recomendado para o proximo projeto e tirar essa integracao de dentro das pages e mover para um servico compartilhado com hook reutilizavel. Isso reduz duplicacao, melhora manutencao e deixa o formulario bem mais facil de replicar.

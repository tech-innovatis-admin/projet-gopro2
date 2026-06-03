'use client';

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Trash2, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { ConfirmDiscardModal } from '@/components/ui/confirm-discard-modal';
import { Dropdown } from '@/components/ui/dropdown';
import { useModalCloseGuard } from '@/src/hooks/useModalCloseGuard';
import { CompanyResponsiblePersonSection } from '@/src/app/(dashboard)/fornecedores/_components/CompanyResponsiblePersonSection';
import type { ContractingStatusEnum } from '@/src/lib/api/types';

export type CompanyFormData = {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  responsavelPersonId?: string;
  responsavel?: { id: string; nome: string; cpf?: string; email?: string };
  responsavelDesconhecido?: boolean;
  tipoServico?: string;
  tipoEmpresa?: 'INCUBADA' | 'INDEPENDENTE';
  valorContrato?: number;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
  status?: ContractingStatusEnum;
};

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

export function onlyDigits(value?: string) {
  return (value || '').replace(/\D/g, '');
}

export function hasRequiredCompanyFields(formData: Partial<CompanyFormData>) {
  const responsavelOk =
    formData.responsavelDesconhecido === true || !isBlank(formData.responsavelPersonId);
  return (
    !isBlank(formData.tipoEmpresa) &&
    !isBlank(formData.razaoSocial) &&
    !isBlank(formData.nomeFantasia) &&
    !isBlank(formData.cnpj) &&
    responsavelOk
  );
}

function formatZipCode(value?: string) {
  const numbers = onlyDigits(value).slice(0, 8);
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

function formatPhone(value?: string) {
  const numbers = onlyDigits(value).slice(0, 11);
  if (!numbers) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatCnpj(value?: string) {
  const numbers = onlyDigits(value).slice(0, 14);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

type ViaCepResponse = {
  logradouro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

async function fetchViaCep(zipCode: string) {
  const normalizedZipCode = onlyDigits(zipCode);
  if (normalizedZipCode.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  if (!response.ok) throw new Error('Falha ao consultar CEP.');

  const data = (await response.json()) as ViaCepResponse;
  return data.erro ? null : data;
}

function formatCurrencyInput(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrencyInput(input: string) {
  const digits = input.replace(/\D/g, '');
  if (!digits) return undefined;
  const cents = Number(digits);
  return Number.isFinite(cents) ? cents / 100 : undefined;
}

type CompanyFormModalProps = {
  isOpen: boolean;
  formData: Partial<CompanyFormData>;
  setFormData: Dispatch<SetStateAction<Partial<CompanyFormData>>>;
  isSaving: boolean;
  isEditingItem: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  errorMessage?: string | null;
  fieldErrors?: Partial<Record<'tipoEmpresa' | 'razaoSocial' | 'nomeFantasia' | 'cnpj' | 'responsavel', string>>;
};

export function CompanyFormModal({
  isOpen,
  formData,
  setFormData,
  isSaving,
  isEditingItem,
  onSave,
  onClose,
  onDelete,
  errorMessage,
  fieldErrors,
}: CompanyFormModalProps) {
  const [isResolvingZipCode, setIsResolvingZipCode] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const hasFilledData = Object.values(formData).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'boolean') return value;
    return value !== undefined && value !== null;
  });
  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen,
    shouldConfirm: hasFilledData,
    closeDisabled: isSaving,
    onClose,
  });

  useEffect(() => {
    if (!isOpen) {
      setHasAttemptedSave(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookupZipCode = async (rawZipCode?: string) => {
    const normalizedZipCode = onlyDigits(rawZipCode ?? formData.cep);
    if (normalizedZipCode.length !== 8) {
      setZipCodeLookupError('CEP deve conter 8 digitos.');
      return;
    }

    try {
      setZipCodeLookupError(null);
      setIsResolvingZipCode(true);
      const viaCepData = await fetchViaCep(normalizedZipCode);
      if (!viaCepData) {
        setZipCodeLookupError('CEP nao encontrado.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        cep: formatZipCode(normalizedZipCode),
        endereco: viaCepData.logradouro || prev.endereco,
        cidade: viaCepData.localidade || prev.cidade,
        uf: (viaCepData.uf || prev.uf || '').toUpperCase(),
      }));
    } catch {
      setZipCodeLookupError('Nao foi possivel consultar o CEP.');
    } finally {
      setIsResolvingZipCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-[#004225] to-[#00563A] px-6 py-4 text-white">
          <h2 className="text-lg font-bold">{isEditingItem ? 'Editar Empresa' : 'Nova Empresa'}</h2>
          <button
            onClick={requestClose}
            disabled={isSaving}
            className="rounded-lg p-2 transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Linha 1: Razão Social | Nome Fantasia */}
            <Field label="Razao Social" required>
              <input type="text" value={formData.razaoSocial || ''} onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} className={`w-full rounded-lg border px-3 py-2.5 text-sm ${hasAttemptedSave && !formData.razaoSocial?.trim() ? 'border-red-300' : 'border-gray-300'}`} placeholder="Razao social da empresa" />
              {hasAttemptedSave && !formData.razaoSocial?.trim() ? <p className="text-xs text-red-600">{fieldErrors?.razaoSocial || 'Informe a razão social.'}</p> : null}
            </Field>
            <Field label="Nome Fantasia" required>
              <input type="text" value={formData.nomeFantasia || ''} onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })} className={`w-full rounded-lg border px-3 py-2.5 text-sm ${hasAttemptedSave && !formData.nomeFantasia?.trim() ? 'border-red-300' : 'border-gray-300'}`} placeholder="Nome fantasia" />
              {hasAttemptedSave && !formData.nomeFantasia?.trim() ? <p className="text-xs text-red-600">{fieldErrors?.nomeFantasia || 'Informe o nome fantasia.'}</p> : null}
            </Field>

            {/* Linha 2: CNPJ | Tipo de Empresa */}
            <Field label="CNPJ" required>
              <input type="text" value={formData.cnpj || ''} onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })} maxLength={18} className={`w-full rounded-lg border px-3 py-2.5 text-sm ${hasAttemptedSave && (!formData.cnpj || onlyDigits(formData.cnpj).length !== 14) ? 'border-red-300' : 'border-gray-300'}`} placeholder="00.000.000/0000-00" />
              {hasAttemptedSave && (!formData.cnpj || onlyDigits(formData.cnpj).length !== 14) ? <p className="text-xs text-red-600">{fieldErrors?.cnpj || 'Informe um CNPJ válido.'}</p> : null}
            </Field>
            <Field label="Tipo de Empresa" required>
              <Dropdown
                options={[{ value: 'INDEPENDENTE', label: 'Independente' }, { value: 'INCUBADA', label: 'Incubada' }]}
                value={formData.tipoEmpresa || ''}
                onChange={(value) => setFormData({ ...formData, tipoEmpresa: value ? (value as 'INDEPENDENTE' | 'INCUBADA') : undefined })}
                placeholder="Selecione..."
                className={`w-full ${hasAttemptedSave && !formData.tipoEmpresa ? 'border border-red-300 rounded-lg' : ''}`}
              />
              {hasAttemptedSave && !formData.tipoEmpresa ? <p className="text-xs text-red-600">{fieldErrors?.tipoEmpresa || 'Selecione o tipo de empresa.'}</p> : null}
            </Field>

            {/* Linha 3: E-mail | Telefone */}
            <Field label="E-mail">
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="email@empresa.com.br" />
            </Field>
            <Field label="Telefone">
              <input type="text" value={formData.telefone || ''} onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} maxLength={15} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="(00) 00000-0000" />
            </Field>

            {/* Linha 4: CEP | UF */}
            <Field label="CEP">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={formData.cep || ''} onChange={(e) => setFormData({ ...formData, cep: formatZipCode(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" maxLength={9} placeholder="00000-000" />
                  <button type="button" onClick={() => void handleLookupZipCode()} disabled={isResolvingZipCode} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-[#004225]">
                    {isResolvingZipCode ? 'Buscando...' : 'Buscar CEP'}
                  </button>
                </div>
                {zipCodeLookupError ? <p className="text-xs text-red-600">{zipCodeLookupError}</p> : null}
              </div>
            </Field>
            <Field label="UF">
              <input type="text" value={formData.uf || ''} onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="UF" />
            </Field>

            {/* Linha 5: Endereço (full) */}
            <Field label="Endereco" className="md:col-span-2">
              <input type="text" value={formData.endereco || ''} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Rua, numero e bairro" />
            </Field>

            {/* Linha 6: Cidade (full) */}
            <Field label="Cidade" className="md:col-span-2">
              <input type="text" value={formData.cidade || ''} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Cidade" />
            </Field>

            {/* Linha 7: Responsável (full) */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Responsável da empresa <span className="text-red-500">*</span>
                </span>
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.responsavelDesconhecido ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((current) => ({
                        ...current,
                        responsavelDesconhecido: checked,
                        ...(checked ? { responsavelPersonId: '', responsavel: undefined } : {}),
                      }));
                    }}
                    disabled={isSaving}
                    className="h-4 w-4 rounded border-gray-300 text-[#004225] focus:ring-[#004225]"
                  />
                  <span className="text-sm text-gray-600">Desconhecido / sem responsável</span>
                </label>
              </div>
              {!formData.responsavelDesconhecido ? (
                <>
                  <CompanyResponsiblePersonSection
                    value={formData.responsavelPersonId || undefined}
                    responsavel={formData.responsavel}
                    onChange={(responsavelPersonId, responsavel) => setFormData((current) => ({ ...current, responsavelPersonId: responsavelPersonId ?? '', responsavel }))}
                    disabled={isSaving}
                    enabled
                  />
                  {hasAttemptedSave && isBlank(formData.responsavelPersonId) ? (
                    <p className="text-xs text-red-600">{fieldErrors?.responsavel || 'Selecione o responsável ou marque como desconhecido.'}</p>
                  ) : null}
                </>
              ) : (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Empresa registrada sem responsável identificado.
                </div>
              )}
            </div>

            {/* Linha 8: Tipo de Serviço (full) */}
            <Field label="Tipo de Servico" className="md:col-span-2">
              <input type="text" value={formData.tipoServico || ''} onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Ex: Desenvolvimento de software" />
            </Field>

            {/* Linha 9: Valor do Contrato | Status do Contrato */}
            <Field label="Valor do Contrato (R$)">
              <input type="text" inputMode="numeric" value={formatCurrencyInput(formData.valorContrato)} onChange={(e) => setFormData({ ...formData, valorContrato: parseCurrencyInput(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="R$ 0,00" />
            </Field>
            <Field label="Status do Contrato">
              <Dropdown
                options={[
                  { value: 'EM_CADASTRO', label: 'Em cadastro' },
                  { value: 'EM_CONTRATACAO', label: 'Em contratação' },
                  { value: 'CONTRATADA', label: 'Contratada' },
                  { value: 'EM_EXECUCAO', label: 'Em execução' },
                  { value: 'CONCLUIDA', label: 'Concluída' },
                  { value: 'CANCELADA', label: 'Cancelada' },
                ]}
                value={formData.status || ''}
                onChange={(value) => setFormData({ ...formData, status: value ? (value as ContractingStatusEnum) : undefined })}
                placeholder="Selecione..."
                className="w-full"
              />
            </Field>

            {/* Linha 10: Data de Início | Data de Término */}
            <Field label="Data de Inicio">
              <DatePicker value={formData.dataInicio || ''} onChange={(value) => setFormData({ ...formData, dataInicio: value })} />
            </Field>
            <Field label="Data de Termino">
              <DatePicker value={formData.dataFim || ''} onChange={(value) => setFormData({ ...formData, dataFim: value })} />
            </Field>

            {/* Linha 11: Observações (full) */}
            <Field label="Observacoes" className="md:col-span-2">
              <textarea value={formData.observacao || ''} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Observacoes adicionais" />
            </Field>

          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          {errorMessage ? (
            <div className="px-6 pt-3">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              {isEditingItem && onDelete ? (
                <button onClick={() => { if (confirm('Deseja realmente excluir esta empresa do projeto?')) { onDelete(); onClose(); } }} className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600">
                  <Trash2 className="mr-2 inline-block h-4 w-4" />Excluir Vinculo
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={requestClose} disabled={isSaving} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700">Cancelar</button>
              <button onClick={() => { setHasAttemptedSave(true); onSave(); }} disabled={isSaving} className="rounded-lg bg-[#004225] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {isSaving ? 'Salvando...' : isEditingItem ? 'Salvar Alteracoes' : 'Adicionar Empresa'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDiscardModal {...discardConfirmProps} isLoading={isSaving} />
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

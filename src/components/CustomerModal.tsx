import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User, Camera, Phone, MapPin, CreditCard, Calendar, FileText,
  AlertTriangle, Check, X, RotateCcw, Building2, MessageCircle,
  DollarSign, CheckCircle2, AlertCircle, Loader2, Sparkles, Percent
} from 'lucide-react';
import {
  cleanDigits,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  validateCPF,
  validateCNPJ,
  validateEmail
} from '../utils/documentValidators';
import {
  calculateBillingDueDate,
  formatBillingDueDateBR,
  getBillingDayPreview
} from '../utils/billingDate';

export interface CustomerData {
  id?: number;
  name: string;
  nickname?: string;
  person_type?: 'Fisica' | 'Juridica';
  cpf?: string;
  cnpj?: string;
  whatsapp: string;
  secondary_phone?: string;
  email?: string;
  zip_code?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  credit_limit: number;
  billing_day: number | null;
  fine_rate: number;
  interest_rate: number;
  financial_notes?: string;
  general_notes?: string;
  image_url?: string;
  credit_status?: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomerData) => Promise<void> | void;
  customer?: CustomerData | null;
  existingCustomers?: CustomerData[];
  zIndex?: string;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  existingCustomers = [],
  zIndex = 'z-[250]'
}) => {
  const isEditing = Boolean(customer && customer.id);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [personType, setPersonType] = useState<'Fisica' | 'Juridica'>('Fisica');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [creditLimit, setCreditLimit] = useState<number | string>(0);
  const [billingDay, setBillingDay] = useState<number | null>(null);
  const [fineRate, setFineRate] = useState<number | string>(2);
  const [interestRate, setInterestRate] = useState<number | string>(1);
  const [financialNotes, setFinancialNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // UI state
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Reset or populate on open
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setPersonType(customer.person_type === 'Juridica' || (customer.cnpj && !customer.cpf) ? 'Juridica' : 'Fisica');
        setName(customer.name || '');
        setNickname(customer.nickname || '');
        setCpf(customer.cpf ? formatCPF(customer.cpf) : '');
        setCnpj(customer.cnpj ? formatCNPJ(customer.cnpj) : '');
        setWhatsapp(customer.whatsapp ? formatPhone(customer.whatsapp) : '');
        setSecondaryPhone(customer.secondary_phone ? formatPhone(customer.secondary_phone) : '');
        setEmail(customer.email || '');
        setZipCode(customer.zip_code ? formatCEP(customer.zip_code) : '');
        setAddress(customer.address || '');
        setNumber(customer.number || '');
        setComplement(customer.complement || '');
        setNeighborhood(customer.neighborhood || '');
        setCity(customer.city || '');
        setState(customer.state || 'SP');
        setCreditLimit(customer.credit_limit !== undefined ? customer.credit_limit : 0);
        setBillingDay(customer.billing_day !== undefined && customer.billing_day !== null ? Number(customer.billing_day) : null);
        setFineRate(customer.fine_rate !== undefined ? customer.fine_rate : 2);
        setInterestRate(customer.interest_rate !== undefined ? customer.interest_rate : 1);
        setFinancialNotes(customer.financial_notes || '');
        setGeneralNotes(customer.general_notes || '');
        setImageUrl(customer.image_url || '');
      } else {
        // Reset defaults
        setPersonType('Fisica');
        setName('');
        setNickname('');
        setCpf('');
        setCnpj('');
        setWhatsapp('');
        setSecondaryPhone('');
        setEmail('');
        setZipCode('');
        setAddress('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('');
        setState('SP');
        setCreditLimit(0);
        setBillingDay(null);
        setFineRate(2);
        setInterestRate(1);
        setFinancialNotes('');
        setGeneralNotes('');
        setImageUrl('');
      }
      setIsDirty(false);
      setSaveError(null);
      setCepError(null);

      // Auto-focus on Name input
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, customer]);

  // Mark form as dirty on changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Safe Close with Confirmation if Dirty
  const handleSafeClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm('Você tem alterações não salvas no cadastro do cliente. Deseja realmente descartar e fechar?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  // Clear Form Button
  const handleClearForm = () => {
    if (window.confirm('Deseja limpar todos os campos deste formulário?')) {
      setName('');
      setNickname('');
      setCpf('');
      setCnpj('');
      setWhatsapp('');
      setSecondaryPhone('');
      setEmail('');
      setZipCode('');
      setAddress('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setState('SP');
      setCreditLimit(0);
      setBillingDay(null);
      setFineRate(2);
      setInterestRate(1);
      setFinancialNotes('');
      setGeneralNotes('');
      setImageUrl('');
      setIsDirty(true);
      nameInputRef.current?.focus();
    }
  };

  // Document validation & duplicate detection
  const isCpfValid = useMemo(() => {
    if (!cpf) return null;
    return validateCPF(cpf);
  }, [cpf]);

  const isCnpjValid = useMemo(() => {
    if (!cnpj) return null;
    return validateCNPJ(cnpj);
  }, [cnpj]);

  const isEmailValid = useMemo(() => {
    if (!email) return null;
    return validateEmail(email);
  }, [email]);

  // Duplicate Check
  const duplicateWarning = useMemo(() => {
    if (!existingCustomers || existingCustomers.length === 0) return null;
    const cleanDoc = personType === 'Fisica' ? cleanDigits(cpf) : cleanDigits(cnpj);
    if (cleanDoc.length >= 11) {
      const found = existingCustomers.find(c => {
        if (customer && c.id === customer.id) return false;
        const cDoc = personType === 'Fisica' ? cleanDigits(c.cpf) : cleanDigits(c.cnpj || c.cpf);
        return cDoc === cleanDoc;
      });
      if (found) {
        return `Atenção: Já existe outro cliente cadastrado (${found.name}) com este ${personType === 'Fisica' ? 'CPF' : 'CNPJ'}!`;
      }
    }
    // Duplicate Phone check
    const cleanTel = cleanDigits(whatsapp);
    if (cleanTel.length >= 10) {
      const foundTel = existingCustomers.find(c => {
        if (customer && c.id === customer.id) return false;
        return cleanDigits(c.whatsapp) === cleanTel;
      });
      if (foundTel) {
        return `Atenção: O número de WhatsApp já consta no cadastro de ${foundTel.name}.`;
      }
    }
    return null;
  }, [cpf, cnpj, whatsapp, personType, existingCustomers, customer]);

  // Billing day live preview
  const billingPreview = useMemo(() => {
    return getBillingDayPreview(billingDay);
  }, [billingDay]);

  // Automatic ViaCEP lookup
  const handleCepBlur = async () => {
    const rawCep = cleanDigits(zipCode);
    if (rawCep.length !== 8) return;

    setIsSearchingCep(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não localizado pelos Correios.');
      } else {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf && BRAZILIAN_STATES.includes(data.uf.toUpperCase())) {
          setState(data.uf.toUpperCase());
        }
        markDirty();
      }
    } catch (err) {
      console.error('Erro ao consultar ViaCEP:', err);
      setCepError('Falha temporária ao consultar CEP online.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Photo Handling (Upload / Capture)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem selecionada é muito grande. O limite máximo é de 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        markDirty();
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Validations
    if (!name.trim()) {
      setSaveError('O Nome Completo / Razão Social é obrigatório.');
      nameInputRef.current?.focus();
      return;
    }

    if (!whatsapp.trim()) {
      setSaveError('O Celular / WhatsApp é obrigatório para contato e cobrança.');
      return;
    }

    if (personType === 'Fisica' && cpf && isCpfValid === false) {
      setSaveError('O CPF informado possui dígitos verificadores inválidos.');
      return;
    }

    if (personType === 'Juridica' && cnpj && isCnpjValid === false) {
      setSaveError('O CNPJ informado possui dígitos verificadores inválidos.');
      return;
    }

    if (email && isEmailValid === false) {
      setSaveError('O formato do e-mail informado é inválido.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CustomerData = {
        id: customer?.id,
        name: name.trim(),
        nickname: nickname.trim(),
        person_type: personType,
        cpf: personType === 'Fisica' ? cleanDigits(cpf) : '',
        cnpj: personType === 'Juridica' ? cleanDigits(cnpj) : '',
        whatsapp: cleanDigits(whatsapp),
        secondary_phone: cleanDigits(secondaryPhone),
        email: email.trim().toLowerCase(),
        zip_code: cleanDigits(zipCode),
        address: address.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        credit_limit: parseFloat(String(creditLimit).replace(',', '.')) || 0,
        billing_day: billingDay && billingDay >= 1 && billingDay <= 31 ? Number(billingDay) : null,
        fine_rate: parseFloat(String(fineRate).replace(',', '.')) || 0,
        interest_rate: parseFloat(String(interestRate).replace(',', '.')) || 0,
        financial_notes: financialNotes.trim(),
        general_notes: generalNotes.trim(),
        image_url: imageUrl
      };

      await onSave(payload);
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      setSaveError(err.message || 'Erro inesperado ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200`}>
      {/* Main ERP Panel Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-customer-title"
        className="w-[94vw] max-w-[1500px] h-[92vh] max-h-[92vh] bg-[#111827] border border-[#374151] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-[#F9FAFB]"
      >
        {/* =========================================================================
            CABEÇALHO PROFISSIONAL FIXO
           ========================================================================= */}
        <header className="bg-[#1E293B] border-b border-[#374151] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
              <User size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="modal-customer-title" className="text-xl md:text-2xl font-black tracking-tight text-[#F9FAFB] uppercase">
                  {isEditing ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                  isEditing
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isEditing ? `Editando ID #${customer?.id}` : 'Novo Registro'}
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#94A3B8] font-medium mt-0.5">
                Dados cadastrais, contatos, endereço e condições financeiras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearForm}
              title="Limpar todos os campos do formulário"
              className="px-3.5 py-2.5 bg-[#263447] hover:bg-[#374151] border border-[#374151] text-[#94A3B8] hover:text-[#F9FAFB] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              title="Fechar janela"
              className="w-10 h-10 bg-[#263447] hover:bg-rose-600/20 hover:text-rose-400 border border-[#374151] hover:border-rose-500/40 text-[#94A3B8] rounded-xl flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* =========================================================================
            CONTEÚDO ROLÁVEL COM SEÇÕES VISUAIS
           ========================================================================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
          {/* Duplicate / Validation Warning Alert Banner */}
          {duplicateWarning && (
            <div className="p-4 bg-amber-950/40 border border-amber-600/50 rounded-2xl flex items-start gap-3 text-amber-200 animate-in fade-in duration-200">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm font-semibold">{duplicateWarning}</div>
            </div>
          )}

          {saveError && (
            <div className="p-4 bg-rose-950/50 border border-rose-500/50 rounded-2xl flex items-start gap-3 text-rose-200 animate-in shake duration-200">
              <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm font-semibold">{saveError}</div>
            </div>
          )}

          {/* =====================================================================
              SEÇÃO A | IDENTIFICAÇÃO DO CLIENTE
             ===================================================================== */}
          <section className="bg-[#1E293B] border border-[#374151] rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#374151]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  A
                </span>
                <h3 className="text-base font-black uppercase tracking-wide text-[#F9FAFB] flex items-center gap-2">
                  <User size={18} className="text-rose-500" />
                  Identificação do Cliente
                </h3>
              </div>

              {/* Toggle Pessoa Física / Jurídica */}
              <div className="flex bg-[#263447] p-1 rounded-xl border border-[#374151]">
                <button
                  type="button"
                  onClick={() => {
                    setPersonType('Fisica');
                    markDirty();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    personType === 'Fisica'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-[#F9FAFB]'
                  }`}
                >
                  <User size={14} />
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonType('Juridica');
                    markDirty();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    personType === 'Juridica'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-[#F9FAFB]'
                  }`}
                >
                  <Building2 size={14} />
                  Pessoa Jurídica
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Foto Compacta do Cliente */}
              <div className="lg:col-span-3 xl:col-span-2 flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  title="Clique para enviar ou capturar foto"
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-[#374151] hover:border-rose-500 bg-[#263447] overflow-hidden group cursor-pointer flex flex-col items-center justify-center transition-all shadow-inner"
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Foto do Cliente" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white text-[10px] font-bold uppercase gap-1">
                        <Camera size={20} />
                        Alterar Foto
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#94A3B8] group-hover:text-rose-400 p-2 text-center transition-all">
                      <Camera size={30} className="mb-1.5" />
                      <span className="text-[11px] font-bold">Foto</span>
                      <span className="text-[9px] text-[#94A3B8]/70">Capturar / Upload</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl('');
                      markDirty();
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold mt-1.5 underline cursor-pointer"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              {/* Campos Principais de Identificação */}
              <div className="lg:col-span-9 xl:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nome Completo / Razão Social */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                    {personType === 'Fisica' ? 'Nome Completo *' : 'Razão Social / Nome da Empresa *'}
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder={personType === 'Fisica' ? 'Ex: Carlos Eduardo de Souza' : 'Ex: Drogamais Medicamentos Ltda'}
                    className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      markDirty();
                    }}
                  />
                </div>

                {/* Apelido / Nome Fantasia */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                    {personType === 'Fisica' ? 'Apelido (Como é chamado)' : 'Nome Fantasia'}
                  </label>
                  <input
                    type="text"
                    placeholder={personType === 'Fisica' ? 'Ex: Zé da CG, Dequinha' : 'Ex: Drogamais Centro'}
                    className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      markDirty();
                    }}
                  />
                </div>

                {/* CPF ou CNPJ Dinâmico */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs md:text-sm font-bold text-[#F9FAFB]">
                      {personType === 'Fisica' ? 'CPF' : 'CNPJ'}
                    </label>
                    {personType === 'Fisica' && cpf && isCpfValid !== null && (
                      <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                        isCpfValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isCpfValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {isCpfValid ? 'Válido' : 'Inválido'}
                      </span>
                    )}
                    {personType === 'Juridica' && cnpj && isCnpjValid !== null && (
                      <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                        isCnpjValid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isCnpjValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {isCnpjValid ? 'Válido' : 'Inválido'}
                      </span>
                    )}
                  </div>
                  {personType === 'Fisica' ? (
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`w-full h-12 px-4 bg-[#263447] border rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:ring-2 outline-none transition-all font-mono ${
                        cpf && isCpfValid === false
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : cpf && isCpfValid === true
                          ? 'border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[#374151] focus:border-rose-500 focus:ring-rose-500/20'
                      }`}
                      value={cpf}
                      onChange={(e) => {
                        setCpf(formatCPF(e.target.value));
                        markDirty();
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className={`w-full h-12 px-4 bg-[#263447] border rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:ring-2 outline-none transition-all font-mono ${
                        cnpj && isCnpjValid === false
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : cnpj && isCnpjValid === true
                          ? 'border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[#374151] focus:border-rose-500 focus:ring-rose-500/20'
                      }`}
                      value={cnpj}
                      onChange={(e) => {
                        setCnpj(formatCNPJ(e.target.value));
                        markDirty();
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              SEÇÃO B | CONTATOS E COMUNICAÇÃO
             ===================================================================== */}
          <section className="bg-[#1E293B] border border-[#374151] rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#374151]/60 pb-3">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                B
              </span>
              <h3 className="text-base font-black uppercase tracking-wide text-[#F9FAFB] flex items-center gap-2">
                <Phone size={18} className="text-rose-500" />
                Contatos e Comunicação
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Celular / WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs md:text-sm font-bold text-[#F9FAFB]">
                    Celular / WhatsApp *
                  </label>
                  {whatsapp && cleanDigits(whatsapp).length >= 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        const clean = cleanDigits(whatsapp);
                        const phoneWithCountry = clean.startsWith('55') ? clean : `55${clean}`;
                        window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 uppercase tracking-wider"
                    >
                      <MessageCircle size={12} />
                      WhatsApp
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-mono"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(formatPhone(e.target.value));
                    markDirty();
                  }}
                />
              </div>

              {/* Telefone Secundário */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Telefone Secundário <span className="text-[#94A3B8] font-normal text-xs">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="(00) 0000-0000"
                  maxLength={15}
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-mono"
                  value={secondaryPhone}
                  onChange={(e) => {
                    setSecondaryPhone(formatPhone(e.target.value));
                    markDirty();
                  }}
                />
              </div>

              {/* E-mail */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs md:text-sm font-bold text-[#F9FAFB]">
                    E-mail <span className="text-[#94A3B8] font-normal text-xs">(Opcional)</span>
                  </label>
                  {email && isEmailValid !== null && (
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                      isEmailValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isEmailValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                      {isEmailValid ? 'Válido' : 'Inválido'}
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com.br"
                  className={`w-full h-12 px-4 bg-[#263447] border rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:ring-2 outline-none transition-all ${
                    email && isEmailValid === false
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-[#374151] focus:border-rose-500 focus:ring-rose-500/20'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    markDirty();
                  }}
                />
              </div>
            </div>
          </section>

          {/* =====================================================================
              SEÇÃO C | ENDEREÇO E LOCALIZAÇÃO
             ===================================================================== */}
          <section className="bg-[#1E293B] border border-[#374151] rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#374151]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  C
                </span>
                <h3 className="text-base font-black uppercase tracking-wide text-[#F9FAFB] flex items-center gap-2">
                  <MapPin size={18} className="text-rose-500" />
                  Endereço e Localização
                </h3>
              </div>
              {cepError && (
                <span className="text-xs text-rose-400 font-semibold">{cepError}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
              {/* CEP com Busca Automática */}
              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs md:text-sm font-bold text-[#F9FAFB]">
                    CEP <span className="text-[#94A3B8] font-normal text-xs">(ViaCEP)</span>
                  </label>
                  {isSearchingCep && (
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                      Consultando...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-mono"
                  value={zipCode}
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value);
                    setZipCode(formatted);
                    markDirty();
                  }}
                  onBlur={handleCepBlur}
                />
              </div>

              {/* Rua / Logradouro */}
              <div className="md:col-span-4 lg:col-span-6">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Brasil, Rua dos Trabalhadores"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Número */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Número
                </label>
                <input
                  type="text"
                  placeholder="Ex: 125, S/N"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Complemento */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apto 24, Galpão A"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={complement}
                  onChange={(e) => {
                    setComplement(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Bairro */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centro, Industrial"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Cidade */}
              <div className="md:col-span-3 lg:col-span-4">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Birigui, São Paulo"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Estado / UF */}
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5">
                  Estado (UF)
                </label>
                <select
                  className="w-full h-12 px-3 bg-[#263447] border border-[#374151] rounded-xl text-base text-[#F9FAFB] focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-bold cursor-pointer"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    markDirty();
                  }}
                >
                  {BRAZILIAN_STATES.map(uf => (
                    <option key={uf} value={uf} className="bg-[#1E293B] text-[#F9FAFB]">
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* =====================================================================
              SEÇÃO D | CRÉDITO E CONDIÇÕES FINANCEIRAS (EM DESTAQUE)
             ===================================================================== */}
          <section className="bg-[#1E293B] border-2 border-rose-500/40 rounded-2xl p-5 md:p-6 space-y-5 relative shadow-xl shadow-rose-950/20">
            {/* Header com badge de destaque */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#374151] pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  D
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-[#F9FAFB] flex items-center gap-2">
                    <CreditCard size={20} className="text-rose-500" />
                    Crédito e Condições Financeiras
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Configure o limite de fiado, dia fixo de vencimento mensal e taxas de juros
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 bg-rose-600/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-black uppercase flex items-center gap-1.5">
                <Sparkles size={14} />
                Regras Comerciais
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Limite de Crédito */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5 flex items-center gap-1">
                  <DollarSign size={15} className="text-rose-500" />
                  Limite de Crédito (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="w-full h-12 pl-10 pr-4 bg-[#263447] border border-[#374151] rounded-xl text-base font-black text-rose-400 placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                    value={creditLimit}
                    onChange={(e) => {
                      setCreditLimit(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">Limite máximo liberado para vendas a prazo.</p>
              </div>

              {/* NOVO CAMPO: DIA FIXO DE VENCIMENTO (SUPER DESTAQUE) */}
              <div className="p-3 bg-gradient-to-b from-rose-950/30 to-[#263447] border-2 border-rose-500/60 rounded-xl shadow-lg shadow-rose-950/30">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs md:text-sm font-black text-[#F9FAFB] flex items-center gap-1.5 uppercase tracking-tight">
                    <Calendar size={16} className="text-rose-400" />
                    Dia Fixo Vencimento
                  </label>
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black uppercase text-white tracking-wider">
                    ★ Chave
                  </span>
                </div>

                <select
                  className="w-full h-11 px-3 bg-[#111827] border border-rose-500/50 rounded-lg text-sm md:text-base font-black text-[#F9FAFB] focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all cursor-pointer"
                  value={billingDay === null ? '' : String(billingDay)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    setBillingDay(val);
                    markDirty();
                  }}
                >
                  <option value="" className="bg-[#111827] text-[#94A3B8]">
                    Sem dia fixo (Regra padrão 30 dias)
                  </option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day} className="bg-[#111827] text-white font-bold">
                      Todo dia {String(day).padStart(2, '0')}
                    </option>
                  ))}
                </select>

                {/* Live Preview do Vencimento */}
                <div className="mt-2 text-[11px] font-bold text-rose-300 flex items-start gap-1.5 bg-black/40 p-2 rounded-lg border border-rose-500/20">
                  <Sparkles size={13} className="shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="text-[#94A3B8] font-normal">Próximo vencimento: </span>
                    <strong className="text-white underline">{billingPreview.dueDateBR}</strong>
                    {billingPreview.isClamped && (
                      <p className="text-[9px] text-amber-300 font-normal mt-0.5">
                        * Ajustado para o último dia válido em meses mais curtos.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Multa por Atraso (%) */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5 flex items-center gap-1">
                  <Percent size={14} className="text-rose-500" />
                  Multa por Atraso (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2.00"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base font-bold text-[#F9FAFB] focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={fineRate}
                  onChange={(e) => {
                    setFineRate(e.target.value);
                    markDirty();
                  }}
                />
                <p className="text-[10px] text-[#94A3B8] mt-1">Percentual aplicado uma única vez após vencido.</p>
              </div>

              {/* Juros Mensais (%) */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5 flex items-center gap-1">
                  <Percent size={14} className="text-rose-500" />
                  Juros Mensais (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.00"
                  className="w-full h-12 px-4 bg-[#263447] border border-[#374151] rounded-xl text-base font-bold text-[#F9FAFB] focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(e.target.value);
                    markDirty();
                  }}
                />
                <p className="text-[10px] text-[#94A3B8] mt-1">Juros pró-rata calculados por mês de atraso.</p>
              </div>
            </div>

            {/* Observações Financeiras Restritas */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-[#F9FAFB] mb-1.5 flex items-center gap-1">
                <FileText size={14} className="text-rose-500" />
                Observações Financeiras e Histórico de Cobrança <span className="text-[#94A3B8] font-normal text-xs">(Restrito ao Financeiro)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Cliente bom pagador, prefere receber aviso 2 dias antes por WhatsApp. Bloqueio automático liberado até R$ 500."
                className="w-full px-4 py-2.5 bg-[#263447] border border-[#374151] rounded-xl text-sm text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
                value={financialNotes}
                onChange={(e) => {
                  setFinancialNotes(e.target.value);
                  markDirty();
                }}
              />
            </div>
          </section>

          {/* =====================================================================
              SEÇÃO E | OBSERVAÇÕES GERAIS DO ATENDIMENTO
             ===================================================================== */}
          <section className="bg-[#1E293B] border border-[#374151] rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center gap-2.5 border-b border-[#374151]/60 pb-3">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                E
              </span>
              <h3 className="text-base font-black uppercase tracking-wide text-[#F9FAFB] flex items-center gap-2">
                <FileText size={18} className="text-rose-500" />
                Observações Gerais do Cliente
              </h3>
            </div>
            <textarea
              rows={3}
              placeholder="Informações operacionais relevantes para o atendimento no balcão e oficina (ex: motos do cliente, preferências, horários, etc.)."
              className="w-full px-4 py-3 bg-[#263447] border border-[#374151] rounded-xl text-sm text-[#F9FAFB] placeholder-[#94A3B8]/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
              value={generalNotes}
              onChange={(e) => {
                setGeneralNotes(e.target.value);
                markDirty();
              }}
            />
          </section>
        </form>

        {/* =========================================================================
            RODAPÉ FIXO
           ========================================================================= */}
        <footer className="bg-[#1E293B] border-t border-[#374151] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="text-rose-500 font-black">*</span>
            <span>Campos com asterisco são de preenchimento obrigatório (Nome e Celular).</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#263447] hover:bg-[#374151] border border-[#374151] text-[#F9FAFB] rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{isEditing ? 'Atualizar Cliente' : 'Salvar Cliente'}</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerModal;

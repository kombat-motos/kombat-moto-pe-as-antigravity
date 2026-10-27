import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Search,
  X,
  Phone,
  Bike,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Loader2,
  Check
} from 'lucide-react';
import {
  CustomerItem,
  MotorcycleItem,
  searchSmartCustomers,
  getHighlightedSegments
} from '../../utils/smartSearch';

export interface SmartCustomerSearchProps {
  customers: CustomerItem[];
  motorcycles: MotorcycleItem[];
  selectedCustomerId?: string | number;
  selectedCustomerName?: string;
  onSelectCustomer: (customer: CustomerItem, matchedMoto?: MotorcycleItem) => void;
  onClearCustomer?: () => void;
  onOpenNewCustomerModal?: () => void;
  isCustomerBlocked?: (customer: CustomerItem) => boolean;
  getRemainingCredit?: (customerId: number) => number;
  placeholder?: string;
  className?: string;
}

export const SmartCustomerSearch: React.FC<SmartCustomerSearchProps> = ({
  customers,
  motorcycles,
  selectedCustomerId,
  selectedCustomerName = '',
  onSelectCustomer,
  onClearCustomer,
  onOpenNewCustomerModal,
  isCustomerBlocked,
  getRemainingCredit,
  placeholder = 'Digite o nome, placa ou telefone do cliente...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(selectedCustomerName);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sincroniza com a seleção externa (ex: ao carregar uma O.S. para edição)
  useEffect(() => {
    if (selectedCustomerName && searchTerm !== selectedCustomerName) {
      setSearchTerm(selectedCustomerName);
    }
  }, [selectedCustomerName]);

  // Debounce de ~150ms
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Clientes encontrados ordenados por pontuação de relevância
  const searchResults = useMemo(() => {
    if (!debouncedTerm || debouncedTerm.trim().length < 2) {
      return [];
    }
    // Se o termo atual é exatamente o nome do cliente já selecionado, não precisa reabrir
    if (selectedCustomerId && searchTerm === selectedCustomerName) {
      return [];
    }
    return searchSmartCustomers(customers, debouncedTerm, motorcycles, { limit: 25 });
  }, [customers, debouncedTerm, motorcycles, selectedCustomerId, selectedCustomerName, searchTerm]);

  // Abrir lista quando houver termo
  useEffect(() => {
    if (searchTerm.trim().length >= 2 && (!selectedCustomerId || searchTerm !== selectedCustomerName)) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm, selectedCustomerId, selectedCustomerName]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rolagem suave do item selecionado por teclado
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectCustomer = (result: typeof searchResults[0]) => {
    const cust = result.customer;
    setSearchTerm(cust.name);
    setDebouncedTerm(cust.name);
    setIsOpen(false);
    setSelectedIndex(-1);

    onSelectCustomer(cust, result.matchedMoto);
  };

  const handleClear = () => {
    setSearchTerm('');
    setDebouncedTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onClearCustomer) {
      onClearCustomer();
    }
    inputRef.current?.focus();
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === 'ArrowDown' && searchTerm.trim().length >= 2) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectCustomer(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelectCustomer(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Formata telefone mantendo privacidade quando necessário
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  return (
    <div ref={containerRef} className={`relative z-[120] w-full ${className}`}>
      {/* Input de Busca de Cliente */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim().length >= 2 && (!selectedCustomerId || searchTerm !== selectedCustomerName)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 h-[38px]"
        />

        {/* Botão Limpar ou Spinner */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 size={13} className="animate-spin text-rose-500" />
          )}
          {(searchTerm || selectedCustomerId) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              title="Limpar cliente"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Lista Flutuante de Clientes Encontrados */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-full min-w-[340px] max-w-lg bg-white border border-slate-200 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] max-h-80 overflow-hidden z-[200] flex flex-col dark:bg-slate-900 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>{searchResults.length} {searchResults.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}</span>
            <span className="text-[10px] text-slate-400">Pressione ↑ ↓ e Enter</span>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar bg-white dark:bg-slate-900">
            {searchResults.length > 0 ? (
              searchResults.map((res, idx) => {
                const isSelected = idx === selectedIndex;
                const cust = res.customer;
                const isBlocked = isCustomerBlocked ? isCustomerBlocked(cust) : cust.credit_status?.includes('BLOQUEADO');
                const highlightedName = getHighlightedSegments(cust.name, debouncedTerm);
                const phoneFormatted = formatPhone(cust.whatsapp || cust.phone);

                return (
                  <button
                    key={`cust-${cust.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCustomer(res)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      {/* Nome com destaque */}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-800 uppercase dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                          {highlightedName.map((seg, i) =>
                            seg.match ? (
                              <mark
                                key={i}
                                className="bg-rose-200/90 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 rounded px-0.5 font-black"
                              >
                                {seg.text}
                              </mark>
                            ) : (
                              <span key={i}>{seg.text}</span>
                            )
                          )}
                        </p>

                        {/* Status de Bloqueio */}
                        {isBlocked ? (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                            BLOQUEADO (+30D)
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                            LIBERADO
                          </span>
                        )}
                      </div>

                      {/* Apelido e Telefone */}
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                        {cust.nickname && (
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            Apelido: {cust.nickname} •
                          </span>
                        )}
                        {phoneFormatted && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {phoneFormatted}
                          </span>
                        )}
                        {res.matchedField === 'phone' && (
                          <span className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 px-1 rounded text-[9px] font-bold">
                            match telefone
                          </span>
                        )}
                      </div>

                      {/* Motos Cadastradas */}
                      {res.motorcycles.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {res.motorcycles.slice(0, 2).map(m => {
                            const isMatchedMoto = res.matchedMoto?.id === m.id;
                            return (
                              <span
                                key={m.id}
                                className={`text-[10px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-bold ${
                                  isMatchedMoto
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                                }`}
                              >
                                <Bike size={10} />
                                {m.model || m.brand} <span className="opacity-80">({m.plate})</span>
                              </span>
                            );
                          })}
                          {res.motorcycles.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{res.motorcycles.length - 2} motos
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-rose-500 group-hover:text-white dark:bg-slate-700 dark:group-hover:bg-rose-600 text-slate-400 flex items-center justify-center transition-colors">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center">
                <Users size={32} className="mx-auto text-slate-500 mb-2" />
                <p className="text-xs font-black text-slate-200 uppercase tracking-wide">
                  Nenhum cliente encontrado para "{debouncedTerm}"
                </p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Deseja cadastrar este novo cliente na oficina?
                </p>
                {onOpenNewCustomerModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenNewCustomerModal();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
                  >
                    <UserPlus size={15} />
                    Cadastrar Novo Cliente Agora
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botão + Cadastrar novo cliente (sempre visível no rodapé do dropdown) */}
          {onOpenNewCustomerModal && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  onOpenNewCustomerModal();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(225,29,72,0.45)] hover:shadow-[0_4px_25px_rgba(225,29,72,0.65)] active:scale-[0.98] cursor-pointer border border-rose-400/40"
              >
                <UserPlus size={16} strokeWidth={2.5} className="text-white" />
                <span>+ CADASTRAR NOVO CLIENTE</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCustomerSearch;

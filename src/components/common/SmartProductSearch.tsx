import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Package,
  Wrench,
  PlusCircle,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Layers
} from 'lucide-react';
import {
  ProductItem,
  ServiceItem,
  searchSmartProducts,
  getHighlightedSegments
} from '../../utils/smartSearch';

export interface SmartProductSearchProps {
  products: ProductItem[];
  services?: ServiceItem[];
  chargeType?: 'vista' | 'credito_30_dias' | 'atacado';
  onSelectProduct: (product: ProductItem) => void;
  onSelectService?: (service: ServiceItem) => void;
  onAddCustomItem?: (description: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  allowZeroStock?: boolean;
}

export const SmartProductSearch: React.FC<SmartProductSearchProps> = ({
  products,
  services = [],
  chargeType = 'vista',
  onSelectProduct,
  onSelectService,
  onAddCustomItem,
  placeholder = 'Buscar peça/serviço ou digite para adicionar item avulso...',
  autoFocus = false,
  className = '',
  allowZeroStock = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce de ~150ms para suavizar digitação ultra rápida
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Executa busca inteligente com ranking
  const searchResults = useMemo(() => {
    if (!debouncedTerm || debouncedTerm.trim().length < 2) {
      return [];
    }
    return searchSmartProducts(products, debouncedTerm, {
      services,
      limit: 35,
      activePriceTable: (chargeType as 'vista' | 'credito_30_dias' | 'atacado') || 'vista',
    });
  }, [products, services, debouncedTerm, chargeType]);

  // Abre dropdown automaticamente quando houver termo válido
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  // Fechar dropdown ao clicar fora
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

  // Função para calcular preço conforme a tabela selecionada
  const getDisplayPrice = useCallback((item: ProductItem) => {
    if (item.is_service) return item.sale_price || 0;
    if (chargeType === 'credito_30_dias' && item.sale_price_credit) {
      return item.sale_price_credit;
    }
    if (chargeType === 'atacado' && item.sale_price_wholesale) {
      return item.sale_price_wholesale;
    }
    return item.sale_price || 0;
  }, [chargeType]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Manipular seleção de produto ou serviço
  const handleSelect = (result: typeof searchResults[0]) => {
    if (result.type === 'service') {
      if (onSelectService) {
        onSelectService(result.item as any);
      } else {
        onSelectProduct(result.item);
      }
    } else {
      if (!allowZeroStock && result.item.stock <= 0) {
        const confirmZero = window.confirm(`Atenção: A peça "${result.item.description}" está com estoque ZERO. Deseja adicionar mesmo assim?`);
        if (!confirmZero) return;
      }
      onSelectProduct(result.item);
    }

    // Limpa a busca e mantém o foco no campo para digitar a próxima peça
    setSearchTerm('');
    setDebouncedTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Adicionar item avulso
  const handleAddCustom = () => {
    if (onAddCustomItem && searchTerm.trim()) {
      onAddCustomItem(searchTerm.trim().toUpperCase());
      setSearchTerm('');
      setDebouncedTerm('');
      setIsOpen(false);
      setSelectedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
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
        handleSelect(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else if (onAddCustomItem && searchTerm.trim()) {
        handleAddCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative z-40 w-full ${className}`}>
      {/* Caixa de Entrada Principal */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 bg-rose-100 dark:bg-rose-900/40 p-2 rounded-xl flex items-center justify-center pointer-events-none">
          {isSearching ? (
            <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-rose-600 dark:text-rose-400" />
          ) : (
            <Search size={18} strokeWidth={2.5} className="text-rose-600 dark:text-rose-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-16 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:border-rose-400 dark:focus:bg-slate-900 shadow-sm"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDebouncedTerm('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors"
            title="Limpar pesquisa"
          >
            <X size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Lista Flutuante de Resultados Profissional */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[58vh] overflow-hidden z-50 flex flex-col dark:bg-slate-800 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Cabeçalho de Resumo / Filtro Ativo */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-rose-500" />
              {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </span>
            <span className="text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">
              Tabela: {chargeType === 'vista' ? 'À Vista' : chargeType === 'credito_30_dias' ? '30 Dias' : 'Atacado'}
            </span>
          </div>

          {/* Lista com Rolagem */}
          <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 custom-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((res, idx) => {
                const isSelected = idx === selectedIndex;
                const isService = res.type === 'service';
                const item = res.item;
                const price = getDisplayPrice(item);
                const stock = item.stock ?? 0;
                const highlighted = getHighlightedSegments(item.description, debouncedTerm);

                return (
                  <button
                    key={`${res.type}-${item.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(res)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3.5 transition-colors group cursor-pointer ${
                      isSelected
                        ? isService
                          ? 'bg-amber-50 dark:bg-amber-950/30'
                          : 'bg-rose-50/90 dark:bg-rose-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    {/* Imagem ou Ícone de Categoria */}
                    <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      {isService ? (
                        <Wrench size={22} className="text-amber-500 dark:text-amber-400" />
                      ) : item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.description}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package size={22} className="text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    {/* Detalhes da Peça / Serviço */}
                    <div className="flex-1 min-w-0">
                      {/* Descrição com Destaque nas Palavras Encontradas */}
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-snug line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {highlighted.map((seg, i) =>
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

                      {/* Badges: Estoque, Aplicação, Marca, Prateleira, SKU */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {isService ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Wrench size={10} /> Serviço Especializado
                          </span>
                        ) : (
                          <>
                            {/* Indicador Discreto de Estoque */}
                            {stock > 5 ? (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/40">
                                <CheckCircle2 size={10} /> Estoque: {stock}
                              </span>
                            ) : stock > 0 ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-200/60 dark:border-amber-800/40">
                                <AlertTriangle size={10} /> Baixo: {stock}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-rose-200/60 dark:border-rose-800/40">
                                <XCircle size={10} /> Sem estoque
                              </span>
                            )}

                            {/* Aplicação da Peça (Compatibilidade com moto) */}
                            {item.application && (
                              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-sky-200/60 dark:border-sky-800/40 truncate max-w-[200px]" title={item.application}>
                                <Tag size={10} /> {item.application}
                              </span>
                            )}

                            {/* Marca */}
                            {item.brand && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300 px-2 py-0.5 rounded-md uppercase">
                                {item.brand}
                              </span>
                            )}

                            {/* Localização na Prateleira */}
                            {item.location && (
                              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/40">
                                <MapPin size={10} /> {item.location}
                              </span>
                            )}

                            {/* SKU / Código */}
                            {(item.sku || item.barcode || item.alt_code) && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                Cód: {item.sku || item.barcode || item.alt_code}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Preço e Ação */}
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className={`text-sm font-black ${isService ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatBRL(price)}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                          {isService ? 'Mão de Obra' : chargeType === 'vista' ? 'À Vista' : chargeType === 'credito_30_dias' ? '30 Dias' : 'Atacado'}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-rose-500 group-hover:text-white dark:bg-slate-700 dark:group-hover:bg-rose-600 text-slate-500 flex items-center justify-center transition-colors">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 px-4 text-center">
                <Package size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhuma peça ou serviço encontrado para "{debouncedTerm}"
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Dica: use termos curtos como <span className="font-bold text-rose-500">cabo acel</span>, <span className="font-bold text-rose-500">rel titan</span>, <span className="font-bold text-rose-500">lona 025</span> ou <span className="font-bold text-rose-500">filtro faz</span>.
                </p>
              </div>
            )}
          </div>

          {/* Adicionar como Item Avulso (fixo na base) */}
          {onAddCustomItem && searchTerm.trim() && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-900/60 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle size={16} strokeWidth={2.5} />
                Adicionar "{searchTerm.trim().toUpperCase()}" como item avulso
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartProductSearch;

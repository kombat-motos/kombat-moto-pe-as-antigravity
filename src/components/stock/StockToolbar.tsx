import React, { useState } from 'react';
import { 
  Search, 
  List, 
  LayoutGrid, 
  Package, 
  Printer, 
  ClipboardCheck, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Trash2, 
  X, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { QuickFilterType } from './types';

export interface AdvancedFiltersState {
  brand: string;
  category: string;
  location: string;
  distributor: string;
  minPrice: string;
  maxPrice: string;
}

interface StockToolbarProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  activeQuickFilter: QuickFilterType;
  onSelectQuickFilter: (filter: QuickFilterType) => void;
  advancedFilters: AdvancedFiltersState;
  onAdvancedFiltersChange: (filters: AdvancedFiltersState) => void;
  onResetAdvancedFilters: () => void;
  availableBrands: string[];
  availableCategories: string[];
  availableLocations: string[];
  availableDistributors: string[];
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  loading: boolean;
  onRefresh: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  onOpenQuickInventory: () => void;
  onOpenMassPriceUpdate: () => void;
  onOpenMassCreditUpdate: () => void;
  onOpenMassWholesaleUpdate?: () => void;
  onAddNewProduct: () => void;
  selectedProductIds: number[];
  onClearSelection: () => void;
  onBulkDelete: () => void;
  totalFiltered: number;
}

export const StockToolbar: React.FC<StockToolbarProps> = ({
  searchTerm,
  onSearchTermChange,
  activeQuickFilter,
  onSelectQuickFilter,
  advancedFilters,
  onAdvancedFiltersChange,
  onResetAdvancedFilters,
  availableBrands,
  availableCategories,
  availableLocations,
  availableDistributors,
  viewMode,
  onViewModeChange,
  loading,
  onRefresh,
  onImportExcel,
  onExportExcel,
  onOpenQuickInventory,
  onOpenMassPriceUpdate,
  onOpenMassCreditUpdate,
  onOpenMassWholesaleUpdate,
  onAddNewProduct,
  selectedProductIds,
  onClearSelection,
  onBulkDelete,
  totalFiltered
}) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const activeAdvancedCount = [
    advancedFilters.brand,
    advancedFilters.category,
    advancedFilters.location,
    advancedFilters.distributor,
    advancedFilters.minPrice,
    advancedFilters.maxPrice
  ].filter(Boolean).length;

  const quickFilterOptions: Array<{ id: QuickFilterType; label: string }> = [
    { id: 'ALL', label: 'TODOS' },
    { id: 'IN_STOCK', label: 'COM ESTOQUE' },
    { id: 'LOW_STOCK', label: 'ESTOQUE BAIXO' },
    { id: 'OUT_OF_STOCK', label: 'SEM ESTOQUE' },
    { id: 'NO_IMAGE', label: 'SEM IMAGEM' },
    { id: 'NO_EAN', label: 'SEM EAN' },
    { id: 'NO_LOCATION', label: 'SEM LOCALIZAÇÃO' },
  ];

  return (
    <div className="space-y-3">
      {/* ── Barra Superior Principal: Busca + Alternador Lista/Cards + Ações Globais ── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Campo de Busca Principal com leitor de código de barras */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
            <input
              type="text"
              id="stock-search-input"
              placeholder="Buscar por produto, SKU, código, EAN, marca, aplicação ou localização..."
              value={searchTerm}
              onChange={e => onSearchTermChange(e.target.value)}
              className="w-full h-10 pl-10 pr-10 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchTermChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Botão Filtros Avançados */}
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className={`h-10 px-3.5 flex items-center gap-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeAdvancedCount > 0 || isAdvancedFiltersOpen
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros Avançados</span>
            {activeAdvancedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {activeAdvancedCount}
              </span>
            )}
          </button>

          {/* Alternador Lista / Cards */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-10 items-center border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Lista"
            >
              <List size={16} />
              <span className="hidden md:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={16} />
              <span className="hidden md:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Toolbar de Ações Operacionais */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="Sincronizar Estoque"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-rose-600' : ''} />
          </button>

          {/* Importar Planilha */}
          <label className="h-10 flex items-center justify-center gap-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs cursor-pointer shadow-2xs">
            <Package size={16} />
            <span className="hidden sm:inline">Importar</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onImportExcel} />
          </label>

          {/* Exportar Planilha */}
          <button
            type="button"
            onClick={onExportExcel}
            className="h-10 flex items-center justify-center gap-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-xs shadow-2xs"
            title="Exportar catálogo em Excel"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Contagem Rápida */}
          <button
            type="button"
            onClick={onOpenQuickInventory}
            className="h-10 flex items-center justify-center gap-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-tight shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Abrir contagem rápida de balanço"
          >
            <ClipboardCheck size={18} />
            <span>Contagem Rápida</span>
          </button>

          {/* Preços em Massa */}
          <button
            type="button"
            onClick={onOpenMassPriceUpdate}
            className="h-10 flex items-center justify-center gap-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all font-bold text-xs shadow-2xs"
            title="Reajuste de preços à vista em massa"
          >
            <TrendingUp size={16} />
            <span className="hidden lg:inline">Preços em Massa</span>
          </button>

          {/* Preços 30 Dias (Massa) */}
          <button
            type="button"
            onClick={onOpenMassCreditUpdate}
            className="h-10 flex items-center justify-center gap-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-bold text-xs shadow-2xs"
            title="Reajuste de preços no crédito 30 dias em massa"
          >
            <TrendingUp size={16} />
            <span className="hidden lg:inline">Preços 30 Dias</span>
          </button>

          {/* Preços Atacado (Massa) */}
          {onOpenMassWholesaleUpdate && (
            <button
              type="button"
              onClick={onOpenMassWholesaleUpdate}
              className="h-10 flex items-center justify-center gap-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all font-bold text-xs shadow-2xs"
              title="Reajuste de preços de venda no atacado em massa"
            >
              <TrendingUp size={16} />
              <span className="hidden lg:inline">Preços Atacado</span>
            </button>
          )}

          {/* Novo Produto */}
          <button
            type="button"
            onClick={onAddNewProduct}
            className="h-10 flex items-center justify-center gap-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-wider shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* ── Painel Expansível de Filtros Avançados ── */}
      {isAdvancedFiltersOpen && (
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-rose-600" />
              Filtros Avançados de Catálogo
            </h4>
            {activeAdvancedCount > 0 && (
              <button
                type="button"
                onClick={onResetAdvancedFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} />
                Limpar Todos os Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Marca */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Marca</label>
              <select
                value={advancedFilters.brand}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, brand: e.target.value })}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">Todas as marcas</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
              <select
                value={advancedFilters.category}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, category: e.target.value })}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">Todas as categorias</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Localização */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Localização</label>
              <select
                value={advancedFilters.location}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, location: e.target.value })}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">Todas as localizações</option>
                {availableLocations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Fornecedor</label>
              <select
                value={advancedFilters.distributor}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, distributor: e.target.value })}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">Todos os fornecedores</option>
                {availableDistributors.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Preço Mínimo */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Preço Mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={advancedFilters.minPrice}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, minPrice: e.target.value })}
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Preço Máximo */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Preço Máximo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 9999,00"
                value={advancedFilters.maxPrice}
                onChange={e => onAdvancedFiltersChange({ ...advancedFilters, maxPrice: e.target.value })}
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Barra de Filtros Rápidos (Chips) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {quickFilterOptions.map(opt => {
            const isSelected = activeQuickFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectQuickFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight border ${
                  isSelected
                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ml-auto">
          {totalFiltered} produto{totalFiltered === 1 ? '' : 's'} exibido{totalFiltered === 1 ? '' : 's'}
        </div>
      </div>

      {/* ── Barra de Seleção Contextual (Quando há checkboxes marcados) ── */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-4 py-2.5 rounded-2xl shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {selectedProductIds.length} produto{selectedProductIds.length > 1 ? 's' : ''} selecionado{selectedProductIds.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenMassPriceUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-2xs"
            >
              <TrendingUp size={14} />
              Reajustar Preços
            </button>

            <button
              type="button"
              onClick={onOpenMassCreditUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-2xs"
            >
              <TrendingUp size={14} />
              Reajustar 30 Dias
            </button>

            {onOpenMassWholesaleUpdate && (
              <button
                type="button"
                onClick={onOpenMassWholesaleUpdate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-2xs"
              >
                <TrendingUp size={14} />
                Reajustar Atacado
              </button>
            )}

            <button
              type="button"
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-2xs"
            >
              <Trash2 size={14} />
              Excluir Selecionados
            </button>

            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

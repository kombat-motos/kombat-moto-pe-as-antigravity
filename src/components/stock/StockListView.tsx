import React, { useState } from 'react';
import { 
  Copy, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  MapPin 
} from 'lucide-react';
import { Product, SortField, SortDirection } from './types';

interface StockListViewProps {
  products: Product[];
  selectedProductIds: number[];
  onToggleSelectProduct: (id: number) => void;
  onSelectAllVisible: (selected: boolean) => void;
  onOpenProductDetail: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onCloneProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  formatBRL: (val: number) => string;
  loading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

export const StockListView: React.FC<StockListViewProps> = ({
  products,
  selectedProductIds,
  onToggleSelectProduct,
  onSelectAllVisible,
  onOpenProductDetail,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
  formatBRL,
  loading,
  sortField,
  sortDirection,
  onSortChange
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="text-rose-600 dark:text-rose-400" />
      : <ArrowDown size={12} className="text-rose-600 dark:text-rose-400" />;
  };

  const allVisibleSelected = products.length > 0 && products.every(p => selectedProductIds.includes(p.id));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse text-xs">
          {/* Cabeçalho Fixo ERP */}
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
            <tr className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
              {/* Checkbox Geral */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  checked={allVisibleSelected}
                  onChange={e => onSelectAllVisible(e.target.checked)}
                  aria-label="Selecionar todos os visíveis"
                />
              </th>

              {/* Foto */}
              <th className="py-3 px-2 w-14 text-center">Foto</th>

              {/* Descrição / Produto */}
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[240px]"
                onClick={() => onSortChange('description')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Produto / Descrição</span>
                  {renderSortIcon('description')}
                </div>
              </th>

              {/* Códigos (SKU / EAN / ALT) */}
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[150px]"
                onClick={() => onSortChange('sku')}
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU / EAN / Cód.</span>
                  {renderSortIcon('sku')}
                </div>
              </th>

              {/* Marca */}
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[110px]"
                onClick={() => onSortChange('brand')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Marca</span>
                  {renderSortIcon('brand')}
                </div>
              </th>

              {/* Aplicação */}
              <th className="py-3 px-3 min-w-[180px]">Aplicação</th>

              {/* Localização no Estoque (Destaque) */}
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[140px]"
                onClick={() => onSortChange('location')}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-amber-600 dark:text-amber-400" />
                  <span>Localização</span>
                  {renderSortIcon('location')}
                </div>
              </th>

              {/* Preços */}
              <th 
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[150px]"
                onClick={() => onSortChange('sale_price')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Preços (C/V/30D)</span>
                  {renderSortIcon('sale_price')}
                </div>
              </th>

              {/* Estoque */}
              <th 
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-w-[100px]"
                onClick={() => onSortChange('stock')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Estoque</span>
                  {renderSortIcon('stock')}
                </div>
              </th>

              {/* Ações */}
              <th className="py-3 px-3 text-right w-28">Ações</th>
            </tr>
          </thead>

          {/* Corpo da Tabela */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Carregando catálogo de estoque...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center text-slate-400 font-medium">
                  Nenhum produto encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              products.map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                const stockVal = Number(product.stock) || 0;
                
                // Badges de estoque exclusivamente visuais
                let stockBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
                let stockStatusLabel = 'NORMAL';
                if (stockVal <= 0) {
                  stockBadgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
                  stockStatusLabel = 'ZERADO';
                } else if (stockVal <= 2) {
                  stockBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
                  stockStatusLabel = 'BAIXO';
                }

                return (
                  <tr
                    key={product.id}
                    onClick={() => onOpenProductDetail(product)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        checked={isSelected}
                        onChange={() => onToggleSelectProduct(product.id)}
                      />
                    </td>

                    {/* Foto com object-contain */}
                    <td className="py-2 px-2 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpenProductDetail(product)}
                        className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-105 transition-transform"
                        title="Ver ficha completa"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.description}
                            className="w-full h-full object-contain p-0.5"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon size={18} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    </td>

                    {/* Descrição / Categoria */}
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 text-xs sm:text-sm">
                        {product.description}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.category && (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {product.category}
                          </span>
                        )}
                        {product.distributor && (
                          <span className="text-[9px] text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                            Forn: {product.distributor}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Códigos (SKU, EAN, ALT_CODE) com botão discreto de copiar */}
                    <td className="py-2.5 px-3 font-mono text-[11px]" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col gap-0.5">
                        {/* SKU */}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-[9px] font-sans font-bold">SKU:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{product.sku || '-'}</span>
                          {product.sku && (
                            <button
                              type="button"
                              onClick={e => handleCopy(e, product.sku)}
                              className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Copiar SKU"
                            >
                              {copiedCode === product.sku ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          )}
                        </div>

                        {/* EAN / Código de Barras */}
                        {product.barcode && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[9px] font-sans font-bold">EAN:</span>
                            <span className="text-slate-600 dark:text-slate-400">{product.barcode}</span>
                            <button
                              type="button"
                              onClick={e => handleCopy(e, product.barcode)}
                              className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Copiar EAN"
                            >
                              {copiedCode === product.barcode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}

                        {/* ALT_CODE */}
                        {product.alt_code && (
                          <div className="flex items-center gap-1">
                            <span className="text-rose-500 text-[9px] font-sans font-black">REF:</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{product.alt_code}</span>
                            <button
                              type="button"
                              onClick={e => handleCopy(e, product.alt_code || '')}
                              className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Copiar Referência"
                            >
                              {copiedCode === product.alt_code ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Marca */}
                    <td className="py-2.5 px-3">
                      {product.brand ? (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-black uppercase tracking-tight">
                          {product.brand}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Aplicação Resumida */}
                    <td className="py-2.5 px-3 max-w-[220px]">
                      <span 
                        className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[11px] font-medium leading-tight"
                        title={product.application || 'Nenhuma aplicação cadastrada'}
                      >
                        {product.application || <span className="text-slate-400 italic">Não informada</span>}
                      </span>
                    </td>

                    {/* Localização Física em Destaque */}
                    <td className="py-2.5 px-3">
                      {product.location ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          <MapPin size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{product.location}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[10px] italic">Sem local</span>
                      )}
                    </td>

                    {/* Preços Múltiplos */}
                    <td className="py-2.5 px-4 text-right">
                      {/* Preço de Custo (Sutil / Riscado) */}
                      {Number(product.purchase_price) > 0 && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 line-through leading-none mb-0.5" title="Preço de Custo">
                          {formatBRL(product.purchase_price)}
                        </div>
                      )}
                      
                      {/* Preço À Vista */}
                      <div className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight" title="Preço de Venda à Vista">
                        {formatBRL(product.sale_price)}
                      </div>

                      {/* Preço 30 Dias (Crédito) */}
                      {product.sale_price_credit && Number(product.sale_price_credit) > 0 ? (
                        <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 leading-none" title="Preço de Venda no Crédito 30 Dias">
                          30D: {formatBRL(product.sale_price_credit)}
                        </div>
                      ) : null}

                      {/* Preço Atacado */}
                      {product.sale_price_wholesale && Number(product.sale_price_wholesale) > 0 ? (
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none" title="Preço de Atacado">
                          Atac: {formatBRL(product.sale_price_wholesale)}
                        </div>
                      ) : null}
                    </td>

                    {/* Estoque com Badges Visuais */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-tight border ${stockBadgeStyle}`}>
                          {stockVal} {product.unit || 'UN'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                          {stockStatusLabel}
                        </span>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenProductDetail(product)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Ficha Completa"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCloneProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Duplicar Produto"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar Produto"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Excluir Produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Copy, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Eye, 
  Check, 
  MapPin 
} from 'lucide-react';
import { Product } from './types';

interface StockCardViewProps {
  products: Product[];
  selectedProductIds: number[];
  onToggleSelectProduct: (id: number) => void;
  onOpenProductDetail: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onCloneProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  formatBRL: (val: number) => string;
}

export const StockCardView: React.FC<StockCardViewProps> = ({
  products,
  selectedProductIds,
  onToggleSelectProduct,
  onOpenProductDetail,
  onEditProduct,
  onCloneProduct,
  onDeleteProduct,
  formatBRL
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (products.length === 0) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
        Nenhum produto encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => {
        const isSelected = selectedProductIds.includes(product.id);
        const stockVal = Number(product.stock) || 0;

        // Regra visual de badges
        let stockBadgeStyle = 'bg-emerald-600 text-white';
        let stockLabel = 'Normal';
        if (stockVal <= 0) {
          stockBadgeStyle = 'bg-rose-600 text-white';
          stockLabel = 'Sem Estoque';
        } else if (stockVal <= 2) {
          stockBadgeStyle = 'bg-amber-500 text-white';
          stockLabel = 'Baixo';
        }

        return (
          <div
            key={product.id}
            className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative group overflow-hidden ${
              isSelected 
                ? 'border-rose-500 ring-2 ring-rose-500/20' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {/* Checkbox Superior Esquerdo */}
            <div className="absolute top-2.5 left-2.5 z-20" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer shadow-2xs"
                checked={isSelected}
                onChange={() => onToggleSelectProduct(product.id)}
                aria-label={`Selecionar ${product.description}`}
              />
            </div>

            {/* Badge de Estoque Superior Direito */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xs ${stockBadgeStyle}`}>
                {stockVal} {product.unit || 'UN'} • {stockLabel}
              </span>
            </div>

            {/* Imagem (object-contain compacto que não domina o card) */}
            <div
              className="h-36 bg-slate-50 dark:bg-slate-800/60 relative overflow-hidden flex items-center justify-center cursor-pointer border-b border-slate-100 dark:border-slate-800"
              onClick={() => onOpenProductDetail(product)}
              title="Clique para ver a ficha completa"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.description}
                  className="w-full h-full object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-slate-300 dark:text-slate-600">
                  <ImageIcon size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem Imagem</span>
                </div>
              )}
            </div>

            {/* Conteúdo Técnico e Comercial */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                {/* 1. Nome do Produto (Destaque principal) */}
                <h3 
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight uppercase cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  onClick={() => onOpenProductDetail(product)}
                  title={product.description}
                >
                  {product.description}
                </h3>

                {/* Marca e Categoria */}
                <div className="flex items-center gap-1.5 mt-1">
                  {product.brand && (
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-black uppercase tracking-wider">
                      {product.brand}
                    </span>
                  )}
                  {product.category && (
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* 2. Localização no Estoque em Alto Destaque */}
                <div className="mt-2.5 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-1.5">
                  <MapPin size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 truncate">
                    {product.location ? `Loc: ${product.location}` : 'Sem localização'}
                  </span>
                </div>

                {/* 3. Aplicação (Até duas linhas) */}
                <div className="mt-2">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-tight">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Aplicação: </span>
                    {product.application || 'Não informada'}
                  </p>
                </div>

                {/* 4. Códigos: SKU e EAN com botão de cópia */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 font-mono text-[10px]">
                  {/* SKU */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans font-bold">SKU:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{product.sku || '-'}</span>
                      {product.sku && (
                        <button
                          type="button"
                          onClick={e => handleCopy(e, product.sku)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Copiar SKU"
                        >
                          {copiedCode === product.sku ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EAN */}
                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans font-bold">EAN:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 dark:text-slate-400">{product.barcode}</span>
                        <button
                          type="button"
                          onClick={e => handleCopy(e, product.barcode)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Copiar EAN"
                        >
                          {copiedCode === product.barcode ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ALT_CODE */}
                  {product.alt_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-rose-500 font-sans font-bold">REF:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{product.alt_code}</span>
                        <button
                          type="button"
                          onClick={e => handleCopy(e, product.alt_code || '')}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Copiar Referência"
                        >
                          {copiedCode === product.alt_code ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Preços e Ações */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-end justify-between mb-2.5">
                  <div>
                    {Number(product.purchase_price) > 0 && (
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 line-through leading-none mb-0.5">
                        {formatBRL(product.purchase_price)}
                      </p>
                    )}
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 leading-none">
                      {formatBRL(product.sale_price)}
                    </p>
                    {product.sale_price_credit && Number(product.sale_price_credit) > 0 ? (
                      <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 leading-none">
                        30D: {formatBRL(product.sale_price_credit)}
                      </p>
                    ) : null}
                    {product.sale_price_wholesale && Number(product.sale_price_wholesale) > 0 ? (
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none">
                        Atac: {formatBRL(product.sale_price_wholesale)}
                      </p>
                    ) : null}
                  </div>

                  {/* Botão Ver Ficha */}
                  <button
                    type="button"
                    onClick={() => onOpenProductDetail(product)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                  >
                    <Eye size={12} />
                    Ficha
                  </button>
                </div>

                {/* Ações Rápidas (Clonar, Editar, Excluir) */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => onCloneProduct(product)}
                    className="py-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                    title="Clonar Produto"
                  >
                    <Copy size={12} />
                    Clonar
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="py-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-600 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                    title="Editar Produto"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                    className="py-1 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                    title="Excluir Produto"
                  >
                    <Trash2 size={12} />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

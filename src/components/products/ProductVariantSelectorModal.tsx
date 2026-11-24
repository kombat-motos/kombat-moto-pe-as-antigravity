import React, { useState } from 'react';
import { X, Check, ShoppingCart, Tag, MapPin, AlertTriangle } from 'lucide-react';
import { Product } from '../stock/types';

export interface ProductVariantItem {
  id: number;
  product_id: number;
  sku: string;
  barcode?: string;
  original_code?: string;
  alt_code?: string;
  purchase_price: number;
  sale_price: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
  stock: number;
  min_stock?: number;
  location?: string;
  sector?: string;
  shelf?: string;
  image_url?: string;
  status: string;
  attribute_combination: Record<string, string> | string;
}

interface ProductVariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variants: ProductVariantItem[];
  chargeType: 'vista' | 'credito_30_dias' | 'atacado' | 'fiado';
  onSelectVariant: (variant: ProductVariantItem, price: number) => void;
  formatBRL: (val: number) => string;
}

export const ProductVariantSelectorModal: React.FC<ProductVariantSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  variants,
  chargeType,
  onSelectVariant,
  formatBRL
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  const getEffectivePrice = (v: ProductVariantItem) => {
    if (chargeType === 'credito_30_dias' && v.sale_price_credit) return Number(v.sale_price_credit);
    if (chargeType === 'atacado' && v.sale_price_wholesale) return Number(v.sale_price_wholesale);
    return Number(v.sale_price) || Number(product.sale_price);
  };

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;

  const handleConfirm = () => {
    if (!selectedVariant) {
      alert('Selecione uma variação antes de continuar.');
      return;
    }
    const price = getEffectivePrice(selectedVariant);
    onSelectVariant(selectedVariant, price);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-[#0c1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Topo */}
        <div className="p-4 bg-[#111928] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">{product.description}</h2>
              <p className="text-xs text-slate-400">
                Escolha a variação desejada para adicionar ao pedido / venda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de Variações */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {variants.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma opção de variação ativa para este produto.
            </div>
          ) : (
            variants.map(v => {
              const isSelected = selectedVariantId === v.id;
              const price = getEffectivePrice(v);
              const isOutOfStock = v.stock <= 0;

              let combinationStr = '';
              if (typeof v.attribute_combination === 'object' && v.attribute_combination) {
                combinationStr = Object.entries(v.attribute_combination)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(' | ');
              } else if (typeof v.attribute_combination === 'string') {
                try {
                  const parsed = JSON.parse(v.attribute_combination);
                  combinationStr = Object.entries(parsed)
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(' | ');
                } catch (e) {
                  combinationStr = v.attribute_combination;
                }
              }

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  } ${isOutOfStock ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-600 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white">
                          {combinationStr || v.sku || 'Opção'}
                        </strong>
                        {v.sku && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                            SKU: {v.sku}
                          </span>
                        )}
                        {v.barcode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                            EAN: {v.barcode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          Estoque:{' '}
                          <strong
                            className={`font-mono ${
                              v.stock > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {v.stock} un.
                          </strong>
                        </span>
                        {v.location && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin size={11} className="text-slate-400" /> {v.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-rose-400 font-mono">
                      {formatBRL(price)}
                    </div>
                    {isOutOfStock && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 justify-end">
                        <AlertTriangle size={10} /> Sem estoque
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé de Confirmação */}
        <div className="p-4 bg-[#111928] border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedVariant ? (
              <span>Variação selecionada pronta para adicionar ao pedido.</span>
            ) : (
              <span>Clique na variação desejada.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedVariant}
              onClick={handleConfirm}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer"
            >
              <ShoppingCart size={14} /> Adicionar Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductVariantSelectorModal;

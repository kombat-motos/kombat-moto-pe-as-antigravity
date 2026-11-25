import React, { useState, useMemo } from 'react';
import { X, Check, ShoppingCart, Tag, MapPin, AlertTriangle, Search, Layers, ChevronRight, Package } from 'lucide-react';
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
  // Campos complementares de aplicação/ano caso existam
  application?: string;
  year?: string;
  color?: string;
}

export interface SelectedVariantResult {
  variant: ProductVariantItem;
  quantity: number;
  price: number;
  total: number;
  fullDescription: string;
  variantDescription: string;
  sku: string;
  barcode?: string;
  unit: string;
}

interface ProductVariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variants: ProductVariantItem[];
  chargeType: 'vista' | 'credito_30_dias' | 'atacado' | 'fiado';
  onSelectVariant: (selected: SelectedVariantResult) => void;
  formatBRL: (val: number) => string;
  titleContext?: string; // ex: "Venda PDV" ou "Ordem de Serviço"
}

export const ProductVariantSelectorModal: React.FC<ProductVariantSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  variants,
  chargeType,
  onSelectVariant,
  formatBRL,
  titleContext = 'Venda PDV'
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reinicia estados ao abrir com novo produto
  React.useEffect(() => {
    if (isOpen && variants.length > 0) {
      // Seleciona a primeira variação que tenha estoque disponível por padrão
      const firstWithStock = variants.find(v => (v.stock || 0) > 0 && v.status !== 'Inativo');
      if (firstWithStock) {
        setSelectedVariantId(firstWithStock.id);
      } else {
        setSelectedVariantId(variants[0].id);
      }
      setQuantity(1);
      setSearchTerm('');
    }
  }, [isOpen, product?.id, variants]);

  if (!isOpen || !product) return null;

  const getEffectivePrice = (v: ProductVariantItem): number => {
    if ((chargeType === 'credito_30_dias' || chargeType === 'fiado') && v.sale_price_credit && Number(v.sale_price_credit) > 0) {
      return Number(v.sale_price_credit);
    }
    if (chargeType === 'atacado' && v.sale_price_wholesale && Number(v.sale_price_wholesale) > 0) {
      return Number(v.sale_price_wholesale);
    }
    return Number(v.sale_price) || Number(product.sale_price) || 0;
  };

  const getVariantLabel = (v: ProductVariantItem): string => {
    if (typeof v.attribute_combination === 'object' && v.attribute_combination !== null) {
      return Object.entries(v.attribute_combination)
        .map(([_, val]) => String(val))
        .join(' - ');
    } else if (typeof v.attribute_combination === 'string') {
      try {
        const parsed = JSON.parse(v.attribute_combination);
        return Object.entries(parsed)
          .map(([_, val]) => String(val))
          .join(' - ');
      } catch (e) {
        return v.attribute_combination;
      }
    }
    return v.sku || 'Opção';
  };

  // Separa e ordena: primeiro as variações COM estoque, depois as SEM estoque (em vermelho e bloqueadas)
  const processedVariants = useMemo(() => {
    const list = [...variants];
    // Filtro de busca interna rápida por cor, ano, sku, barcode ou nome
    const filtered = searchTerm.trim() === ''
      ? list
      : list.filter(v => {
          const q = searchTerm.toLowerCase();
          const label = getVariantLabel(v).toLowerCase();
          const sku = (v.sku || '').toLowerCase();
          const ean = (v.barcode || '').toLowerCase();
          const loc = (v.location || '').toLowerCase();
          return label.includes(q) || sku.includes(q) || ean.includes(q) || loc.includes(q);
        });

    // Ordenação: 1. Com estoque primeiro (v.stock > 0), 2. Sem estoque depois
    return filtered.sort((a, b) => {
      const aStock = (a.stock || 0) > 0 ? 1 : 0;
      const bStock = (b.stock || 0) > 0 ? 1 : 0;
      if (aStock !== bStock) return bStock - aStock; // 1 antes de 0
      return getVariantLabel(a).localeCompare(getVariantLabel(b));
    });
  }, [variants, searchTerm]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;
  const effectivePrice = selectedVariant ? getEffectivePrice(selectedVariant) : 0;
  const totalPrice = effectivePrice * quantity;
  const isSelectedOutOfStock = !selectedVariant || (selectedVariant.stock || 0) <= 0;

  const handleConfirm = () => {
    if (!selectedVariant) {
      alert('Selecione uma variação antes de adicionar.');
      return;
    }
    if ((selectedVariant.stock || 0) <= 0) {
      alert('Esta variação está sem estoque e não pode ser vendida.');
      return;
    }
    if (quantity <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    const varDesc = getVariantLabel(selectedVariant);
    const fullDesc = `${product.description} (${varDesc})`;
    const unit = product.unit || 'UN';

    onSelectVariant({
      variant: selectedVariant,
      quantity,
      price: effectivePrice,
      total: totalPrice,
      fullDescription: fullDesc,
      variantDescription: varDesc,
      sku: selectedVariant.sku || product.sku || '',
      barcode: selectedVariant.barcode || product.barcode || '',
      unit
    });

    onClose();
  };

  // Imagem principal para exibir (da variação ou do produto pai)
  const displayImage = selectedVariant?.image_url || product.image_url || '';

  // Total do estoque somado de todas as variações
  const totalStockAll = variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  const unitLabel = product.unit ? product.unit.toUpperCase() : 'UN';

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-[#0B111E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.description}
                className="w-12 h-12 object-cover rounded-xl border border-slate-700 bg-slate-900 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Tag size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white tracking-wider">
                  {titleContext}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  SKU: <strong className="text-slate-200">{product.sku || 'N/A'}</strong>
                </span>
                {product.brand && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    | {product.brand}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                {product.description}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers size={13} className="text-slate-500" />
                  <strong className="text-slate-200">{variants.length}</strong> variações cadastradas
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Package size={13} className="text-slate-500" />
                  Estoque total: <strong className="text-emerald-400">{totalStockAll} {unitLabel}</strong>
                </span>
                {product.application && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[200px] text-slate-400 text-[11px]">
                      Aplicação: {product.application}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* BARRA DE PESQUISA RÁPIDA DE VARIAÇÃO */}
        <div className="px-4 py-2.5 bg-[#0D1526] border-b border-slate-800/80 flex items-center gap-2">
          <Search size={16} className="text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar variação por cor, ano, SKU, código de barras..."
            className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Limpar
            </button>
          )}
        </div>

        {/* CORPO DO SELETOR */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 max-h-[52vh]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Escolha a peça desejada:</span>
            <span className="text-slate-500 font-normal">
              Modalidade: <strong className="text-rose-400 uppercase">{chargeType === 'credito_30_dias' ? 'Crédito 30 Dias' : chargeType === 'atacado' ? 'Atacado' : chargeType === 'fiado' ? 'Fiado' : 'À Vista'}</strong>
            </span>
          </div>

          {processedVariants.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
              Nenhuma variação encontrada com o termo pesquisado.
            </div>
          ) : (
            processedVariants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const price = getEffectivePrice(v);
              const isOutOfStock = (v.stock || 0) <= 0;
              const isInactive = v.status === 'Inativo';
              const isBlocked = isOutOfStock || isInactive;
              const label = getVariantLabel(v);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (!isBlocked) {
                      setSelectedVariantId(v.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                      : isBlocked
                      ? 'bg-rose-950/10 border-rose-900/30 opacity-70 cursor-not-allowed'
                      : 'bg-[#0E1726]/80 border-slate-800 hover:border-slate-700 hover:bg-[#121D30] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Botão de Rádio / Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-600 text-white'
                          : isBlocked
                          ? 'border-rose-900/60 bg-rose-950/40 text-rose-500'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                      {isBlocked && !isSelected && <X size={10} strokeWidth={2.5} />}
                    </div>

                    {/* Foto da variação (se houver) */}
                    {v.image_url && (
                      <img
                        src={v.image_url}
                        alt={label}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-slate-900 shrink-0"
                      />
                    )}

                    {/* Descrição e Detalhes da Variação */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className={`text-sm font-bold ${isBlocked ? 'text-slate-400' : 'text-white'}`}>
                          {label}
                        </strong>
                        {v.sku && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">
                            SKU: {v.sku}
                          </span>
                        )}
                        {v.barcode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">
                            EAN: {v.barcode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          Estoque:{' '}
                          {isOutOfStock ? (
                            <strong className="text-rose-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle size={12} /> Sem estoque
                            </strong>
                          ) : (
                            <strong className="font-mono text-emerald-400 font-bold">
                              {v.stock} {unitLabel}
                            </strong>
                          )}
                        </span>
                        {v.location && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin size={11} className="text-slate-500" /> {v.location}
                          </span>
                        )}
                        {isInactive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/60 font-bold">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preço e Status de Seleção */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-rose-400 font-mono">
                      {formatBRL(price)}
                    </div>
                    {isBlocked ? (
                      <span className="text-[10px] font-bold text-rose-500 block mt-0.5 uppercase tracking-wider">
                        Indisponível
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ: QUANTIDADE, VALOR TOTAL E BOTÃO ADICIONAR */}
        <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Seletor de Quantidade */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Quantidade:</span>
              <div className="flex items-center bg-[#0B111E] border border-slate-700 rounded-xl overflow-hidden p-0.5">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-40 rounded-lg font-bold text-sm transition-all"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant?.stock || 999}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const maxStock = selectedVariant?.stock || 999;
                    setQuantity(Math.min(Math.max(1, val), maxStock > 0 ? maxStock : 999));
                  }}
                  className="w-12 text-center bg-transparent text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!selectedVariant || quantity >= (selectedVariant.stock || 1)}
                  onClick={() => {
                    const maxStock = selectedVariant?.stock || 999;
                    setQuantity(prev => (prev < maxStock ? prev + 1 : prev));
                  }}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-40 rounded-lg font-bold text-sm transition-all"
                >
                  +
                </button>
              </div>
              <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
            </div>

            {/* Valor Total Calculado */}
            <div className="text-right sm:text-left sm:ml-4 border-l border-slate-800 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Valor total</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatBRL(totalPrice)}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedVariant || isSelectedOutOfStock}
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
            >
              <ShoppingCart size={16} /> Adicionar à {titleContext.includes('OS') || titleContext.includes('Ordem') ? 'O.S.' : 'venda'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductVariantSelectorModal;

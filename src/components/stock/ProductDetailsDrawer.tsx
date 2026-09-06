import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Pencil, 
  Copy, 
  Check, 
  MapPin, 
  Package, 
  DollarSign, 
  Info, 
  Image as ImageIcon, 
  Tag, 
  Boxes,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product } from './types';

interface ProductDetailsDrawerProps {
  product: Product | null;
  onClose: () => void;
  onEditProduct: (product: Product) => void;
  onCloneProduct: (product: Product) => void;
  onPrintLabel: (product: Product) => void;
  formatBRL: (val: number) => string;
}

type TabType = 'general' | 'stock' | 'prices' | 'application' | 'images';

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  product,
  onClose,
  onEditProduct,
  onCloneProduct,
  onPrintLabel,
  formatBRL
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image_url || '');
      setActiveTab('general');
    }
  }, [product]);

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  // Lista de imagens preenchidas
  const galleryImages = [
    product.image_url,
    product.image_url2,
    product.image_url3,
    product.image_url4
  ].filter((img): img is string => Boolean(img && img.trim()));

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const stockVal = Number(product.stock) || 0;
  const costVal = Number(product.purchase_price) || 0;
  const saleVal = Number(product.sale_price) || 0;
  const creditVal = Number(product.sale_price_credit) || 0;
  const wholesaleVal = Number(product.sale_price_wholesale) || 0;

  // Cálculos de Margem em Memória (Puramente Visual)
  const hasValidProfitCalc = costVal > 0 && saleVal > costVal;
  const estimatedUnitProfit = hasValidProfitCalc ? saleVal - costVal : 0;
  const estimatedMarginPercent = hasValidProfitCalc ? ((saleVal - costVal) / saleVal) * 100 : 0;
  const estimatedMarkupPercent = hasValidProfitCalc ? ((saleVal - costVal) / costVal) * 100 : 0;

  // Badges visuais de estoque
  let stockBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  let stockStatus = 'Estoque Normal';
  if (stockVal <= 0) {
    stockBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    stockStatus = 'Sem Estoque (Zerado)';
  } else if (stockVal <= 2) {
    stockBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    stockStatus = 'Estoque Baixo';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Container Principal da Ficha Horizontal: 85% a 90% da largura */}
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-[92vw] 2xl:max-w-[1550px] max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Topo da Ficha: Cabeçalho com Nome, Códigos e Ações ── */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-black uppercase tracking-wider">
                ID #{product.id}
              </span>
              {product.brand && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 rounded text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-900">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold">
                  {product.category}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">
              {product.description}
            </h2>
          </div>

          {/* Botões de Ação no Topo da Ficha */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPrintLabel(product)}
              className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs"
              title="Imprimir etiqueta térmica"
            >
              <Printer size={15} />
              <span>Etiqueta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCloneProduct(product);
                onClose();
              }}
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs"
              title="Clonar este produto"
            >
              <Copy size={15} />
              <span>Duplicar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEditProduct(product);
                onClose();
              }}
              className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs"
              title="Abrir tela de edição completa"
            >
              <Pencil size={15} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1"
              title="Fechar (ESC)"
            >
              <X size={18} />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          </div>
        </div>

        {/* ── Corpo Dividido Horizontalmente: Galeria (Esquerda) + Abas Informativas (Direita) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── LADO ESQUERDO: GALERIA DE FOTOS (4 colunas no desktop) ── */}
          <div className="lg:col-span-4 2xl:col-span-3 flex flex-col gap-3">
            {/* Foto Grande em Destaque (object-contain absoluto) */}
            <div className="h-72 sm:h-80 w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-3 relative group">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.description}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
                  <ImageIcon size={56} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Sem Foto Cadastrada</span>
                </div>
              )}

              {/* Tag com contagem de fotos */}
              {galleryImages.length > 0 && (
                <span className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold">
                  {galleryImages.length} foto{galleryImages.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Miniaturas das Fotos Existentes (Apenas preenchidas!) */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`h-16 rounded-xl border overflow-hidden p-1 bg-slate-50 dark:bg-slate-800 transition-all ${
                      selectedImage === imgUrl 
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xs scale-102' 
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Cartão Rápido de Balcão (Localização + Estoque Imediato) */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-amber-600" />
                Localização no Estoque
              </div>
              <div className="text-base font-black text-amber-950 dark:text-amber-200">
                {product.location || 'NENHUMA LOCALIZAÇÃO REGISTRADA'}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${stockBadgeColor}`}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Boxes size={13} />
                Disponibilidade
              </div>
              <div className="text-base font-black">
                {stockVal} {product.unit || 'UN'} ({stockStatus})
              </div>
            </div>
          </div>

          {/* ── LADO DIREITO: ABAS INFORMATIVAS COMPLETAS (8 colunas no desktop) ── */}
          <div className="lg:col-span-8 2xl:col-span-9 flex flex-col min-w-0">
            
            {/* Navegação de Abas */}
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'general'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Info size={14} />
                Geral (Todos os Campos)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'stock'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Boxes size={14} />
                Estoque & Localização
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prices')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'prices'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <DollarSign size={14} />
                Preços & Margens
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('application')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'application'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Tag size={14} />
                Aplicação Completa
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'images'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ImageIcon size={14} />
                Galeria ({galleryImages.length})
              </button>
            </div>

            {/* ── CONTEÚDO DA ABA SELECIONADA ── */}
            <div className="flex-1 overflow-y-auto">
              
              {/* ── ABA 1: GERAL (Mostra TODOS os 20 campos sem esconder nada) ── */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Bloco de Códigos com Botões de Cópia */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* SKU */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">SKU do Produto</div>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span className="text-sm">{product.sku || '-'}</span>
                        {product.sku && (
                          <button
                            type="button"
                            onClick={() => handleCopy(product.sku, 'sku')}
                            className="px-2 py-0.5 text-[10px] font-sans font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center gap-1 transition-colors"
                          >
                            {copiedField === 'sku' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedField === 'sku' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EAN / Código de Barras */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">EAN / Código de Barras</div>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span className="text-sm">{product.barcode || '-'}</span>
                        {product.barcode && (
                          <button
                            type="button"
                            onClick={() => handleCopy(product.barcode, 'barcode')}
                            className="px-2 py-0.5 text-[10px] font-sans font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center gap-1 transition-colors"
                          >
                            {copiedField === 'barcode' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedField === 'barcode' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ALT_CODE / Referência Fabricante */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Ref. Fabricante (ALT_CODE)</div>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span className="text-sm text-rose-600 dark:text-rose-400">{product.alt_code || '-'}</span>
                        {product.alt_code && (
                          <button
                            type="button"
                            onClick={() => handleCopy(product.alt_code || '', 'alt_code')}
                            className="px-2 py-0.5 text-[10px] font-sans font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center gap-1 transition-colors"
                          >
                            {copiedField === 'alt_code' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedField === 'alt_code' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid de Dados Cadastrais Detalhados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase text-slate-400">Marca</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 uppercase">
                        {product.brand || 'Não informada'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase text-slate-400">Categoria</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {product.category || 'Não categorizado'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase text-slate-400">Unidade de Medida</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {product.unit || 'Unitário'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase text-slate-400">Fornecedor / Distribuidor</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {product.distributor || 'Não vinculado'}
                      </div>
                    </div>
                  </div>

                  {/* Resumo da Aplicação */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Aplicação Resumida (Motos Compatíveis)
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {product.application || <span className="italic text-slate-400">Nenhuma aplicação cadastrada para este item.</span>}
                    </div>
                  </div>

                  {/* Resumo de Preços */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-black uppercase text-slate-400">Custo (Compra)</div>
                      <div className="text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
                        {formatBRL(costVal)}
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">À Vista</div>
                      <div className="text-sm font-black text-rose-700 dark:text-rose-300 mt-1">
                        {formatBRL(saleVal)}
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900">
                      <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">30 Dias (Crédito)</div>
                      <div className="text-sm font-black text-purple-700 dark:text-purple-300 mt-1">
                        {creditVal > 0 ? formatBRL(creditVal) : '-'}
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Atacado</div>
                      <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-1">
                        {wholesaleVal > 0 ? formatBRL(wholesaleVal) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA 2: ESTOQUE & LOCALIZAÇÃO ── */}
              {activeTab === 'stock' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Painel do Estoque Atual */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                          Estoque Físico Atual
                        </div>
                        <div className="text-4xl font-black text-slate-900 dark:text-slate-100 my-2">
                          {stockVal} <span className="text-base font-bold text-slate-500">{product.unit || 'UN'}</span>
                        </div>
                      </div>
                      
                      <div className={`mt-4 p-3 rounded-xl border ${stockBadgeColor}`}>
                        <div className="text-xs font-black uppercase tracking-wider">Status: {stockStatus}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          {stockVal > 2 ? 'Estoque acima do nível mínimo de reposição.' : stockVal > 0 ? 'Nível baixo de reposição recomendada.' : 'Item sem disponibilidade para venda imediata.'}
                        </div>
                      </div>
                    </div>

                    {/* Painel da Localização no Estoque */}
                    <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                          <MapPin size={15} />
                          Endereçamento no Estoque
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-200 my-2">
                          {product.location || 'Sem Endereço Cadastrado'}
                        </div>
                      </div>

                      <div className="text-xs text-amber-800 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 p-3 rounded-xl mt-4">
                        💡 A localização física permite aos operadores de balcão e oficina encontrar a peça instantaneamente nas prateleiras ou gavetas.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA 3: PREÇOS & MARGENS ── */}
              {activeTab === 'prices' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Preço de Compra (Custo)</div>
                      <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-2">{formatBRL(costVal)}</div>
                    </div>

                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900">
                      <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Preço À Vista</div>
                      <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">{formatBRL(saleVal)}</div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900">
                      <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Preço 30 Dias (Crédito)</div>
                      <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-2">
                        {creditVal > 0 ? formatBRL(creditVal) : <span className="text-slate-400 text-sm font-bold">Não cadastrado</span>}
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Preço Atacado</div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                        {wholesaleVal > 0 ? formatBRL(wholesaleVal) : <span className="text-slate-400 text-sm font-bold">Não cadastrado</span>}
                      </div>
                    </div>
                  </div>

                  {/* Cálculo Visual de Margem em Memória */}
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-300">
                        Indicadores de Rentabilidade Estimada (Cálculo Visual em Memória)
                      </h4>
                    </div>

                    {hasValidProfitCalc ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Lucro Unitário Estimado</div>
                          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatBRL(estimatedUnitProfit)}
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Margem de Lucro (% Venda)</div>
                          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            {estimatedMarginPercent.toFixed(1)}%
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Markup Estimado (% Custo)</div>
                          <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                            {estimatedMarkupPercent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-indigo-800 dark:text-indigo-300">
                        Para calcular a margem estimada, é necessário que tanto o Preço de Custo quanto o Preço de Venda estejam cadastrados com valores positivos.
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-2">
                      * Este cálculo é exclusivamente demonstrativo para apoio na venda e não altera nenhum valor do banco de dados.
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA 4: APLICAÇÃO COMPLETA (Sem corte ou truncamento) ── */}
              {activeTab === 'application' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Layers size={15} className="text-rose-600" />
                        Tabela de Aplicações e Compatibilidade Completa
                      </div>
                      {product.application && (
                        <button
                          type="button"
                          onClick={() => handleCopy(product.application || '', 'app_full')}
                          className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-rose-600 flex items-center gap-1 transition-colors"
                        >
                          {copiedField === 'app_full' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          <span>{copiedField === 'app_full' ? 'Copiado' : 'Copiar Aplicação'}</span>
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-sans text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                      {product.application || 'Nenhuma aplicação detalhada cadastrada para esta peça.'}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA 5: GALERIA COMPLETA DE IMAGENS ── */}
              {activeTab === 'images' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Fotos cadastradas para este produto ({galleryImages.length} de 4):
                  </div>

                  {galleryImages.length === 0 ? (
                    <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-bold">
                      Nenhuma imagem cadastrada para este produto.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {galleryImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                        >
                          <div className="h-44 flex items-center justify-center p-3 bg-white dark:bg-slate-900">
                            <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" />
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <span>Foto {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedImage(imgUrl)}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              Visualizar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

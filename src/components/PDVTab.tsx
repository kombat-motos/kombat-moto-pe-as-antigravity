import React, { useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  History,
  Tag,
  Package,
  PlusCircle,
  User,
  Wrench,
  CreditCard,
  Percent,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço' | 'Serviço Principal' | 'Adicional Interno';
}

export interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
  stock: number;
  unit: string;
  category?: string;
  brand?: string;
  location?: string;
  image_url?: string;
  image_url2?: string;
  image_url3?: string;
  image_url4?: string;
  application?: string;
  distributor?: string;
  alt_code?: string;
}

export interface Customer {
  id: number;
  name: string;
  nickname?: string;
  cpf: string;
  cnpj?: string;
  whatsapp: string;
  address: string;
  neighborhood?: string;
  city?: string;
  credit_limit?: number;
}

export interface Mechanic {
  id: string;
  name: string;
  commission_rate: number;
  active: boolean;
}

export interface Sale {
  id: string;
  customer_id?: number;
  customer_name: string;
  items: SaleItem[];
  sale_items?: SaleItem[];
  labor_value: number;
  mechanic_id?: string;
  mechanic_name?: string;
  commission: number;
  total: number;
  payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
  type: 'Balcão' | 'Oficina';
  date: string;
  payment_status: 'Pago' | 'Pendente';
  due_date?: string;
  paid_date?: string;
  charge_type?: 'vista' | 'credito_30_dias' | 'atacado';
}

export interface PDVTabProps {
  pdvState: {
    form: {
      customer_id: string;
      mechanic_id: string;
      items: SaleItem[];
      payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
      due_date: string;
      sale_condition: 'Vista' | 'Prazo';
      installments: number;
      discount: number;
      charge_type?: 'vista' | 'credito_30_dias' | 'atacado';
    };
    searchProduct: string;
    selectedCategory: string;
  };
  pdvActions: {
    onAddProduct: (product: Product) => void;
    onRemoveItem: (productId?: number) => void;
    onQuantityChange: (index: number, newQuantity: number) => void;
    onPriceChange: (index: number, newPrice: number) => void;
    onChangeChargeType: (type: 'vista' | 'credito_30_dias' | 'atacado') => void;
    onSearchChange: (val: string) => void;
    onSelectCategory: (category: string) => void;
    onOpenHistory: () => void;
    onOpenCheckout: () => void;
    onDiscountChange: (discount: number) => void;
    onCustomerChange: (customerId: string) => void;
    onMechanicChange: (mechanicId: string) => void;
    onAddCustomItem: (description: string) => void;
  };
  data: {
    products: Product[];
    sortedProducts: Product[];
    customers: Customer[];
    sortedCustomers: Customer[];
    mechanics: Mechanic[];
    todaySales: Sale[];
    totalToday: number;
    currentUser?: any;
  };
  helpers: {
    formatBRL: (val: any) => string;
    getCustomerRemainingCredit: (customerId: number) => number;
  };
}

export const PDVTab: React.FC<PDVTabProps> = ({
  pdvState,
  pdvActions,
  data,
  helpers,
}) => {
  const { form, searchProduct, selectedCategory } = pdvState;
  const {
    onAddProduct,
    onRemoveItem,
    onQuantityChange,
    onPriceChange,
    onChangeChargeType,
    onSearchChange,
    onSelectCategory,
    onOpenHistory,
    onOpenCheckout,
    onDiscountChange,
    onCustomerChange,
    onMechanicChange,
    onAddCustomItem,
  } = pdvActions;
  const {
    sortedProducts,
    sortedCustomers,
    mechanics,
    todaySales,
    totalToday,
    currentUser,
  } = data;
  const { formatBRL, getCustomerRemainingCredit } = helpers;

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Foco automático na busca ao abrir o PDV
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Lista de categorias únicas dos produtos
  const categories = useMemo(() => {
    const list = new Set(data.products.map(p => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(list)];
  }, [data.products]);

  // Filtragem dos produtos por pesquisa e categoria
  const filteredProducts = useMemo(() => {
    const query = (searchProduct || '').trim().toLowerCase();
    return sortedProducts.filter(p => {
      const matchesSearch =
        !query ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.brand || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.barcode || '').toLowerCase().includes(query) ||
        (p.alt_code || '').toLowerCase().includes(query);

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sortedProducts, searchProduct, selectedCategory]);

  // Subtotal e Total Geral
  const cartTotal = useMemo(() => {
    return form.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [form.items]);

  const cartGrandTotal = useMemo(() => {
    return Math.max(0, cartTotal - (form.discount || 0));
  }, [cartTotal, form.discount]);

  // Tabela ativa selecionada
  const activeChargeType = form.charge_type || 'vista';

  // Preço a exibir conforme a tabela ativa
  const getDisplayPrice = (product: Product): number => {
    if (activeChargeType === 'credito_30_dias') {
      return product.sale_price_credit && product.sale_price_credit > 0
        ? product.sale_price_credit
        : product.sale_price;
    }
    if (activeChargeType === 'atacado') {
      return product.sale_price_wholesale && product.sale_price_wholesale > 0
        ? product.sale_price_wholesale
        : product.sale_price;
    }
    return product.sale_price;
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO COMPACTO E ERGONÔMICO DO BALCÃO */}
      {/* ========================================================================= */}
      <header className="h-14 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-rose-600/15 border border-rose-500/30 text-rose-500 rounded-xl flex items-center justify-center shadow-inner">
            <ShoppingCart size={18} className="text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-100">
                Kombat Moto Peças
              </h1>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
                Frente de Caixa
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
              {currentUser?.name ? ` • Operador: ${currentUser.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Resumo de Vendas de Hoje */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Hoje:</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {formatBRL(totalToday)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              ({todaySales.length} {todaySales.length === 1 ? 'venda' : 'vendas'})
            </span>
          </div>

          {/* Botão Histórico de Hoje */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-9 px-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <History size={14} className="text-slate-400" />
            <span className="hidden md:inline">Histórico de Hoje</span>
          </button>

          {/* Atalhos do Teclado */}
          <div className="hidden lg:flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-rose-400 px-1.5 py-0.5 rounded border border-slate-700 font-bold">F2</kbd> Pagar
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold">F4</kbd> Desconto
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold">ESC</kbd> Cancelar
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CORPO DO BALCÃO: DIVISÃO 62% ESQUERDA / 38% DIREITA */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ======================================================================= */}
        {/* ÁREA ESQUERDA (~62%): BUSCA, PREÇOS, CATEGORIAS E CATÁLOGO */}
        {/* ======================================================================= */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col border-r border-slate-800/80 overflow-hidden bg-slate-950/40 p-4 space-y-3.5">
          {/* Linha Superior: Busca Principal + Seletor de Tabela de Preço */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
            {/* Barra de Pesquisa (Elemento Principal) */}
            <div className="md:col-span-7 xl:col-span-8 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar produto, código, SKU, marca ou código de barras..."
                value={searchProduct}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-xs sm:text-sm text-slate-100 font-bold placeholder-slate-500 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500">
                <Barcode size={18} title="Compatível com Leitor de Código de Barras" />
              </div>
            </div>

            {/* Seletor Segmentado da Tabela de Preços */}
            <div className="md:col-span-5 xl:col-span-4 flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => onChangeChargeType('vista')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] xl:text-[11px] font-black uppercase tracking-wider transition-all text-center cursor-pointer ${
                  activeChargeType === 'vista'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                À Vista
              </button>
              <button
                type="button"
                onClick={() => onChangeChargeType('credito_30_dias')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] xl:text-[11px] font-black uppercase tracking-wider transition-all text-center cursor-pointer ${
                  activeChargeType === 'credito_30_dias'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => onChangeChargeType('atacado')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] xl:text-[11px] font-black uppercase tracking-wider transition-all text-center cursor-pointer ${
                  activeChargeType === 'atacado'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Atacado
              </button>
            </div>
          </div>

          {/* Categorias Horizontais */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
            {categories.filter(c => c !== 'all').map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grade de Produtos Compacta */}
          <div className="flex-1 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredProducts.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <Package size={42} className="text-slate-700 mb-2 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-300">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Verifique o termo digitado ou altere o filtro da categoria.
                </p>
                {searchProduct && (
                  <button
                    type="button"
                    onClick={() => onAddCustomItem(searchProduct.toUpperCase())}
                    className="mt-4 px-4 py-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-rose-500/30 shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={15} /> Adicionar "{searchProduct}" como item avulso
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 pb-2">
                {filteredProducts.map(product => {
                  const displayPrice = getDisplayPrice(product);
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 2;

                  return (
                    <div
                      key={product.id}
                      onClick={() => onAddProduct(product)}
                      className={`group relative flex flex-col bg-slate-900 border rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.015] active:scale-[0.985] ${
                        isOutOfStock
                          ? 'border-slate-800/80 hover:border-slate-750'
                          : 'border-slate-800 hover:border-rose-500/60 hover:shadow-md hover:shadow-rose-950/20'
                      }`}
                    >
                      {/* Área da Imagem / Ícone Compacto */}
                      <div className="h-28 w-full bg-slate-950 flex items-center justify-center relative overflow-hidden border-b border-slate-800/60">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-600 group-hover:text-rose-400/70 transition-colors">
                            <Package size={26} className="stroke-[1.5]" />
                          </div>
                        )}

                        {/* Marca */}
                        {product.brand && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[8px] font-black text-rose-400 uppercase rounded tracking-wider">
                            {product.brand}
                          </span>
                        )}

                        {/* Badge Visual de Estoque (Apenas indicação visual conforme regra) */}
                        <span
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded shadow-sm border ${
                            isOutOfStock
                              ? 'bg-red-950/90 border-red-800/80 text-red-400'
                              : isLowStock
                              ? 'bg-amber-950/90 border-amber-800/80 text-amber-400'
                              : 'bg-emerald-950/90 border-emerald-800/80 text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Sem Estoque' : `Estoque: ${product.stock}`}
                        </span>
                      </div>

                      {/* Informações do Produto */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h3 className="font-bold text-xs text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors" title={product.description}>
                            {product.description}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-500 font-mono">
                            <span>SKU: {product.sku || '---'}</span>
                            {product.barcode && <span>• {product.barcode}</span>}
                          </div>
                        </div>

                        {/* Preço e Botão Adicionar [+] */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] uppercase font-black text-slate-400 block leading-none mb-0.5">
                              {activeChargeType === 'credito_30_dias' ? '30 Dias' : activeChargeType === 'atacado' ? 'Atacado' : 'À Vista'}
                            </span>
                            <span className="text-sm font-black text-rose-500 font-mono">
                              {formatBRL(displayPrice)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddProduct(product);
                            }}
                            className="h-7 w-7 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-90 border border-slate-700 hover:border-rose-500 shadow-sm cursor-pointer"
                            title="Adicionar ao Carrinho"
                          >
                            <Plus size={14} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* ÁREA DIREITA (~38%): CLIENTE, MECÂNICO, ITENS E FINALIZAÇÃO */}
        {/* ======================================================================= */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col overflow-hidden bg-slate-950 border-l border-slate-800/80">
          {/* Cabeçalho do Carrinho: Cliente e Mecânico */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/50 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShoppingCart size={13} className="text-rose-500" />
                Itens da Venda
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {form.items.length} {form.items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Seletor de Cliente */}
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">
                  Cliente
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-2.5 pr-6 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 transition-all appearance-none cursor-pointer"
                    value={form.customer_id}
                    onChange={e => onCustomerChange(e.target.value)}
                  >
                    <option value="">Consumidor Final</option>
                    {sortedCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.nickname ? ` (${c.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                  <User size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Seletor de Mecânico / Vendedor */}
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">
                  Mecânico / Vendedor
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-2.5 pr-6 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 transition-all appearance-none cursor-pointer"
                    value={form.mechanic_id}
                    onChange={e => onMechanicChange(e.target.value)}
                  >
                    <option value="">Nenhum (Sem Comissão)</option>
                    {mechanics.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Wrench size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Aviso de Limite de Crédito se houver cliente selecionado */}
            {form.customer_id && (
              <div className="flex justify-between items-center text-[10px] bg-rose-950/25 border border-rose-900/40 px-2.5 py-1.5 rounded-lg text-rose-400 font-mono">
                <span className="font-bold uppercase tracking-wider font-sans">Crédito Disponível:</span>
                <span className="font-black text-xs">
                  {formatBRL(getCustomerRemainingCredit(parseInt(form.customer_id)))}
                </span>
              </div>
            )}
          </div>

          {/* Lista de Itens do Carrinho com Scroll Próprio */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {form.items.length === 0 ? (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                <ShoppingCart size={36} className="stroke-[1.2] mb-2 text-slate-700" />
                <p className="text-xs font-bold text-slate-400">Nenhum item na venda</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[220px]">
                  Pesquise ou selecione um produto no catálogo à esquerda para começar.
                </p>
              </div>
            ) : (
              form.items.map((item, idx) => {
                const itemTotal = item.price * item.quantity;
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-200 truncate" title={item.description}>
                        {item.description}
                      </h4>

                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Controles de Quantidade: [ - ] QTY [ + ] */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden h-6">
                          <button
                            type="button"
                            onClick={() => onQuantityChange(idx, Math.max(1, item.quantity - 1))}
                            className="px-1.5 h-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Diminuir"
                          >
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => onQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-7 h-full text-center text-xs font-mono font-bold bg-slate-950 outline-none border-x border-slate-800 text-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => onQuantityChange(idx, item.quantity + 1)}
                            className="px-1.5 h-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Aumentar"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">x</span>

                        {/* Campo de Preço Unitário Manual */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-1.5 h-6">
                          <span className="text-[9px] text-slate-500 mr-0.5 font-mono">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={e => onPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-14 bg-transparent outline-none text-xs font-mono font-bold text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Total do Item e Botão Excluir */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono text-xs font-black text-slate-100">
                        {formatBRL(itemTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product_id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                        title="Remover Item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ======================================================================= */}
          {/* RODAPÉ DO CARRINHO: SUBTOTAL, DESCONTO, TOTAL E RECEBER (F2) */}
          {/* ======================================================================= */}
          <div className="p-4 border-t border-slate-800/90 bg-slate-900/80 space-y-3 shrink-0 shadow-2xl">
            {/* Totais Detalhados */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-bold text-slate-200">{formatBRL(cartTotal)}</span>
              </div>

              {/* Campo de Desconto com Indicação do F4 */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-400">Desconto:</span>
                  <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">F4</span>
                </div>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
                  <span className="text-[10px] text-slate-500 mr-1 font-mono">R$</span>
                  <input
                    id="pdv-discount-input"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.discount || ''}
                    onChange={e => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 bg-transparent text-right outline-none text-xs font-mono font-black text-emerald-400 placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Total Geral em Destaque Máximo */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/80 mt-1">
                <span className="text-xs uppercase font-black tracking-wider text-slate-300">
                  Total Geral:
                </span>
                <span className="text-3xl font-black text-rose-500 font-mono tracking-tight">
                  {formatBRL(cartGrandTotal)}
                </span>
              </div>
            </div>

            {/* Botão de Ação Principal: RECEBER (F2) */}
            <button
              type="button"
              onClick={() => {
                if (form.items.length > 0) {
                  onOpenCheckout();
                } else {
                  alert('Adicione itens ao carrinho primeiro!');
                }
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-150 shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>RECEBER {formatBRL(cartGrandTotal)}</span>
              <span className="text-[11px] font-mono bg-rose-700/80 text-rose-100 px-2 py-0.5 rounded border border-rose-400/30">
                F2
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PDVTab;

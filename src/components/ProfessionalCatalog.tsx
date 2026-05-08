import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Smartphone, 
  MapPin, 
  User, 
  CreditCard, 
  DollarSign,
  Filter,
  ArrowRight,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  category?: string;
  brand?: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface ProfessionalCatalogProps {
  products: Product[];
  onClose: () => void;
}

const ProfessionalCatalog: React.FC<ProfessionalCatalogProps> = ({ products, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    paymentMethod: 'Pix'
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todas', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchesPrice = p.sale_price >= priceRange[0] && p.sale_price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, priceRange]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const sendToWhatsApp = () => {
    if (!customerData.name || !customerData.address) {
      alert('Por favor, preencha seu nome e endereço.');
      return;
    }

    const brandName = "Komat moto pecas";
    const whatsappNumber = "554335384537";

    let message = `*📦 NOVO PEDIDO - ${brandName.toUpperCase()}*\n\n`;
    message += `*Cliente:* ${customerData.name}\n`;
    message += `*Endereço:* ${customerData.address}\n`;
    message += `*Pagamento:* ${customerData.paymentMethod}\n\n`;
    message += `*--- ITENS DO PEDIDO ---*\n`;

    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.description} (${formatBRL(item.sale_price)})\n`;
    });

    message += `\n*TOTAL DO PEDIDO: ${formatBRL(cartTotal)}*\n\n`;
    message += `_Pedido enviado via Catálogo Digital_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const shareProduct = (product: Product) => {
    const message = `Olá! Gostei muito deste produto no catálogo da *Komat Moto Peças*:\n\n` +
      `*${product.description}*\n` +
      `💰 *Preço:* ${formatBRL(product.sale_price)}\n` +
      `📦 *SKU:* ${product.sku}\n\n` +
      `Você pode ver mais detalhes e comprar aqui: ${window.location.href}\n\n` +
      `Quero reservar este item!`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/554335384537?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] overflow-hidden flex flex-col font-sans">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white p-5 shadow-2xl flex items-center justify-between z-10">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">
            <Package className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none drop-shadow-md">Komat</h1>
            <p className="text-[11px] uppercase font-black tracking-[0.3em] opacity-90">Moto Peças</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Filters & Search - Premium Look */}
      <div className="bg-white border-b border-slate-200 p-6 space-y-5 shadow-sm relative z-0">
        <div className="relative group max-w-3xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="O que sua moto precisa hoje?"
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all text-slate-800 text-lg font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
            {categories.map((cat, idx) => (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                  selectedCategory === cat 
                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-red-100 hover:text-red-500'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
          
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest px-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Filter size={14} className="text-red-500" />
                <span>Faixa de Preço</span>
              </div>
              <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full">Até {formatBRL(priceRange[1])}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full accent-red-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Product Grid - Modern Cards */}
      <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto pb-32">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              key={product.id}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col group"
            >
              <div className="aspect-square bg-white relative overflow-hidden p-4 flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.description} 
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                    <ImageIcon size={64} strokeWidth={1} />
                  </div>
                )}
                
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-red-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-2xl shadow-sm border border-red-50">
                    {product.category || 'Peças'}
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); shareProduct(product); }}
                    className="bg-green-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
                    title="Enviar via WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between relative">
                <div>
                  <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug mb-2 group-hover:text-red-600 transition-colors">{product.description}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">SKU: {product.sku}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Preço</span>
                      <span className="text-slate-900 font-black text-2xl tracking-tighter">{formatBRL(product.sale_price)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => addToCart(product)}
                      className="py-4 bg-slate-900 hover:bg-red-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-red-200 active:scale-95"
                    >
                      <Plus size={14} />
                      Comprar
                    </button>
                    <button 
                      onClick={() => shareProduct(product)}
                      className="py-4 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <MessageCircle size={14} />
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <div className="bg-slate-100 p-8 rounded-[3rem] mb-6">
              <Search size={64} strokeWidth={1} />
            </div>
            <p className="font-black text-2xl text-slate-400 uppercase tracking-tighter">Nenhum resultado</p>
            <p className="text-slate-400 font-medium">Tente buscar por outro termo ou categoria</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, y: 50, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0, y: 50 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 bg-slate-900 text-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-4 z-50 group transition-all border border-white/10"
          >
            <div className="relative">
              <div className="bg-red-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <ShoppingCart size={24} />
              </div>
              <span className="absolute -top-3 -right-3 bg-white text-red-600 text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                {cartCount}
              </span>
            </div>
            <div className="pr-2 hidden sm:block text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Seu Carrinho</p>
              <p className="text-sm font-black text-white leading-none">{formatBRL(cartTotal)}</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal / Drawer - Premium Redesign */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-2xl">
                    <ShoppingCart size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Carrinho</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{cartCount} itens selecionados</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-2xl transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50">
                {cart.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="bg-white p-8 rounded-full shadow-inner mb-6">
                      <ShoppingCart size={48} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Seu carrinho está vazio</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-red-600 font-black uppercase text-xs hover:underline"
                    >
                      Voltar às compras
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="flex gap-5 p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.description} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <ImageIcon size={32} strokeWidth={1} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 text-base leading-tight pr-4">{item.description}</h4>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-red-600 font-black text-lg mt-1">{formatBRL(item.sale_price)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-red-600 shadow-sm transition-all"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-red-600 shadow-sm transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-10 bg-slate-900 text-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] mb-1">Total Estimado</span>
                    <span className="text-4xl font-black text-white tracking-tighter">{formatBRL(cartTotal)}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-red-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                      {cartCount} ITENS
                    </span>
                  </div>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-6 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-[2rem] font-black uppercase text-base tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-red-900/40 active:scale-95"
                >
                  Finalizar Pedido
                  <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal - Premium Redesign */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-10">
                <div className="text-center mb-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] mb-6 shadow-inner"
                  >
                    <Smartphone size={40} strokeWidth={1.5} />
                  </motion.div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Quase Pronto!</h2>
                  <p className="text-slate-400 font-medium text-sm">Só precisamos de mais alguns dados para enviar seu pedido pelo WhatsApp.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 px-1 transition-colors group-focus-within:text-red-500">
                      <User size={14} /> Nome Completo
                    </label>
                    <input 
                      type="text" 
                      placeholder="Seu nome"
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all font-bold text-slate-800 shadow-inner"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 px-1 transition-colors group-focus-within:text-red-500">
                      <MapPin size={14} /> Endereço de Entrega
                    </label>
                    <textarea 
                      placeholder="Rua, número, bairro e cidade"
                      rows={2}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all font-bold text-slate-800 shadow-inner resize-none"
                      value={customerData.address}
                      onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 px-1">
                      <CreditCard size={14} /> Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Pix', 'Crédito', 'Débito'].map(method => (
                        <button
                          key={method}
                          onClick={() => setCustomerData({...customerData, paymentMethod: method})}
                          className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            customerData.paymentMethod === method
                              ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-200 scale-105'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-red-100 hover:text-red-500'
                          }`}
                        >
                          {method === 'Pix' && <DollarSign size={14} className="inline mr-1 -mt-0.5" />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-4">
                  <button 
                    onClick={sendToWhatsApp}
                    className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(220,38,38,0.3)] active:scale-95"
                  >
                    Enviar Pedido via WhatsApp
                    <ArrowRight size={22} />
                  </button>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-slate-900 transition-all"
                  >
                    Voltar ao Carrinho
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalCatalog;

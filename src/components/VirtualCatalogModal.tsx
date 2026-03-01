import React, { useState } from 'react';
import { Send, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  image_url?: string;
  category?: string;
}

interface VirtualCatalogModalProps {
  products: Product[];
}

const VirtualCatalogModal: React.FC<VirtualCatalogModalProps> = ({ products }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const uniqueCategories = ['Todas', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort()];

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prevSelected =>
      prevSelected.some(p => p.id === product.id)
        ? prevSelected.filter(p => p.id !== product.id)
        : [...prevSelected, product]
    );
  };

  const generateWhatsAppMessage = () => {
    if (selectedProducts.length === 0) {
      alert('Selecione ao menos um produto para gerar o catálogo.');
      return;
    }

    let message = "*Kombat Moto Peças - Catálogo Virtual*\n\n";

    selectedProducts.forEach(product => {
      message += "*---*\n\n"; // Horizontal rule for WhatsApp
      message += `*📦 ${product.description}*\n`;
      if (product.category) {
        message += `*Categoria:* ${product.category}\n`;
      }
      message += `*Código:* ${product.sku}\n`;
      message += `*Preço:* R$ ${product.sale_price.toFixed(2)}\n`;
      if (product.image_url) {
        message += `*Foto:* ${product.image_url}\n`;
      }
      message += `\n[BOTÃO: 📥 INCLUIR NO PEDIDO]\n`;
      message += `(Link: https://wa.me/554335384537?text=Olá+Thiago,+quero+incluir+o+produto:+${encodeURIComponent(product.description)}+-+Código:+${encodeURIComponent(product.sku)})\n`;
    });

    message += "*---*\n\n_Valores sujeitos a alteração e disponibilidade de estoque._\n_Entre em contato para mais informações!_";

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = products.filter(p =>
    (selectedCategory === 'Todas' || p.category === selectedCategory) &&
    (p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full px-4 py-2 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <ImageIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <select
          className="w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className={`relative bg-white p-4 rounded-xl shadow-sm border transition-all ${selectedProducts.some(p => p.id === product.id) ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <button
              className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-sm"
              onClick={() => toggleProductSelection(product)}
            >
              {selectedProducts.some(p => p.id === product.id) ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <CheckCircle size={20} className="text-slate-300" />
              )}
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.description} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon size={32} className="text-slate-300" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800">{product.description}</p>
                <p className="text-sm text-slate-500">R$ {product.sale_price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">SKU: {product.sku}</p>
              </div>
            </div>
            {product.category && <p className="text-xs text-slate-500">Categoria: {product.category}</p>}
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <p className="col-span-full text-center text-slate-400 py-8">Nenhum produto encontrado.</p>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={generateWhatsAppMessage}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
        >
          <Send size={18} /> Gerar Catálogo WhatsApp ({selectedProducts.length})
        </button>
      </div>
    </div>
  );
};

export default VirtualCatalogModal;

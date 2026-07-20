import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, MessageCircle, Printer, ShoppingCart, 
  Wrench, Trash2, Edit2, X, PlusCircle, MinusCircle 
} from 'lucide-react';

interface Product {
  id: number;
  description: string;
  sale_price: number;
  stock: number;
}

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
}

interface Quote {
  id: number;
  cliente_id?: number;
  customer_name: string;
  whatsapp: string;
  motorcycle_details?: string;
  motorcycle_year?: string;
  service_description?: string;
  labor_value: number;
  discount: number;
  total_value: number;
  payment_method?: string;
  observacoes?: string;
  status: 'Pendente' | 'Enviado' | 'Aprovado' | 'Recusado' | 'Finalizado';
  items?: QuoteItem[];
  created_at: string;
}

interface CRMOrcamentosProps {
  orcamentos: Quote[];
  products: Product[];
  formatBRL: (v: number) => string;
  onAddQuote: (quote: Omit<Quote, 'id' | 'created_at'>) => Promise<void>;
  onUpdateQuote: (id: number, quote: Partial<Quote>) => Promise<void>;
  onDeleteQuote: (id: number) => Promise<void>;
  onSendWhatsApp: (phone: string, text: string) => void;
  onConvertToSale: (quote: Quote) => void;
  onConvertToOS: (quote: Quote) => void;
}

export default function CRMOrcamentos({
  orcamentos,
  products,
  formatBRL,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onSendWhatsApp,
  onConvertToSale,
  onConvertToOS
}: CRMOrcamentosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [motoDetails, setMotoDetails] = useState('');
  const [motoYear, setMotoYear] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [laborValue, setLaborValue] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<Quote['status']>('Pendente');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Product Search State inside Modal
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (productSearch.trim()) {
      const term = productSearch.toLowerCase();
      setFilteredProducts(
        products.filter(p => p.description.toLowerCase().includes(term)).slice(0, 5)
      );
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  const handleOpenAddModal = () => {
    setEditingQuote(null);
    setCustomerName('');
    setWhatsapp('');
    setMotoDetails('');
    setMotoYear('');
    setServiceDesc('');
    setLaborValue(0);
    setDiscount(0);
    setPaymentMethod('Pix');
    setObservations('');
    setStatus('Pendente');
    setQuoteItems([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: Quote) => {
    setEditingQuote(q);
    setCustomerName(q.customer_name);
    setWhatsapp(q.whatsapp || '');
    setMotoDetails(q.motorcycle_details || '');
    setMotoYear(q.motorcycle_year || '');
    setServiceDesc(q.service_description || '');
    setLaborValue(q.labor_value || 0);
    setDiscount(q.discount || 0);
    setPaymentMethod(q.payment_method || 'Pix');
    setObservations(q.observacoes || '');
    setStatus(q.status);
    setQuoteItems(q.items || []);
    setIsModalOpen(true);
  };

  const handleAddProductItem = (p: Product) => {
    const existing = quoteItems.find(item => item.description === p.description);
    if (existing) {
      setQuoteItems(quoteItems.map(item => 
        item.description === p.description ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setQuoteItems([...quoteItems, { description: p.description, price: p.sale_price, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const handleRemoveProductItem = (idx: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== idx));
  };

  const handleUpdatePrice = (idx: number, newPrice: number) => {
    setQuoteItems(quoteItems.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setQuoteItems(quoteItems.map((item, i) => {
      if (i === idx) {
        const nq = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nq };
      }
      return item;
    }));
  };

  // Compute Total
  const partsTotal = quoteItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const totalValue = Math.max(0, partsTotal + laborValue - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !whatsapp) return alert('Por favor, informe o cliente e whatsapp.');

    const payload = {
      customer_name: customerName,
      whatsapp,
      motorcycle_details: motoDetails,
      motorcycle_year: motoYear,
      service_description: serviceDesc,
      labor_value: laborValue,
      discount,
      total_value: totalValue,
      payment_method: paymentMethod,
      observacoes: observations,
      status,
      items: quoteItems
    };

    if (editingQuote) {
      await onUpdateQuote(editingQuote.id, payload);
    } else {
      await onAddQuote(payload);
    }
    setIsModalOpen(false);
  };

  // Generate WhatsApp Formatted message
  const handleShareWhatsApp = (q: Quote) => {
    const itemsTotal = (q.items || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const msg = `Olá, ${q.customer_name}! Tudo certo?\nSegue seu orçamento da Kombat Moto Peças:\n\nMoto: ${q.motorcycle_details || 'Não informada'} ${q.motorcycle_year ? `(${q.motorcycle_year})` : ''}\nPeça/Serviço: ${q.service_description || 'Itens relacionados'}\nValor das peças: R$ ${itemsTotal.toFixed(2)}\nMão de obra: R$ ${(q.labor_value || 0).toFixed(2)}\nTotal: R$ ${q.total_value.toFixed(2)}\n\nForma de pagamento: Pix, dinheiro ou cartão.\nCartão em até 3x sem juros. Até 12x com acréscimo.\n\nKombat Moto Peças\nRua Paraná, 342, Centro, Andirá – PR\nWhatsApp: 43 3538-4537`;
    
    onSendWhatsApp(q.whatsapp, msg);
    // Move status to "Enviado" automatically
    onUpdateQuote(q.id, { status: 'Enviado' });
  };

  const handlePrintQuote = (q: Quote) => {
    const itemsTotal = (q.items || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = (q.items || []).map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatBRL(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatBRL(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const content = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b91c1c; padding-bottom: 15px;">
          <div>
            <h1 style="color: #b91c1c; margin: 0; font-size: 28px;">KOMBAT MOTO PEÇAS</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Peças, Acessórios e Oficina de Motocicletas</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #666;">
            <p style="margin: 0;">Rua Paraná, 342, Centro, Andirá - PR</p>
            <p style="margin: 4px 0 0 0;">WhatsApp: (43) 3538-4537</p>
          </div>
        </div>

        <div style="margin: 25px 0; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">Orçamento Profissional #${q.id}</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">Data: ${new Date(q.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 25px; font-size: 13px; line-height: 1.5;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>Cliente:</strong> ${q.customer_name}</div>
            <div><strong>Telefone/WhatsApp:</strong> ${q.whatsapp}</div>
            <div><strong>Moto:</strong> ${q.motorcycle_details || 'Não cadastrada'} ${q.motorcycle_year ? `(${q.motorcycle_year})` : ''}</div>
            <div><strong>Condição de Pagamento:</strong> ${q.payment_method || 'A combinar'}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f1f1f1; text-align: left; font-weight: bold;">
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">#</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Descrição do Item</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Qtd</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">V. Unitário</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">V. Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; font-size: 13px; line-height: 1.8; margin-top: 15px;">
          <div style="width: 300px; text-align: right;">
            <div>Peças: <strong>${formatBRL(itemsTotal)}</strong></div>
            <div>Mão de Obra: <strong>${formatBRL(q.labor_value || 0)}</strong></div>
            ${q.discount > 0 ? `<div style="color: #b91c1c;">Desconto: <strong>-${formatBRL(q.discount)}</strong></div>` : ''}
            <div style="border-top: 2px solid #333; margin-top: 5px; padding-top: 5px; font-size: 16px; font-weight: bold;">
              Total Geral: <span style="color: #b91c1c;">${formatBRL(q.total_value)}</span>
            </div>
          </div>
        </div>

        ${q.observacoes ? `
          <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
            <strong>Observações:</strong> ${q.observacoes}
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
          Agradecemos a preferência! Kombat Moto Peças - Acelere com segurança.
        </div>
      </div>
    `;

    printWindow.document.write(`<html><head><title>Orçamento #${q.id}</title></head><body onload="window.print();window.close();">${content}</body></html>`);
    printWindow.document.close();
  };

  const filteredQuotes = orcamentos.filter(o => {
    const term = searchQuery.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(term) ||
      o.whatsapp.includes(term) ||
      (o.motorcycle_details || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, whatsapp ou moto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none"
        >
          <Plus size={16} />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.map(q => {
          const pTotal = (q.items || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

          return (
            <div 
              key={q.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    q.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' :
                    q.status === 'Recusado' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30' :
                    q.status === 'Finalizado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/30'
                  }`}>
                    {q.status}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase mt-2">{q.customer_name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{q.whatsapp}</p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950/30">
                  <FileText size={20} />
                </div>
              </div>

              {/* Body details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Moto:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {q.motorcycle_details || 'Não cadastrada'} {q.motorcycle_year ? `(${q.motorcycle_year})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peças ({q.items?.length || 0}):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatBRL(pTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mão de Obra:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatBRL(q.labor_value || 0)}</span>
                </div>
                {q.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Desconto:</span>
                    <span className="font-bold">-{formatBRL(q.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2 text-sm font-black">
                  <span className="text-slate-800 dark:text-slate-100">Total:</span>
                  <span className="text-rose-600">{formatBRL(q.total_value)}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => handlePrintQuote(q)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1"
                  title="Imprimir PDF"
                >
                  <Printer size={12} />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(q)}
                  className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all dark:bg-emerald-950/20 dark:text-emerald-400"
                  title="Enviar no WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>

                <button
                  onClick={() => handleOpenEditModal(q)}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all dark:bg-slate-700 dark:text-slate-300"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => onConvertToSale(q)}
                  className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all dark:bg-rose-950/20 dark:text-rose-400"
                  title="Finalizar Venda (PDV)"
                >
                  <ShoppingCart size={14} />
                </button>

                <button
                  onClick={() => onConvertToOS(q)}
                  className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all dark:bg-indigo-950/20 dark:text-indigo-400"
                  title="Mover para Oficina"
                >
                  <Wrench size={14} />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Deseja excluir este orçamento definitivamente?')) onDeleteQuote(q.id);
                  }}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all dark:bg-red-950/20 dark:text-red-400"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredQuotes.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            Nenhum orçamento encontrado.
          </div>
        )}
      </div>

      {/* Add / Edit Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                {editingQuote ? 'Editar Orçamento' : 'Novo Orçamento de Balcão'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="Telefone..."
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Moto details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1">Moto (Modelo/Detalhes)</label>
                  <input
                    type="text"
                    placeholder="Ex: Honda Titan 160..."
                    value={motoDetails}
                    onChange={e => setMotoDetails(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Ano da Moto</label>
                  <input
                    type="text"
                    placeholder="Ex: 2021"
                    value={motoYear}
                    onChange={e => setMotoYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Product Picker */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block font-bold text-slate-400 uppercase">Adicionar Peças do Estoque</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Digite o nome do produto para buscar..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                  {/* Search results dropdown */}
                  {productSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[110] divide-y divide-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:divide-slate-700">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddProductItem(p)}
                          className="w-full p-2.5 hover:bg-rose-50/20 text-left text-xs font-bold transition-all flex justify-between items-center"
                        >
                          <span>{p.description}</span>
                          <span className="text-rose-600">{formatBRL(p.sale_price)} (Estoque: {p.stock})</span>
                        </button>
                      ))}
                      <div className="p-2 bg-slate-50 sticky bottom-0 dark:bg-slate-900 rounded-b-xl border-t border-slate-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setQuoteItems([...quoteItems, { description: productSearch.toUpperCase(), quantity: 1, price: 0 }]);
                            setProductSearch('');
                          }}
                          className="w-full py-2 bg-white border border-rose-200 text-[10px] font-black text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-400 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm dark:bg-slate-800"
                        >
                          <PlusCircle size={14} /> Adicionar "{productSearch}" avulso
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected parts table */}
                {quoteItems.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {quoteItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold">R$</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={item.price} 
                              onChange={e => handleUpdatePrice(idx, parseFloat(e.target.value) || 0)} 
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-right dark:bg-slate-900 dark:border-slate-700" 
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => handleUpdateQty(idx, -1)} className="text-slate-400 hover:text-rose-600"><MinusCircle size={16} /></button>
                            <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => handleUpdateQty(idx, 1)} className="text-slate-400 hover:text-rose-600"><PlusCircle size={16} /></button>
                          </div>
                          <span className="font-black text-slate-800 dark:text-slate-100 w-16 text-right">{formatBRL(item.price * item.quantity)}</span>
                          <button type="button" onClick={() => handleRemoveProductItem(idx)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic py-2 text-center">Nenhuma peça adicionada ainda.</p>
                )}
              </div>

              {/* Service details, discount and totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      placeholder="Valor da mão de obra..."
                      value={laborValue || ''}
                      onChange={e => setLaborValue(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Desconto Comercial (R$)</label>
                    <input
                      type="number"
                      placeholder="Desconto..."
                      value={discount || ''}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Forma de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="Pix">Pix (Dinheiro)</option>
                      <option value="Cartão Débito">Cartão de Débito</option>
                      <option value="Cartão Crédito">Cartão de Crédito</option>
                      <option value="Fiado">Fiado (Apenas clientes aprovados)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Status do Orçamento</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Recusado">Recusado</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Resumo de Serviços / Observações</label>
                <textarea
                  placeholder="Ex: Troca de pastilhas de freio dianteiro e traseiro..."
                  value={serviceDesc}
                  onChange={e => setServiceDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                />
              </div>

              {/* Total calculations display */}
              <div className="bg-rose-600 text-white p-4 rounded-2xl flex justify-between items-center font-black">
                <div>
                  <p className="text-[9px] uppercase text-rose-200">Total Líquido</p>
                  <p className="text-2xl">{formatBRL(totalValue)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <p className="text-rose-200">Peças: {formatBRL(partsTotal)}</p>
                  <p className="text-rose-200">Mão de obra: {formatBRL(laborValue)}</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all text-xs"
              >
                {editingQuote ? 'Salvar Alterações' : 'Criar Orçamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

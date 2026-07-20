import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Wrench, Search, Plus, Pencil, Trash2, Send, 
  Bike, Calendar, Clock, User, ClipboardList, X, PlusCircle, MinusCircle 
} from 'lucide-react';

interface Product {
  id: number;
  description: string;
  sale_price: number;
  stock: number;
}

interface ServicePart {
  id?: number;
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
}

interface Mechanic {
  id: string;
  name: string;
  commission_rate: number;
}

interface WorkshopService {
  id: number;
  cliente_id?: number;
  customer_name: string;
  whatsapp: string;
  motorcycle_details?: string;
  motorcycle_year?: string;
  motorcycle_plate?: string;
  service_requested: string;
  mechanic_id?: number;
  mechanic_name?: string;
  status: 'Aguardando avaliação' | 'Aguardando aprovação' | 'Aguardando peça' | 'Em manutenção' | 'Finalizado' | 'Entregue' | 'Cancelado';
  entry_date: string;
  delivery_forecast?: string;
  labor_value: number;
  parts_value: number;
  total_value: number;
  observacoes?: string;
  items?: ServicePart[];
}

interface CRMOficinaProps {
  services: WorkshopService[];
  products: Product[];
  mechanics: Mechanic[];
  formatBRL: (v: number) => string;
  onAddService: (service: Omit<WorkshopService, 'id' | 'entry_date'>) => Promise<void>;
  onUpdateService: (id: number, service: Partial<WorkshopService>) => Promise<void>;
  onDeleteService: (id: number) => Promise<void>;
  onSendWhatsApp: (phone: string, text: string) => void;
}

const STATUSES: WorkshopService['status'][] = [
  'Aguardando avaliação', 'Aguardando aprovação', 'Aguardando peça', 
  'Em manutenção', 'Finalizado', 'Entregue', 'Cancelado'
];

export default function CRMOficina({
  services,
  products,
  mechanics,
  formatBRL,
  onAddService,
  onUpdateService,
  onDeleteService,
  onSendWhatsApp
}: CRMOficinaProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<WorkshopService | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [motoDetails, setMotoDetails] = useState('');
  const [motoYear, setMotoYear] = useState('');
  const [motoPlate, setMotoPlate] = useState('');
  const [serviceRequested, setServiceRequested] = useState('');
  const [mechanicId, setMechanicId] = useState<number | undefined>(undefined);
  const [mechanicName, setMechanicName] = useState('');
  const [status, setStatus] = useState<WorkshopService['status']>('Aguardando avaliação');
  const [entryDate, setEntryDate] = useState('');
  const [deliveryForecast, setDeliveryForecast] = useState('');
  const [laborValue, setLaborValue] = useState(0);
  const [partsValue, setPartsValue] = useState(0);
  const [observations, setObservations] = useState('');
  const [partsList, setPartsList] = useState<ServicePart[]>([]);

  // Product Search inside Modal
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
    setEditingService(null);
    setCustomerName('');
    setWhatsapp('');
    setMotoDetails('');
    setMotoYear('');
    setMotoPlate('');
    setServiceRequested('');
    setMechanicId(undefined);
    setMechanicName('');
    setStatus('Aguardando avaliação');
    setEntryDate(new Date().toISOString().substring(0, 16));
    setDeliveryForecast('');
    setLaborValue(0);
    setPartsValue(0);
    setObservations('');
    setPartsList([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: WorkshopService) => {
    setEditingService(s);
    setCustomerName(s.customer_name);
    setWhatsapp(s.whatsapp);
    setMotoDetails(s.motorcycle_details || '');
    setMotoYear(s.motorcycle_year || '');
    setMotoPlate(s.motorcycle_plate || '');
    setServiceRequested(s.service_requested);
    setMechanicId(s.mechanic_id);
    setMechanicName(s.mechanic_name || '');
    setStatus(s.status);
    setEntryDate(new Date(s.entry_date).toISOString().substring(0, 16));
    setDeliveryForecast(s.delivery_forecast || '');
    setLaborValue(s.labor_value || 0);
    setPartsValue(s.parts_value || 0);
    setObservations(s.observacoes || '');
    setPartsList(s.items || []);
    setIsModalOpen(true);
  };

  const handleAddPartItem = (p: Product) => {
    const existing = partsList.find(item => item.description === p.description);
    if (existing) {
      setPartsList(partsList.map(item => 
        item.description === p.description ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPartsList([...partsList, { product_id: p.id, description: p.description, price: p.sale_price, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const handleRemovePartItem = (idx: number) => {
    setPartsList(partsList.filter((_, i) => i !== idx));
  };

  const handleUpdatePrice = (idx: number, newPrice: number) => {
    setPartsList(partsList.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setPartsList(partsList.map((item, i) => {
      if (i === idx) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  // Calculations
  const computedPartsTotal = partsList.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const totalValue = computedPartsTotal + laborValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !whatsapp || !serviceRequested) return alert('Por favor, preencha todos os campos obrigatórios.');

    const selectedMech = mechanics.find(m => String(m.id) === String(mechanicId));

    const payload = {
      customer_name: customerName,
      whatsapp,
      motorcycle_details: motoDetails,
      motorcycle_year: motoYear,
      motorcycle_plate: motoPlate,
      service_requested: serviceRequested,
      mechanic_id: mechanicId,
      mechanic_name: selectedMech ? selectedMech.name : mechanicName,
      status,
      entry_date: new Date(entryDate).toISOString(),
      delivery_forecast: deliveryForecast ? new Date(deliveryForecast).toISOString() : undefined,
      labor_value: laborValue,
      parts_value: computedPartsTotal,
      total_value: totalValue,
      observacoes: observations,
      items: partsList
    };

    if (editingService) {
      await onUpdateService(editingService.id, payload);
    } else {
      await onAddService(payload);
    }
    setIsModalOpen(false);
  };

  const handleMoveStatus = async (id: number, newStatus: WorkshopService['status']) => {
    await onUpdateService(id, { status: newStatus });
  };

  const handleShareWhatsAppReady = (s: WorkshopService) => {
    // Moto pronta message
    const msg = `Olá, ${s.customer_name}! Sua moto já está pronta para retirada. 🏍️\n\nKombat Moto Peças\nRua Paraná, 342, Centro, Andirá – PR\nWhatsApp: 43 3538-4537`;
    onSendWhatsApp(s.whatsapp, msg);
  };

  const filteredServices = services.filter(s => {
    const term = searchQuery.toLowerCase();
    return (
      s.customer_name.toLowerCase().includes(term) ||
      s.whatsapp.includes(term) ||
      (s.motorcycle_details || '').toLowerCase().includes(term) ||
      (s.motorcycle_plate || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, placa, telefone ou modelo..."
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
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Kanban workshop layout */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-[500px]">
        {STATUSES.map(st => {
          const stServices = filteredServices.filter(s => s.status === st);
          const stTotal = stServices.reduce((acc, curr) => acc + curr.total_value, 0);

          return (
            <div 
              key={st}
              className="flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-900/10 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[620px]"
            >
              {/* Kanban Column Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{st}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      {stServices.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatBRL(stTotal)}</p>
                </div>
              </div>

              {/* Column list */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[250px]">
                {stServices.map(s => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">OS #{s.id}</span>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase truncate">{s.customer_name}</h4>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este registro de serviço?')) onDeleteService(s.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                        {st === 'Finalizado' && (
                          <button
                            onClick={() => handleShareWhatsAppReady(s)}
                            className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                            title="Aviso de Moto Pronta"
                          >
                            <Send size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Bike size={12} className="text-slate-400" />
                        <span>{s.motorcycle_details || 'Moto N/A'} {s.motorcycle_plate ? `[${s.motorcycle_plate}]` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClipboardList size={12} className="text-slate-400" />
                        <span className="truncate">Serviço: {s.service_requested}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        <span>Mecânico: {s.mechanic_name || 'A definir'}</span>
                      </div>
                    </div>

                    {/* Footer values & stage select */}
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2 text-[10px]">
                      <span className="font-black text-rose-600">{formatBRL(s.total_value)}</span>
                      
                      <select
                        value={s.status}
                        onChange={e => handleMoveStatus(s.id, e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 border-none outline-none font-bold text-[9px] text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        {STATUSES.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {stServices.length === 0 && (
                  <div className="py-8 text-center text-[10px] text-slate-400 italic">
                    Nenhum serviço nesta etapa.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OS Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                {editingService ? 'Editar Ordem de Serviço' : 'Nova Entrada de Moto na Oficina'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Customer data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Cliente (Nome Completo)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do cliente..."
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
                    placeholder="WhatsApp do cliente..."
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Motorcycle details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1.5">
                  <label className="block font-bold text-slate-400 uppercase mb-1">Moto (Modelo/Ano)</label>
                  <input
                    type="text"
                    placeholder="Honda Titan 160..."
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
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Placa da Moto</label>
                  <input
                    type="text"
                    placeholder="Ex: ABC-1234"
                    value={motoPlate}
                    onChange={e => setMotoPlate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Service requested */}
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Serviço Solicitado / Sintomas da Moto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisão geral / Vazamento de óleo / Pastilha de freio gasta..."
                  value={serviceRequested}
                  onChange={e => setServiceRequested(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              {/* Parts picker */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block font-bold text-slate-400 uppercase">Peças Utilizadas (Estoque)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar peça no estoque para adicionar..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                  {/* Results search list */}
                  {productSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[110] divide-y divide-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:divide-slate-700">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddPartItem(p)}
                          className="w-full p-2.5 hover:bg-rose-50/20 text-left text-xs font-bold transition-all flex justify-between items-center"
                        >
                          <span>{p.description}</span>
                          <span className="text-rose-600">{formatBRL(p.sale_price)} (Qtd: {p.stock})</span>
                        </button>
                      ))}
                      <div className="p-2 bg-slate-50 sticky bottom-0 dark:bg-slate-900 rounded-b-xl border-t border-slate-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setPartsList([...partsList, { description: productSearch.toUpperCase(), quantity: 1, price: 0 }]);
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

                {/* Selected parts */}
                {partsList.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {partsList.map((item, idx) => (
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
                          <button type="button" onClick={() => handleRemovePartItem(idx)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic py-2 text-center">Nenhuma peça adicionada.</p>
                )}
              </div>

              {/* Mechanics & Status & Forecast */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Mecânico Responsável</label>
                  <select
                    value={mechanicId || ''}
                    onChange={e => setMechanicId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="">Selecione o mecânico...</option>
                    {mechanics.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Status do Serviço</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    {STATUSES.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Previsão de Entrega</label>
                  <input
                    type="datetime-local"
                    value={deliveryForecast ? deliveryForecast.substring(0, 16) : ''}
                    onChange={e => setDeliveryForecast(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Entry date and pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Data/Hora de Entrada</label>
                  <input
                    type="datetime-local"
                    required
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Valor Mão de Obra (R$)</label>
                  <input
                    type="number"
                    placeholder="Mão de obra..."
                    value={laborValue || ''}
                    onChange={e => setLaborValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Observações Internas (Balcão e Oficina)</label>
                <textarea
                  placeholder="Escreva anotações sobre o estado da moto na chegada ou peças especiais pedidas..."
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                />
              </div>

              {/* Totals panel */}
              <div className="bg-rose-600 text-white p-4 rounded-2xl flex justify-between items-center font-black">
                <div>
                  <p className="text-[9px] uppercase text-rose-200">Total da OS</p>
                  <p className="text-2xl">{formatBRL(totalValue)}</p>
                </div>
                <div className="text-right text-[10px]">
                  <p className="text-rose-200">Peças Utilizadas: {formatBRL(computedPartsTotal)}</p>
                  <p className="text-rose-200">Mão de obra: {formatBRL(laborValue)}</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all text-xs"
              >
                {editingService ? 'Salvar Ordem de Serviço' : 'Criar Ordem de Serviço'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Bike,
  Settings,
  Wrench,
  Clock,
  CreditCard,
  Calendar,
  Package,
  Plus,
  Minus,
  Trash2,
  Copy,
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Save,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  DollarSign,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import Modal from './Modal';
import SmartCustomerSearch from './common/SmartCustomerSearch';
import SmartProductSearch from './common/SmartProductSearch';
import { CustomerItem, MotorcycleItem, ProductItem, ServiceItem } from '../utils/smartSearch';

export interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço' | 'Serviço Principal' | 'Adicional Interno';
}

export interface OSFormState {
  customer_id: string;
  motorcycle_id: string;
  motorcycle_plate: string;
  items: SaleItem[];
  selected_fixed_services: { id: string; name: string; price: number; payout: number; quantity: number }[];
  labor_value: string;
  principal_service_desc: string;
  internal_services: { description: string; price: number }[];
  mechanic_id: string;
  payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
  status: 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue';
  due_date: string;
  service_description: string;
  km: string;
  charge_type?: 'vista' | 'credito_30_dias' | 'atacado';
  installments?: number;
}

export interface OSFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOS: any | null;
  osForm: OSFormState;
  setOsForm: React.Dispatch<React.SetStateAction<OSFormState>>;
  customers: any[];
  motorcycles: any[];
  mechanics: any[];
  products: any[];
  fixedServices: any[];
  registeredServices: any[];
  sales: any[];
  handleCompleteOS: (options?: { isDraft?: boolean }) => Promise<void>;
  handlePrintOS?: (osData: any) => void;
  handleSendWhatsApp?: (osData: any) => void;
  onOpenNewCustomerModal: () => void;
  onConvertToQuote?: (quoteData: any) => void;
  isCustomerReallyBlocked: (customer: any) => boolean;
  getCustomerRemainingCredit: (customerId: number) => number;
  formatBRL: (val: any) => string;
}

export const OSFormModal: React.FC<OSFormModalProps> = ({
  isOpen,
  onClose,
  editingOS,
  osForm,
  setOsForm,
  customers,
  motorcycles,
  mechanics,
  products,
  fixedServices,
  registeredServices,
  sales,
  handleCompleteOS,
  handlePrintOS,
  handleSendWhatsApp,
  onOpenNewCustomerModal,
  onConvertToQuote,
  isCustomerReallyBlocked,
  getCustomerRemainingCredit,
  formatBRL,
}) => {
  const [activeItemTab, setActiveItemTab] = useState<'all' | 'parts' | 'services'>('all');
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);
  const [newInternalDesc, setNewInternalDesc] = useState('');
  const [newInternalPrice, setNewInternalPrice] = useState('');
  const [customerSearchText, setCustomerSearchText] = useState('');

  // Sincroniza busca de cliente ao abrir modal ou editar O.S.
  useEffect(() => {
    if (osForm.customer_id) {
      const found = customers.find(c => c.id === parseInt(osForm.customer_id));
      if (found) {
        setCustomerSearchText(found.name);
      }
    } else {
      setCustomerSearchText('');
    }
  }, [osForm.customer_id, customers, isOpen]);

  // Cálculos Financeiros em tempo real
  const financialTotals = useMemo(() => {
    // 1. Peças
    const partsItems = osForm.items.filter(i => i.product_id || i.type === 'Peça');
    const partsSubtotal = partsItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    // 2. Serviços da Lista + Repasses Fixos
    const serviceItems = osForm.items.filter(i => !i.product_id && i.type === 'Serviço');
    const serviceItemsSubtotal = serviceItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const fixedServicesSubtotal = (osForm.selected_fixed_services || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    // 3. Mão de Obra Principal Manual
    const laborManual = parseFloat(String(osForm.labor_value || '0').replace(',', '.')) || 0;

    // 4. Adicionais Internos do Mecânico
    const internalsSubtotal = (osForm.internal_services || []).reduce((acc, curr) => acc + (curr.price || 0), 0);

    // Subtotal Total de Serviços
    const servicesTotal = serviceItemsSubtotal + fixedServicesSubtotal + laborManual;

    // Total Geral
    const grandTotal = partsSubtotal + servicesTotal;

    return {
      partsCount: partsItems.length,
      servicesCount: serviceItems.length + (osForm.selected_fixed_services?.length || 0),
      partsSubtotal,
      serviceItemsSubtotal,
      fixedServicesSubtotal,
      laborManual,
      internalsSubtotal,
      servicesTotal,
      grandTotal,
    };
  }, [osForm.items, osForm.selected_fixed_services, osForm.labor_value, osForm.internal_services]);

  // Motos do cliente selecionado
  const customerMotos = useMemo(() => {
    if (!osForm.customer_id) return [];
    return motorcycles.filter(m => m.customer_id === parseInt(osForm.customer_id));
  }, [osForm.customer_id, motorcycles]);

  // Cliente atual selecionado
  const currentCustomer = useMemo(() => {
    if (!osForm.customer_id) return null;
    return customers.find(c => c.id === parseInt(osForm.customer_id)) || null;
  }, [osForm.customer_id, customers]);

  // Mudança de Tabela de Preço com Recálculo Opcional
  const handleChangeChargeType = (newType: 'vista' | 'credito_30_dias' | 'atacado') => {
    if (osForm.charge_type === newType) return;

    if (osForm.items.length > 0) {
      const confirmRecalc = window.confirm(
        `Deseja atualizar os preços dos itens da O.S. para a tabela "${newType === 'vista' ? 'À Vista' : newType === 'credito_30_dias' ? '30 Dias' : 'Atacado'}"?`
      );
      if (confirmRecalc) {
        const updatedItems = osForm.items.map(item => {
          if (item.product_id) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              let pPrice = product.sale_price;
              if (newType === 'credito_30_dias' && product.sale_price_credit) pPrice = product.sale_price_credit;
              if (newType === 'atacado' && product.sale_price_wholesale) pPrice = product.sale_price_wholesale;
              return { ...item, price: pPrice };
            }
          }
          return item;
        });
        setOsForm(prev => ({ ...prev, charge_type: newType, items: updatedItems }));
        return;
      }
    }
    setOsForm(prev => ({ ...prev, charge_type: newType }));
  };

  // Manipulação de Itens
  const handleItemQuantityChange = (idx: number, deltaOrVal: number, isAbsolute = false) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      if (!newItems[idx]) return prev;
      const currentQty = newItems[idx].quantity || 1;
      const newQty = isAbsolute ? Math.max(1, deltaOrVal) : Math.max(1, currentQty + deltaOrVal);
      newItems[idx] = { ...newItems[idx], quantity: newQty };
      return { ...prev, items: newItems };
    });
  };

  const handleItemPriceChange = (idx: number, newPrice: number) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      if (!newItems[idx]) return prev;
      newItems[idx] = { ...newItems[idx], price: Math.max(0, newPrice) };
      return { ...prev, items: newItems };
    });
  };

  const handleItemDescriptionChange = (idx: number, newDesc: string) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      if (!newItems[idx]) return prev;
      newItems[idx] = { ...newItems[idx], description: newDesc.toUpperCase() };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (idx: number) => {
    setOsForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleDuplicateItem = (idx: number) => {
    setOsForm(prev => {
      const target = prev.items[idx];
      if (!target) return prev;
      return {
        ...prev,
        items: [...prev.items, { ...target }],
      };
    });
  };

  const handleAddManualItem = (type: 'Peça' | 'Serviço') => {
    setOsForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: type === 'Peça' ? 'PEÇA AVULSA' : 'SERVIÇO MANUAL',
          quantity: 1,
          price: 0,
          type,
        },
      ],
    }));
  };

  // Itens filtrados para a tabela
  const filteredItems = useMemo(() => {
    return osForm.items.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
      if (activeItemTab === 'parts') return item.product_id || item.type === 'Peça';
      if (activeItemTab === 'services') return !item.product_id && item.type === 'Serviço';
      return true;
    });
  }, [osForm.items, activeItemTab]);

  // Ação de Gerar Orçamento a partir da O.S.
  const handleConvertToQuoteAction = () => {
    if (!osForm.items.length && financialTotals.laborManual === 0) {
      alert('Adicione itens ou mão de obra antes de gerar um orçamento.');
      return;
    }
    if (onConvertToQuote) {
      onConvertToQuote({
        customer_name: currentCustomer?.name || 'Cliente',
        customer_id: currentCustomer?.id,
        motorcycle_details: osForm.motorcycle_plate ? `Placa ${osForm.motorcycle_plate} - KM ${osForm.km || '0'}` : '',
        charge_type: osForm.charge_type || 'vista',
        items: [
          ...osForm.items.map(it => ({
            description: it.description,
            quantity: it.quantity,
            price: it.price,
            total: it.price * it.quantity,
            type: it.type || (it.product_id ? 'Peça' : 'Serviço'),
          })),
          ...(financialTotals.laborManual > 0
            ? [
                {
                  description: osForm.principal_service_desc || 'MÃO DE OBRA / SERVIÇO PRINCIPAL',
                  quantity: 1,
                  price: financialTotals.laborManual,
                  total: financialTotals.laborManual,
                  type: 'Serviço Principal',
                },
              ]
            : []),
        ],
        total_value: financialTotals.grandTotal,
        observations: osForm.service_description || '',
      });
      alert('Orçamento gerado com sucesso!');
    } else {
      alert('Funcionalidade de orçamento pronta para envio.');
    }
  };

  // Envio de WhatsApp rápido com a O.S.
  const handleSendWhatsAppAction = () => {
    if (handleSendWhatsApp) {
      handleSendWhatsApp({
        id: editingOS ? editingOS.id : 'NOVA O.S.',
        customer_name: currentCustomer?.name || 'Cliente',
        customer_id: currentCustomer?.id,
        whatsapp: currentCustomer?.whatsapp,
        total: financialTotals.grandTotal,
        items: osForm.items,
        labor_value: financialTotals.laborManual,
        payment_method: osForm.payment_method,
        date: new Date().toISOString(),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOS ? `Editar Ordem de Serviço #${editingOS.id}` : 'Nova Ordem de Serviço (O.S.)'}
      fullScreen={true}
      bodyClassName="p-0 flex flex-col bg-slate-900 text-slate-100 h-full w-full overflow-hidden"
    >
      <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950">
        {/* ========================================================= */}
        {/* ÁREA 1: CABEÇALHO E IDENTIFICAÇÃO (Topo Completo e Limpo)  */}
        {/* ========================================================= */}
        <div className="bg-slate-900/95 border-b border-slate-800 p-4 lg:px-6 shrink-0 shadow-lg relative z-30">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5 items-end">
            
            {/* 1. Tabela de Preço */}
            <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                <DollarSign size={13} className="text-rose-500" /> Tabela de Preço
              </label>
              <div className="flex bg-slate-800/80 border border-slate-700 rounded-xl p-1 h-[38px]">
                <button
                  type="button"
                  onClick={() => handleChangeChargeType('vista')}
                  className={`flex-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    osForm.charge_type === 'vista' || !osForm.charge_type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  À Vista
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeChargeType('credito_30_dias')}
                  className={`flex-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    osForm.charge_type === 'credito_30_dias'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeChargeType('atacado')}
                  className={`flex-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    osForm.charge_type === 'atacado'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Atacado
                </button>
              </div>
            </div>

            {/* 2. Cliente (Busca Inteligente) */}
            <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 relative">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Users size={13} className="text-rose-500" /> Cliente</span>
                {currentCustomer && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                    isCustomerReallyBlocked(currentCustomer)
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  }`}>
                    {isCustomerReallyBlocked(currentCustomer) ? 'CRÉDITO BLOQUEADO' : 'LIBERADO'}
                  </span>
                )}
              </label>
              <SmartCustomerSearch
                customers={customers}
                motorcycles={motorcycles}
                selectedCustomerId={osForm.customer_id}
                selectedCustomerName={customerSearchText}
                placeholder="Buscar cliente, placa ou tel..."
                isCustomerBlocked={isCustomerReallyBlocked}
                getRemainingCredit={getCustomerRemainingCredit}
                onOpenNewCustomerModal={onOpenNewCustomerModal}
                onSelectCustomer={(c, matchedMoto) => {
                  setCustomerSearchText(c.name);
                  if (isCustomerReallyBlocked(c)) {
                    alert(`CRÉDITO BLOQUEADO\n\nEste cliente está com o crédito bloqueado.\nMotivo: ${c.credit_block_reason || 'Débito superior a 30 dias de atraso.'}`);
                  }
                  const custMotos = motorcycles.filter(m => m.customer_id === c.id);
                  const chosenMoto = matchedMoto || (custMotos.length > 0 ? custMotos[0] : null);
                  if (chosenMoto) {
                    setOsForm(prev => ({
                      ...prev,
                      customer_id: c.id.toString(),
                      motorcycle_id: chosenMoto.id.toString(),
                      motorcycle_plate: chosenMoto.plate,
                      km: chosenMoto.current_km ? String(chosenMoto.current_km) : '',
                    }));
                  } else {
                    setOsForm(prev => ({
                      ...prev,
                      customer_id: c.id.toString(),
                      motorcycle_id: '',
                      motorcycle_plate: '',
                      km: '',
                    }));
                  }
                }}
                onClearCustomer={() => {
                  setCustomerSearchText('');
                  setOsForm(prev => ({
                    ...prev,
                    customer_id: '',
                    motorcycle_id: '',
                    motorcycle_plate: '',
                    km: '',
                  }));
                }}
              />
            </div>

            {/* 3. Motocicleta */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Bike size={13} className="text-rose-500" /> Moto
              </label>
              {customerMotos.length > 0 && osForm.motorcycle_id !== 'manual' ? (
                <select
                  value={osForm.motorcycle_id}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'manual') {
                      setOsForm(prev => ({ ...prev, motorcycle_id: 'manual', motorcycle_plate: '' }));
                    } else {
                      const moto = customerMotos.find(m => String(m.id) === val);
                      if (moto) {
                        setOsForm(prev => ({
                          ...prev,
                          motorcycle_id: val,
                          motorcycle_plate: moto.plate,
                          km: moto.current_km ? String(moto.current_km) : '',
                        }));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-rose-500 h-[38px]"
                >
                  {customerMotos.map(m => (
                    <option key={m.id} value={String(m.id)}>
                      {m.model || m.brand} ({m.plate})
                    </option>
                  ))}
                  <option value="manual">+ Placa Manual</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Placa / Modelo"
                    value={osForm.motorcycle_plate || ''}
                    onChange={e => setOsForm(prev => ({ ...prev, motorcycle_plate: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-slate-100 uppercase outline-none focus:border-rose-500 h-[38px]"
                  />
                  {customerMotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOsForm(prev => ({
                          ...prev,
                          motorcycle_id: String(customerMotos[0].id),
                          motorcycle_plate: customerMotos[0].plate,
                          km: customerMotos[0].current_km ? String(customerMotos[0].current_km) : '',
                        }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-400 hover:text-rose-300"
                    >
                      Voltar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. KM Atual */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Settings size={13} className="text-rose-500" /> KM Atual
              </label>
              <input
                type="number"
                placeholder="00000"
                value={osForm.km || ''}
                onChange={e => setOsForm(prev => ({ ...prev, km: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 outline-none focus:border-rose-500 no-spinners h-[38px]"
              />
            </div>

            {/* 5. Mecânico */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Wrench size={13} className="text-rose-500" /> Mecânico
              </label>
              <select
                value={osForm.mechanic_id}
                onChange={e => setOsForm(prev => ({ ...prev, mechanic_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-rose-500 h-[38px]"
              >
                <option value="">Geral / Nenhum</option>
                {mechanics.filter(Boolean).map(m => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name || 'Mecânico'}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Situação & Pagamento */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                  Situação
                </label>
                <select
                  value={osForm.status}
                  onChange={e => setOsForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className={`w-full px-2 py-2 border rounded-xl text-xs font-black outline-none h-[38px] ${
                    osForm.status === 'Aberto'
                      ? 'bg-sky-950/70 border-sky-600 text-sky-300'
                      : osForm.status === 'Em Andamento'
                      ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                      : osForm.status === 'Pronto'
                      ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                      : 'bg-indigo-950/70 border-indigo-600 text-indigo-300'
                  }`}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Pronto">Pronto</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* CORPO DA O.S.: 70% ÁREA PRINCIPAL + 30% PAINEL FINANCEIRO  */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-slate-950 p-4 lg:p-6 gap-6">
          
          {/* ------------------------------------------------------- */}
          {/* ÁREA 2: PRINCIPAL (PESQUISA + TABELA DE PEÇAS E SERVIÇOS) */}
          {/* ------------------------------------------------------- */}
          <div className="flex-1 lg:flex-[7] flex flex-col gap-4 overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            
            {/* Topo da Área 2: Barra de Busca Inteligente */}
            <div className="relative shrink-0">
              <SmartProductSearch
                products={products}
                services={registeredServices}
                chargeType={osForm.charge_type || 'vista'}
                onSelectProduct={(p: ProductItem) => {
                  const existingIdx = osForm.items.findIndex(i => i.product_id === p.id);
                  if (existingIdx >= 0) {
                    handleItemQuantityChange(existingIdx, 1);
                  } else {
                    let price = p.sale_price;
                    if (osForm.charge_type === 'credito_30_dias' && p.sale_price_credit) price = p.sale_price_credit;
                    if (osForm.charge_type === 'atacado' && p.sale_price_wholesale) price = p.sale_price_wholesale;
                    setOsForm(prev => ({
                      ...prev,
                      items: [
                        ...prev.items,
                        {
                          product_id: p.id,
                          description: p.description,
                          quantity: 1,
                          price,
                          type: 'Peça',
                        },
                      ],
                    }));
                  }
                }}
                onSelectService={(s: ServiceItem) => {
                  setOsForm(prev => ({
                    ...prev,
                    items: [
                      ...prev.items,
                      {
                        description: s.description || s.name || 'SERVIÇO',
                        quantity: 1,
                        price: s.price || 0,
                        type: 'Serviço',
                      },
                    ],
                  }));
                }}
                onAddCustomItem={(desc: string) => {
                  setOsForm(prev => ({
                    ...prev,
                    items: [
                      ...prev.items,
                      {
                        description: desc,
                        quantity: 1,
                        price: 0,
                        type: 'Peça',
                      },
                    ],
                  }));
                }}
                placeholder="Buscar peça/serviço (ex: cabo acel bros, rel titan, lona 025)..."
                autoFocus
              />
            </div>

            {/* Barra de Filtros e Ações Rápidas de Itens */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveItemTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                    activeItemTab === 'all'
                      ? 'bg-slate-800 text-rose-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({osForm.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItemTab('parts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                    activeItemTab === 'parts'
                      ? 'bg-slate-800 text-sky-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package size={13} /> Peças ({financialTotals.partsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItemTab('services')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                    activeItemTab === 'services'
                      ? 'bg-slate-800 text-amber-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wrench size={13} /> Serviços ({financialTotals.servicesCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddManualItem('Peça')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Plus size={13} /> + Peça Avulsa
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualItem('Serviço')}
                  className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Plus size={13} /> + Serviço Avulso
                </button>
              </div>
            </div>

            {/* Tabela Editável de Peças e Serviços */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 custom-scrollbar">
              {filteredItems.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-20">Tipo</th>
                      <th className="py-2.5 px-3">Descrição da Peça / Serviço</th>
                      <th className="py-2.5 px-3 w-32 text-center">Quantidade</th>
                      <th className="py-2.5 px-3 w-28 text-right">Preço Unit.</th>
                      <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {filteredItems.map(({ item, originalIndex }) => {
                      const isPart = item.product_id || item.type === 'Peça';
                      const subtotal = (item.price || 0) * (item.quantity || 1);

                      return (
                        <tr
                          key={`item-${originalIndex}`}
                          className="hover:bg-slate-900/70 transition-colors group"
                        >
                          {/* Tipo */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                isPart
                                  ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                                  : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                              }`}
                            >
                              {isPart ? <Package size={10} /> : <Wrench size={10} />}
                              {isPart ? 'Peça' : 'Serviço'}
                            </span>
                          </td>

                          {/* Descrição */}
                          <td className="py-3 px-3">
                            {!item.product_id ? (
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => handleItemDescriptionChange(originalIndex, e.target.value)}
                                placeholder="Digite a descrição do item avulso..."
                                className="w-full bg-slate-900/80 px-2.5 py-1.5 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 outline-none focus:border-rose-500"
                              />
                            ) : (
                              <div>
                                <p className="font-bold text-slate-100 leading-snug">{item.description}</p>
                                <span className="text-[10px] text-slate-500 font-mono">Cód: #{item.product_id}</span>
                              </div>
                            )}
                          </td>

                          {/* Quantidade */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(originalIndex, -1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleItemQuantityChange(originalIndex, parseInt(e.target.value) || 1, true)}
                                className="w-10 text-center font-black text-xs text-slate-100 bg-transparent outline-none no-spinners"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(originalIndex, 1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>

                          {/* Preço Unitário */}
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
                              <span className="text-[10px] text-slate-500 font-bold">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={e => handleItemPriceChange(originalIndex, parseFloat(e.target.value) || 0)}
                                className="w-16 text-right font-black text-xs text-slate-100 bg-transparent outline-none no-spinners"
                              />
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-sm text-slate-100">{formatBRL(subtotal)}</span>
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(originalIndex)}
                                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Duplicar item"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(originalIndex)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Remover item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600">
                    <Package size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Nenhum item adicionado nesta O.S.</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Digite na barra de pesquisa acima para adicionar peças, serviços cadastrados ou clique nos botões acima para itens avulsos.
                  </p>
                </div>
              )}
            </div>

            {/* Repasses Terceirizados & Serviços Fixos Adicionados */}
            {(osForm.selected_fixed_services?.length > 0 || (osForm.internal_services && osForm.internal_services.length > 0)) && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 shrink-0">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ExternalLink size={12} /> Serviços Terceirizados & Adicionais do Mecânico
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {osForm.selected_fixed_services?.map((sfs, idx) => (
                    <div
                      key={`sfs-${idx}`}
                      className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-200 truncate">{sfs.name}</p>
                        <span className="text-[10px] text-slate-500">{sfs.quantity}x {formatBRL(sfs.price)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-indigo-300">{formatBRL(sfs.price * sfs.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOsForm(prev => ({
                              ...prev,
                              selected_fixed_services: prev.selected_fixed_services.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {osForm.internal_services?.map((intern, idx) => (
                    <div
                      key={`intern-${idx}`}
                      className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-200 truncate">{intern.description}</p>
                        <span className="text-[10px] text-slate-500">Adicional Interno</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-indigo-300">{formatBRL(intern.price)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOsForm(prev => ({
                              ...prev,
                              internal_services: prev.internal_services.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------- */}
          {/* ÁREA 3 & 4: PAINEL FINANCEIRO (~30%) + OBSERVAÇÕES & AÇÕES */}
          {/* ------------------------------------------------------- */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4 overflow-hidden">
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              
              {/* Card Mão de Obra Principal */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Wrench size={13} className="text-amber-500" /> Serviço Principal / Mão de Obra
                  </span>
                </div>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Descrição (ex: Revisão Geral, Motor)"
                    value={osForm.principal_service_desc}
                    onChange={e => setOsForm(prev => ({ ...prev, principal_service_desc: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 outline-none focus:border-amber-500"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={osForm.labor_value}
                      onChange={e => setOsForm(prev => ({ ...prev, labor_value: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-black text-amber-400 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Repasses do Mecânico (se selecionado) */}
              {osForm.mechanic_id && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <ExternalLink size={13} /> Terceirizados & Adicionais
                  </label>
                  
                  {/* Select de Fixos */}
                  <select
                    value=""
                    onChange={e => {
                      const sel = fixedServices.find(fs => String(fs.id) === e.target.value);
                      if (sel) {
                        setOsForm(prev => {
                          const existing = prev.selected_fixed_services?.find(s => s.id === sel.id);
                          if (existing) {
                            return {
                              ...prev,
                              selected_fixed_services: prev.selected_fixed_services.map(s =>
                                s.id === sel.id ? { ...s, quantity: s.quantity + 1 } : s
                              ),
                            };
                          }
                          return {
                            ...prev,
                            selected_fixed_services: [...(prev.selected_fixed_services || []), { ...sel, quantity: 1 }],
                          };
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  >
                    <option value="">+ Adicionar Repasse Terceirizado...</option>
                    {fixedServices.map(fs => (
                      <option key={fs.id} value={String(fs.id)}>
                        {fs.name} (Repasse: {formatBRL(fs.payout || fs.price)})
                      </option>
                    ))}
                  </select>

                  {/* Adicional Avulso */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicional interno..."
                      value={newInternalDesc}
                      onChange={e => setNewInternalDesc(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="R$"
                      value={newInternalPrice}
                      onChange={e => setNewInternalPrice(e.target.value)}
                      className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const price = parseFloat(newInternalPrice) || 0;
                        if (!newInternalDesc.trim() || price <= 0) {
                          alert('Informe descrição e valor válido.');
                          return;
                        }
                        setOsForm(prev => ({
                          ...prev,
                          internal_services: [
                            ...(prev.internal_services || []),
                            { description: newInternalDesc.trim().toUpperCase(), price },
                          ],
                        }));
                        setNewInternalDesc('');
                        setNewInternalPrice('');
                      }}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Forma de Pagamento e Condições */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-rose-500" /> Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Pix', 'Cartão', 'Dinheiro', 'Fiado'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setOsForm(prev => ({
                          ...prev,
                          payment_method: method,
                          charge_type: method === 'Fiado' ? 'credito_30_dias' : prev.charge_type,
                        }));
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        osForm.payment_method === method
                          ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Opções extras quando Fiado */}
                {osForm.payment_method === 'Fiado' && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-rose-400 mb-1">1º Vencimento</label>
                        <input
                          type="date"
                          value={osForm.due_date || ''}
                          onChange={e => setOsForm(prev => ({ ...prev, due_date: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-rose-400 mb-1">Parcelas</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={osForm.installments || 1}
                          onChange={e => setOsForm(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações da O.S. (Queixa e Laudo) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-rose-500" /> Relato do Cliente & Observações
                </span>
                <textarea
                  placeholder="Problemas relatados pelo cliente, serviços solicitados ou detalhes da oficina..."
                  value={osForm.service_description}
                  onChange={e => setOsForm(prev => ({ ...prev, service_description: e.target.value }))}
                  rows={3}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-rose-500 resize-none custom-scrollbar"
                />
              </div>

            </div>

            {/* Painel Financeiro e Botão de Ação (Fixo na Base) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-5 shadow-2xl shrink-0 space-y-4">
              
              {/* Detalhamento dos Totais */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold flex items-center gap-1.5"><Package size={13} /> Subtotal Peças:</span>
                  <span className="font-bold text-slate-200">{formatBRL(financialTotals.partsSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold flex items-center gap-1.5"><Wrench size={13} /> Subtotal Serviços:</span>
                  <span className="font-bold text-slate-200">{formatBRL(financialTotals.servicesTotal)}</span>
                </div>
              </div>

              {/* Linha Divisória */}
              <div className="h-px bg-slate-800" />

              {/* TOTAL GERAL DA O.S. */}
              <div className="flex justify-between items-end pt-1">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block">Total Geral da O.S.</span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {osForm.payment_method} {osForm.payment_method === 'Fiado' && osForm.installments && osForm.installments > 1 ? `(${osForm.installments}x)` : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {formatBRL(financialTotals.grandTotal)}
                  </span>
                </div>
              </div>

              {/* BARRA DE AÇÕES NO RODAPÉ */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConvertToQuoteAction}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                  title="Transformar esta O.S. em Orçamento"
                >
                  <FileText size={13} /> Orçamento
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppAction}
                  className="py-2.5 px-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                  title="Enviar resumo da O.S. pelo WhatsApp"
                >
                  <Share2 size={13} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteOS({ isDraft: true })}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                  title="Salvar sem fechar"
                >
                  <Save size={13} /> Salvar
                </button>
              </div>

              {/* Botão Finalizar O.S. (Destaque Principal com Confirmação Segura) */}
              <button
                type="button"
                onClick={() => setIsConfirmFinalizeOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_25px_rgba(225,29,72,0.35)] hover:shadow-[0_0_35px_rgba(225,29,72,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} strokeWidth={2.5} />
                {editingOS ? 'Salvar e Concluir O.S.' : 'FINALIZAR ORDEM DE SERVIÇO'}
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* Modal de Confirmação Segura para Finalização da O.S. */}
      {isConfirmFinalizeOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-500 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="text-lg font-black text-center text-white mb-2">
              Confirmar Finalização da O.S.?
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Esta ação irá consolidar as peças utilizadas no estoque, calcular comissões do mecânico e registrar o fechamento financeiro no valor de <strong className="text-rose-400 font-black">{formatBRL(financialTotals.grandTotal)}</strong>.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmFinalizeOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-colors"
              >
                Voltar e Revisar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsConfirmFinalizeOpen(false);
                  await handleCompleteOS();
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-lg transition-colors"
              >
                Sim, Finalizar O.S.
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OSFormModal;

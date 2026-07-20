import React, { useEffect, useState } from 'react';
import { 
  X, User, Calendar, Phone, DollarSign, CreditCard, Bike, Clock, 
  History, FileText, Wrench, ShieldAlert, Sparkles, Send, Copy, 
  ArrowRight, MessageSquare, Plus, AlertCircle, CheckCircle, FileUp,
  ShoppingCart, TrendingUp
} from 'lucide-react';

interface Moto {
  id: number;
  plate: string;
  model: string;
  current_km: number;
  created_at: string;
}

interface QuoteItem {
  id: number;
  description: string;
  price: number;
  quantity: number;
}

interface Quote {
  id: number;
  customer_name: string;
  motorcycle_details: string;
  total_value: number;
  status: string;
  created_at: string;
  items: QuoteItem[];
}

interface SaleItem {
  id: number;
  description: string;
  price: number;
  quantity: number;
  type?: string;
}

interface Sale {
  id: number;
  total: number;
  type: string; // 'Balcão' or 'Oficina'
  date: string;
  items: SaleItem[];
}

interface Credit {
  id: number;
  description: string;
  original_value: number;
  due_date: string;
  status: 'Aberto' | 'Pago' | 'Atrasado';
}

interface Conversa {
  id: number;
  sender: string;
  message: string;
  created_at: string;
}

interface Atendimento {
  id: number;
  status: string;
  last_contact: string;
  conversas: Conversa[];
}

interface FinancialSummary {
  totalSpent: number;
  totalOficina: number;
  totalPecas: number;
  buyCount: number;
  ticketMedio: number;
  limiteUtilizado: number;
  valorEmAberto: number;
  ultimaCompraDate: string | null;
  ultimaVisitaDate: string | null;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf_cnpj: string;
  cidade: string;
  endereco: string;
  modelo_moto?: string;
  ano_moto?: string;
  placa_moto?: string;
  observacoes?: string;
  status: string;
  created_at: string;
  credit_limit: number;
}

interface Cliente360Data {
  cliente: Cliente;
  motos: Moto[];
  quotes: Quote[];
  sales: Sale[];
  credits: Credit[];
  atendimentos: Atendimento[];
  financialSummary: FinancialSummary;
}

interface Cliente360ModalProps {
  clienteId: number;
  onClose: () => void;
  formatBRL: (v: number) => string;
  onTriggerPDV: (cliente: any) => void;
  onTriggerOS: (cliente: any, moto: any) => void;
  onTriggerQuote: (cliente: any) => void;
}

export default function Cliente360Modal({
  clienteId,
  onClose,
  formatBRL,
  onTriggerPDV,
  onTriggerOS,
  onTriggerQuote
}: Cliente360ModalProps) {
  const [data, setData] = useState<Cliente360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'timeline' | 'financeiro' | 'ia'>('geral');

  // AI panel states
  const [aiStatus, setAiStatus] = useState<string>('Buscando status...');
  const [aiOnline, setAiOnline] = useState<boolean>(false);
  const [aiText, setAiText] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [askingAi, setAskingAi] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<string>('pos_venda');

  // New motorcycle form states
  const [showAddMoto, setShowAddMoto] = useState(false);
  const [newMotoPlate, setNewMotoPlate] = useState('');
  const [newMotoModel, setNewMotoModel] = useState('');
  const [newMotoKm, setNewMotoKm] = useState('0');
  const [addingMoto, setAddingMoto] = useState(false);

  // Quick Action confirmation modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'pdv' | 'os' | 'quote';
    title: string;
    description: string;
    param?: any;
  } | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetch360Data = () => {
    setLoading(true);
    fetch(`/api/clientes/${clienteId}/360`, { headers: getHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar dados do cliente.');
        return res.json();
      })
      .then((data: Cliente360Data) => {
        setData(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch360Data();
  }, [clienteId]);

  // Handle adding a new motorcycle
  const handleAddMotorcycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMotoPlate.trim() || !newMotoModel.trim()) {
      alert("Por favor, preencha placa e modelo.");
      return;
    }
    setAddingMoto(true);
    fetch('/api/motorcycles', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customer_id: clienteId,
        plate: newMotoPlate,
        model: newMotoModel,
        current_km: parseInt(newMotoKm) || 0
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao cadastrar motocicleta');
        return res.json();
      })
      .then(() => {
        setNewMotoPlate('');
        setNewMotoModel('');
        setNewMotoKm('0');
        setShowAddMoto(false);
        setAddingMoto(false);
        fetch360Data(); // reload
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
        setAddingMoto(false);
      });
  };

  // Call IA Kombat endpoint (analisar / perguntar)
  const askAi = (action: 'resumo' | 'oportunidades' | 'diagnostico' | 'recomendacoes' | 'whatsapp' | 'custom', customQueryText?: string) => {
    setAskingAi(true);
    setAiText('IA Kombat está processando e consolidando o histórico... Por favor, aguarde.');

    const isCustom = action === 'custom';
    const endpoint = isCustom ? '/api/ai/perguntar' : '/api/ai/analisar';
    const body = isCustom 
      ? { cliente_id: clienteId, pergunta: customQueryText }
      : { cliente_id: clienteId, acao: action, param: action === 'whatsapp' ? messageType : undefined };

    fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(resData => {
        setAiText(resData.text || 'Nenhuma resposta recebida.');
        setAiStatus(resData.status || 'IA Offline');
        setAiOnline(resData.origem === 'Gemini');
        setAskingAi(false);
      })
      .catch(err => {
        console.error(err);
        setAiText('Erro ao obter resposta da IA. Verifique sua conexão com o servidor.');
        setAiStatus('Erro na IA');
        setAskingAi(false);
      });
  };

  // Copy AI response to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(aiText);
    alert('Mensagem copiada para a área de transferência!');
  };

  // Send WhatsApp manually
  const handleSendWhatsApp = () => {
    if (!data?.cliente.telefone) {
      alert('Telefone do cliente não cadastrado.');
      return;
    }
    const cleanPhone = data.cliente.telefone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(aiText)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md p-6 text-center bg-zinc-900 border border-red-800 rounded-xl shadow-2xl">
          <div className="inline-block w-12 h-12 border-4 border-red-600 rounded-full border-t-transparent animate-spin mb-4"></div>
          <p className="text-lg text-zinc-100 font-semibold">Carregando Central do Cliente 360°...</p>
          <p className="text-sm text-zinc-400 mt-1">Buscando histórico, motos e finanças na Kombat...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md p-6 bg-zinc-900 border border-red-800 rounded-xl shadow-2xl">
          <div className="flex items-center space-x-3 text-red-500 mb-4">
            <ShieldAlert size={28} />
            <h3 className="text-lg font-bold">Erro no Sistema 360°</h3>
          </div>
          <p className="text-zinc-200 mb-6">{error || 'Dados do cliente indisponíveis.'}</p>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { cliente, motos, quotes, sales, credits, atendimentos, financialSummary } = data;

  // Build the Unified Timeline array
  const timelineItems: Array<{
    id: string | number;
    type: 'compra' | 'os' | 'orcamento' | 'cobranca' | 'conversa';
    title: string;
    description: string;
    date: Date;
    rawDate: string;
    value?: number;
    badgeColor: string;
    details?: any;
  }> = [];

  sales.forEach(s => {
    timelineItems.push({
      id: `sale-${s.id}`,
      type: 'compra',
      title: s.type === 'Oficina' ? 'Ordem de Serviço Concluída' : 'Venda Balcão',
      description: `Produtos comprados: ${(s.items || []).map((i: any) => `${i.quantity}x ${i.description}`).join(', ') || 'Nenhum item'}`,
      date: new Date(s.date),
      rawDate: s.date,
      value: s.total,
      badgeColor: 'bg-green-600/20 text-green-400 border-green-500/30'
    });
  });

  quotes.forEach(q => {
    timelineItems.push({
      id: `quote-${q.id}`,
      type: 'orcamento',
      title: `Orçamento de Motopeças (${q.status})`,
      description: `Detalhes: ${(q.items || []).map((i: any) => `${i.quantity}x ${i.description}`).join(', ') || 'Sem itens'}. ${q.motorcycle_details ? `Moto: ${q.motorcycle_details}` : ''}`,
      date: new Date(q.created_at),
      rawDate: q.created_at,
      value: q.total_value,
      badgeColor: 'bg-purple-600/20 text-purple-400 border-purple-500/30'
    });
  });

  credits.forEach(c => {
    timelineItems.push({
      id: `credit-${c.id}`,
      type: 'cobranca',
      title: `Cobrança - ${c.description} (${c.status})`,
      description: `Vencimento: ${new Date(c.due_date).toLocaleDateString('pt-BR')}`,
      date: new Date(c.due_date),
      rawDate: c.due_date,
      value: c.original_value,
      badgeColor: c.status === 'Atrasado' 
        ? 'bg-red-600/20 text-red-400 border-red-500/30' 
        : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
    });
  });

  atendimentos.forEach(a => {
    const lastMsg = a.conversas && a.conversas.length > 0 ? a.conversas[a.conversas.length - 1].message : 'Nenhuma conversa ativa';
    timelineItems.push({
      id: `atend-${a.id}`,
      type: 'conversa',
      title: `Atendimento / WhatsApp (${a.status})`,
      description: `Último contato: ${lastMsg}`,
      date: new Date(a.last_contact),
      rawDate: a.last_contact,
      badgeColor: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30'
    });
  });

  // Sort timeline by date descending
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Confirm and execute the callback actions
  const triggerQuickAction = (type: 'pdv' | 'os' | 'quote', moto?: any) => {
    if (type === 'pdv') {
      onTriggerPDV({
        id: cliente.id,
        name: cliente.nome,
        cpf: cliente.cpf_cnpj,
        whatsapp: cliente.telefone
      });
    } else if (type === 'os') {
      onTriggerOS({
        id: cliente.id,
        name: cliente.nome,
        cpf: cliente.cpf_cnpj,
        whatsapp: cliente.telefone
      }, moto || (motos.length > 0 ? motos[0] : null));
    } else if (type === 'quote') {
      onTriggerQuote({
        id: cliente.id,
        name: cliente.nome,
        cpf: cliente.cpf_cnpj,
        whatsapp: cliente.telefone
      });
    }
    setConfirmAction(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Main Modal Container */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-zinc-950 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 text-zinc-950 rounded-lg">
              <User size={24} className="font-extrabold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{cliente.nome}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  cliente.status === 'VIP' ? 'bg-red-600 text-white animate-pulse' :
                  cliente.status === 'Frequente' ? 'bg-amber-600 text-white' :
                  cliente.status === 'Inativo' ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {cliente.status || 'Novo'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Cliente Kombat ID #{cliente.id} • Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Actions Buttons on Balcao */}
            <button 
              onClick={() => setConfirmAction({
                type: 'pdv',
                title: 'Confirmar Nova Venda Balcão',
                description: `Você deseja abrir o ponto de venda (PDV) para o cliente ${cliente.nome}?`
              })}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
            >
              <CreditCard size={14} />
              <span>Nova Venda</span>
            </button>
            <button 
              onClick={() => setConfirmAction({
                type: 'os',
                title: 'Confirmar Abertura de OS',
                description: `Você deseja iniciar uma Ordem de Serviço na oficina para o cliente ${cliente.nome}?`
              })}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-semibold transition border border-zinc-700"
            >
              <Wrench size={14} />
              <span>Nova OS</span>
            </button>
            <button 
              onClick={() => setConfirmAction({
                type: 'quote',
                title: 'Confirmar Novo Orçamento',
                description: `Você deseja criar um novo orçamento comercial para o cliente ${cliente.nome}?`
              })}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-semibold transition border border-zinc-700"
            >
              <FileText size={14} />
              <span>Novo Orçamento</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 hover:bg-zinc-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-zinc-900/40 border-b border-zinc-800 px-6 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-4 font-semibold text-sm transition relative ${activeTab === 'geral' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Ficha Geral & Motos
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 font-semibold text-sm transition relative ${activeTab === 'timeline' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Linha do Tempo
          </button>
          <button 
            onClick={() => setActiveTab('financeiro')}
            className={`py-3 px-4 font-semibold text-sm transition relative ${activeTab === 'financeiro' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Resumo Financeiro
          </button>
          <button 
            onClick={() => setActiveTab('ia')}
            className={`py-3 px-4 font-semibold text-sm transition relative flex items-center space-x-1.5 ${activeTab === 'ia' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Sparkles size={15} className="text-red-500 animate-pulse" />
            <span>IA Kombat Assistant</span>
          </button>
        </div>

        {/* Modal Body / Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          
          {/* TAB 1: GENERAL & MOTOS */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              
              {/* Client Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* General Data Card */}
                <div className="md:col-span-2 p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2">
                    <User size={16} className="text-red-500" />
                    <span>Dados Cadastrais</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block text-xs">CPF / CNPJ</span>
                      <span className="font-medium text-zinc-200">{cliente.cpf_cnpj || 'Não Informado'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-xs">Telefone / WhatsApp</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-zinc-200">{cliente.telefone}</span>
                        <a 
                          href={`https://api.whatsapp.com/send?phone=55${cliente.telefone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 bg-green-900/20 text-green-400 hover:bg-green-600 hover:text-zinc-950 rounded transition"
                          title="Conversar no WhatsApp"
                        >
                          <Send size={12} />
                        </a>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-zinc-500 block text-xs">Endereço Residencial</span>
                      <span className="font-medium text-zinc-200">
                        {cliente.endereco ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}` : 'Não cadastrado'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-zinc-500 block text-xs">Observações de Atendimento</span>
                      <p className="p-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-400 italic">
                        {cliente.observacoes || 'Nenhuma observação comercial registrada.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Credit Limit Box */}
                <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2 mb-4">
                      <CreditCard size={16} className="text-red-500" />
                      <span>Limite de Crédito</span>
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-zinc-500 text-xs">Limite Total Autorizado</span>
                        <div className="text-2xl font-black text-white">{formatBRL(cliente.credit_limit || 0)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">Valor Total em Aberto (Contas a Receber)</span>
                        <div className="text-lg font-bold text-red-400">{formatBRL(financialSummary.valorEmAberto || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <span className="text-zinc-500 text-xs block">Saldo Disponível para Compra</span>
                    <span className={`text-xl font-bold ${
                      (cliente.credit_limit - financialSummary.valorEmAberto) < 0 ? 'text-red-500' : 'text-green-400'
                    }`}>
                      {formatBRL(Math.max(0, (cliente.credit_limit || 0) - (financialSummary.valorEmAberto || 0)))}
                    </span>
                  </div>
                </div>

              </div>

              {/* Motorcycles Section */}
              <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2">
                    <Bike size={18} className="text-red-500" />
                    <span>Motocicletas Vinculadas ({motos.length})</span>
                  </h3>
                  <button 
                    onClick={() => setShowAddMoto(!showAddMoto)}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Plus size={14} />
                    <span>Nova Moto</span>
                  </button>
                </div>

                {/* Add Moto Form */}
                {showAddMoto && (
                  <form onSubmit={handleAddMotorcycle} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4 items-end animate-fadeIn">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Modelo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Honda CG Titan 160"
                        value={newMotoModel} 
                        onChange={(e) => setNewMotoModel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Placa</label>
                      <input 
                        type="text" 
                        placeholder="Ex: ABC-1234"
                        value={newMotoPlate} 
                        onChange={(e) => setNewMotoPlate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">KM Atual</label>
                      <input 
                        type="number" 
                        value={newMotoKm} 
                        onChange={(e) => setNewMotoKm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        type="submit" 
                        disabled={addingMoto}
                        className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold rounded py-1.5 text-xs transition"
                      >
                        {addingMoto ? 'Salvando...' : 'Cadastrar'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowAddMoto(false)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Motos List */}
                {motos.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-6">Nenhuma moto vinculada a este cliente. Clique em 'Nova Moto' para cadastrar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {motos.map((moto: Moto) => (
                      <div key={moto.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between hover:border-zinc-700 transition">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-white block text-sm">{moto.model}</span>
                            <span className="px-2 py-0.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded text-xs font-mono">{moto.plate}</span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-2 space-y-1">
                            <div>KM Atual: <span className="text-zinc-200 font-medium">{moto.current_km?.toLocaleString('pt-BR') || 0} km</span></div>
                            <div>Cadastrada: <span className="text-zinc-300">{new Date(moto.created_at).toLocaleDateString('pt-BR')}</span></div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-end">
                          <button 
                            onClick={() => setConfirmAction({
                              type: 'os',
                              title: 'Iniciar OS com esta Moto',
                              description: `Deseja abrir uma Ordem de Serviço de oficina para a moto ${moto.model} (Placa: ${moto.plate})?`,
                              param: moto
                            })}
                            className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-400 font-semibold"
                          >
                            <span>Abrir OS Oficina</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: UNIFIED TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2 mb-4">
                <History size={18} className="text-red-500" />
                <span>Linha do Tempo Comercial Única</span>
              </h3>

              {timelineItems.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-12">Nenhum evento no histórico deste cliente.</p>
              ) : (
                <div className="relative border-l-2 border-zinc-800 pl-6 ml-4 space-y-8">
                  {timelineItems.map((item, idx) => (
                    <div key={item.id} className="relative">
                      {/* Timeline Dot/Icon */}
                      <span className={`absolute -left-10 top-0.5 flex items-center justify-center w-8 h-8 rounded-full border ${item.badgeColor}`}>
                        {item.type === 'compra' && <ShoppingCart size={14} />}
                        {item.type === 'orcamento' && <FileText size={14} />}
                        {item.type === 'cobranca' && <DollarSign size={14} />}
                        {item.type === 'conversa' && <MessageSquare size={14} />}
                        {item.type === 'os' && <Wrench size={14} />}
                      </span>

                      {/* Event Card */}
                      <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 transition">
                        <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <span className="text-xs text-zinc-500 font-mono">
                            {new Date(item.rawDate).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-2">{item.description}</p>
                        
                        {item.value !== undefined && (
                          <div className="text-xs font-semibold text-zinc-400">
                            Valor Financeiro: <span className="text-white font-bold">{formatBRL(item.value)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCIAL RESUME */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6">
              
              {/* Financial Stats Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-500 text-xs uppercase font-semibold">Total Loja</span>
                  <div className="text-xl font-bold text-white mt-1">{formatBRL(financialSummary.totalSpent || 0)}</div>
                  <span className="text-[10px] text-zinc-400">Compras no balcão + oficina</span>
                </div>

                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-500 text-xs uppercase font-semibold">Gasto Oficina</span>
                  <div className="text-xl font-bold text-blue-400 mt-1">{formatBRL(financialSummary.totalOficina || 0)}</div>
                  <span className="text-[10px] text-zinc-400">Serviços e mão de obra</span>
                </div>

                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-500 text-xs uppercase font-semibold">Gasto Motopeças</span>
                  <div className="text-xl font-bold text-green-400 mt-1">{formatBRL(financialSummary.totalPecas || 0)}</div>
                  <span className="text-[10px] text-zinc-400">Apenas peças compradas</span>
                </div>

                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-500 text-xs uppercase font-semibold">Ticket Médio</span>
                  <div className="text-xl font-bold text-red-500 mt-1">{formatBRL(financialSummary.ticketMedio || 0)}</div>
                  <span className="text-[10px] text-zinc-400">Gasto médio por visita</span>
                </div>

              </div>

              {/* Extra Summary details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Summary list */}
                <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3 text-sm">
                  <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">Resumo Geral de Vendas</h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Quantidade de Compras:</span>
                    <span className="font-semibold text-zinc-200">{financialSummary.buyCount || 0} visitas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Última Compra Registrada:</span>
                    <span className="font-semibold text-zinc-200">
                      {financialSummary.ultimaCompraDate ? new Date(financialSummary.ultimaCompraDate).toLocaleDateString('pt-BR') : 'Nenhuma compra registrada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Último Contato CRM:</span>
                    <span className="font-semibold text-zinc-200">
                      {financialSummary.ultimaVisitaDate ? new Date(financialSummary.ultimaVisitaDate).toLocaleDateString('pt-BR') : 'Sem visitas catalogadas'}
                    </span>
                  </div>
                </div>

                {/* Financial limit status */}
                <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-4 text-sm">
                  <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">Status Financeiro e Crédito</h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Limite de Crediário Kombat:</span>
                    <span className="font-semibold text-zinc-200">{formatBRL(cliente.credit_limit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Limite Utilizado (Débitos pendentes):</span>
                    <span className="font-semibold text-red-400">{formatBRL(financialSummary.valorEmAberto || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-800 font-bold">
                    <span>Crédito Disponível:</span>
                    <span className="text-green-400">{formatBRL(Math.max(0, (cliente.credit_limit || 0) - (financialSummary.valorEmAberto || 0)))}</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: AI KOMBAT PANEL */}
          {activeTab === 'ia' && (
            <div className="space-y-6">
              
              {/* IA Assistant Header Status */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-600/10 text-red-500 rounded-lg">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">IA Kombat Assistant</h4>
                    <p className="text-xs text-zinc-400">Inteligência Comercial Integrada da Kombat Moto Peças</p>
                  </div>
                </div>

                {/* Online / Offline status badge */}
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    aiStatus.includes('Online') ? 'bg-green-500 animate-ping' : 'bg-amber-500 animate-pulse'
                  }`}></span>
                  <span className={`text-xs font-semibold ${
                    aiStatus.includes('Online') ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {aiStatus === 'Buscando status...' ? 'Modo Consultivo' : aiStatus}
                  </span>
                </div>
              </div>

              {/* Split layout: Ask & Quick insights left, editable generated text right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* AI Inputs & Actions */}
                <div className="space-y-5">
                  
                  {/* Ask custom question */}
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Pergunte ao Histórico do Cliente</label>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Ex: Quantas vezes trocou o óleo? Comprou qual pneu?"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                        onKeyDown={(e) => e.key === 'Enter' && customQuestion.trim() && askAi('custom', customQuestion)}
                      />
                      <button 
                        onClick={() => customQuestion.trim() && askAi('custom', customQuestion)}
                        disabled={askingAi || !customQuestion.trim()}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                  {/* Actions quick buttons */}
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Opções de Análise Rápida</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => askAi('resumo')}
                        disabled={askingAi}
                        className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-left hover:border-red-600 hover:bg-red-950/10 transition flex items-center space-x-2"
                      >
                        <FileText size={14} className="text-red-500" />
                        <span>Resumir Histórico</span>
                      </button>
                      <button 
                        onClick={() => askAi('oportunidades')}
                        disabled={askingAi}
                        className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-left hover:border-red-600 hover:bg-red-950/10 transition flex items-center space-x-2"
                      >
                        <TrendingUp size={14} className="text-red-500" />
                        <span>Oportunidades Venda</span>
                      </button>
                      <button 
                        onClick={() => askAi('diagnostico')}
                        disabled={askingAi}
                        className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-left hover:border-red-600 hover:bg-red-950/10 transition flex items-center space-x-2"
                      >
                        <AlertCircle size={14} className="text-red-500" />
                        <span>Diagnóstico Técnico</span>
                      </button>
                      <button 
                        onClick={() => askAi('recomendacoes')}
                        disabled={askingAi}
                        className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-left hover:border-red-600 hover:bg-red-950/10 transition flex items-center space-x-2"
                      >
                        <Bike size={14} className="text-red-500" />
                        <span>Peças Recomendadas</span>
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Draft Generator */}
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Gerador de Mensagem WhatsApp</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">Tipo da Mensagem comercial</span>
                        <select 
                          value={messageType} 
                          onChange={(e) => setMessageType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-600"
                        >
                          <option value="pos_venda">Pós-venda (Agradecimento)</option>
                          <option value="orcamento">Cobrar Orçamento Pendente</option>
                          <option value="cobranca">Cobrança de Débito Pendente</option>
                          <option value="moto_pronta">Aviso: Moto Pronta (Oficina)</option>
                          <option value="promocao">Ofertas e Promoção de Peças</option>
                          <option value="retorno">Retorno de Cliente Ausente</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => askAi('whatsapp')}
                        disabled={askingAi}
                        className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded text-xs transition border border-zinc-700 flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles size={13} className="text-red-500" />
                        <span>Gerar Mensagem</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Generated response & review area */}
                <div className="flex flex-col h-full min-h-[350px] p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                      <FileUp size={14} className="text-red-500" />
                      <span>Rascunho Comercial Gerado (Revisão Obrigatória)</span>
                    </label>
                    {aiText && (
                      <div className="flex space-x-1.5">
                        <button 
                          onClick={handleCopyText}
                          className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-850 transition"
                          title="Copiar texto"
                        >
                          <Copy size={13} />
                        </button>
                        <button 
                          onClick={handleSendWhatsApp}
                          className="p-1.5 bg-green-900/30 text-green-400 hover:bg-green-600 hover:text-zinc-950 rounded border border-green-800/40 transition"
                          title="Enviar pelo WhatsApp"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea 
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="O rascunho de WhatsApp ou resultado da análise IA aparecerá aqui. Você pode editar o texto livremente antes de enviar para o cliente."
                    className="w-full flex-1 min-h-[220px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-600 resize-none font-sans leading-relaxed"
                  />

                  <div className="mt-3 text-[10px] text-zinc-500 italic leading-snug flex items-start space-x-1">
                    <AlertCircle size={10} className="text-red-500 shrink-0 mt-0.5" />
                    <span>A IA Kombat funciona apenas de forma consultiva. Toda mensagem gerada deve ser revisada e enviada manualmente pelo atendente da loja no balcão.</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* QUICK ACTION CONFIRMATION MODAL OVERLAY */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-zinc-900 border border-red-800 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-red-500">
              <AlertCircle size={24} />
              <h3 className="text-base font-bold text-white">{confirmAction.title}</h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">{confirmAction.description}</p>
            
            <div className="flex space-x-2 pt-2">
              <button 
                onClick={() => triggerQuickAction(confirmAction.type, confirmAction.param)}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-xs transition"
              >
                Confirmar
              </button>
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2 rounded-lg text-xs transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

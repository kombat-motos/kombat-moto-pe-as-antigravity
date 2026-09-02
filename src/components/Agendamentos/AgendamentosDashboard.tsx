import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Plus, Search, MapPin, Settings, AlertCircle, Wrench, X, History, FileText } from 'lucide-react';
import { MotoCard } from './MotoCard';
import { AgendamentoModal } from './AgendamentoModal';
import { AgendamentoTimeline } from './AgendamentoTimeline';


export const AgendamentosDashboard = ({ customers, motorcycles, fetchCustomers, fetchMotorcycles }: any) => {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [filter, setFilter] = useState('Na Oficina');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAg, setEditingAg] = useState<any>(null);
  
  // Detalhes do modal lateral
  const [selectedAg, setSelectedAg] = useState<any>(null);

  const fetchAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      // Pass the filter down to the server to limit data, or just fetch all and filter in frontend.
      // We will fetch all and filter frontend to make metrics easier, except maybe for 'Todos' if it's too big.
      const res = await fetch(`/api/agendamentos?status=Todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar agendamentos', err);
      setAgendamentos([]);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/api/agendamentos/${data.id}` : '/api/agendamentos';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        alert(data.id ? 'Atualizado!' : 'Criado com sucesso!');
        setShowModal(false);
        fetchAgendamentos();
        if (selectedAg && selectedAg.id === data.id) setSelectedAg(null); // Close sidebar on edit to refresh
      }
    } catch (err) {
      alert('Erro ao salvar');
    }
  };

  const handleStatusChange = async (id: number, novoStatus: string, motivo: string = '', isEntrada = false, isSaida = false) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agendamentos/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: novoStatus, 
          motivo_paralisacao: motivo,
          isEntrada,
          isSaida,
          tipo_saida: isSaida ? 'Cliente Retirou' : null,
          responsavel_saida: 'Sistema' // would be current user
        })
      });
      
      if (res.ok) {
        alert(`Status atualizado para ${novoStatus}`);
        fetchAgendamentos();
        if (selectedAg && selectedAg.id === id) {
           setSelectedAg({...selectedAg, status: novoStatus});
        }
      }
    } catch (err) {
      alert('Erro ao mudar status');
    }
  };

  const createOS = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agendamentos/${id}/os`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Ordem de Serviço criada: #${data.sale_id}`);
        fetchAgendamentos();
        if (selectedAg) setSelectedAg({...selectedAg, sale_id: data.sale_id});
      } else {
        alert(data.error || 'Erro ao criar OS');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
  };

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      agendadosHoje: agendamentos.filter(a => a.data_agendamento === today && a.status === 'AGENDADA').length,
      paraBuscar: agendamentos.filter(a => a.modo_chegada === 'KOMBAT_BUSCA' && ['AGENDADA', 'AGUARDANDO BUSCA', 'SAINDO PARA BUSCAR'].includes(a.status)).length,
      naOficina: agendamentos.filter(a => a.data_entrada && !a.data_saida).length, // Real rule: in patio
      aguardandoServico: agendamentos.filter(a => ['RECEBIDA NA OFICINA', 'AGUARDANDO AVALIAÇÃO', 'AGUARDANDO APROVAÇÃO DO CLIENTE', 'AGUARDANDO SERVIÇO'].includes(a.status)).length,
      emServico: agendamentos.filter(a => a.status === 'EM SERVIÇO').length,
      aguardandoPeca: agendamentos.filter(a => a.status === 'AGUARDANDO PEÇA').length,
      prontas: agendamentos.filter(a => a.status === 'PRONTA' || a.status === 'AGUARDANDO RETIRADA').length,
      paraEntregar: agendamentos.filter(a => a.status === 'PARA ENTREGAR').length,
      atrasadas: agendamentos.filter(a => a.previsao_conclusao && new Date(a.previsao_conclusao) < new Date() && !['PRONTA', 'ENTREGUE / FINALIZADA', 'CANCELADA'].includes(a.status)).length
    };
  }, [agendamentos]);

  const filteredList = useMemo(() => {
    let list = agendamentos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(a => 
        a.customer_name?.toLowerCase().includes(lower) || 
        a.moto_plate?.toLowerCase().includes(lower) ||
        a.moto_model?.toLowerCase().includes(lower)
      );
    }
    
    switch(filter) {
      case 'Hoje':
        list = list.filter(a => a.data_agendamento === new Date().toISOString().split('T')[0]); break;
      case 'Para Buscar':
        list = list.filter(a => a.modo_chegada === 'KOMBAT_BUSCA' && ['AGENDADA', 'AGUARDANDO BUSCA', 'SAINDO PARA BUSCAR'].includes(a.status)); break;
      case 'Na Oficina':
        list = list.filter(a => a.data_entrada && !a.data_saida); break;
      case 'Aguardando Peça':
        list = list.filter(a => a.status === 'AGUARDANDO PEÇA'); break;
      case 'Em Serviço':
        list = list.filter(a => a.status === 'EM SERVIÇO'); break;
      case 'Prontas':
        list = list.filter(a => a.status === 'PRONTA' || a.status === 'AGUARDANDO RETIRADA'); break;
      case 'Atrasadas':
        list = list.filter(a => a.previsao_conclusao && new Date(a.previsao_conclusao) < new Date() && !['PRONTA', 'ENTREGUE / FINALIZADA', 'CANCELADA'].includes(a.status)); break;
    }
    return list;
  }, [agendamentos, filter, searchTerm]);

  return (
    <div className="flex h-screen bg-slate-50 relative">
      {/* MAIN CONTENT */}
      <div className={`flex-1 p-8 overflow-y-auto transition-all ${selectedAg ? 'pr-[400px]' : ''}`}>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agendamentos & Oficina</h1>
            <p className="text-slate-500 font-medium">Controle de entrada, serviços e entrega de motos.</p>
          </div>
          <button 
            onClick={() => { setEditingAg(null); setShowModal(true); }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
          >
            <Plus size={20} /> NOVO AGENDAMENTO
          </button>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard title="Agendados Hoje" value={metrics.agendadosHoje} color="bg-blue-50 text-blue-600" />
          <MetricCard title="Para Buscar" value={metrics.paraBuscar} color="bg-sky-50 text-sky-600" alert={metrics.paraBuscar > 0} />
          <MetricCard title="Na Oficina" value={metrics.naOficina} color="bg-purple-50 text-purple-600 border-purple-200" standout />
          <MetricCard title="Aguardando Serv." value={metrics.aguardandoServico} color="bg-orange-50 text-orange-600" />
          <MetricCard title="Em Serviço" value={metrics.emServico} color="bg-indigo-50 text-indigo-600" />
          <MetricCard title="Aguardando Peça" value={metrics.aguardandoPeca} color="bg-rose-50 text-rose-600" alert={metrics.aguardandoPeca > 0} />
          <MetricCard title="Prontas" value={metrics.prontas} color="bg-emerald-50 text-emerald-600" alert={metrics.prontas > 0} />
          <MetricCard title="Para Entregar" value={metrics.paraEntregar} color="bg-teal-50 text-teal-600" />
          <MetricCard title="Atrasadas" value={metrics.atrasadas} color="bg-red-50 text-red-600" alert={metrics.atrasadas > 0} />
        </div>

        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {['Todos', 'Hoje', 'Na Oficina', 'Para Buscar', 'Aguardando Peça', 'Em Serviço', 'Prontas', 'Atrasadas'].map(f => (
              <button 
                key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="Buscar placa, cliente..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map(ag => (
            <MotoCard 
              key={ag.id} 
              agendamento={ag} 
              onClick={() => setSelectedAg(ag)}
              onWhatsApp={(phone, msg) => window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')}
            />
          ))}
          {filteredList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              Nenhum registro encontrado para este filtro.
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR DE DETALHES */}
      {selectedAg && (
        <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col animate-slide-left">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Wrench size={20} /> Detalhes da Moto
            </h2>
            <button onClick={() => setSelectedAg(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Header info */}
            <div>
              <h3 className="text-2xl font-black text-slate-800">{selectedAg.moto_model || 'Moto não informada'}</h3>
              <p className="text-lg font-bold text-slate-500 mb-1">{selectedAg.moto_plate || 'Sem placa'}</p>
              <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                👤 {selectedAg.customer_name}
              </p>
            </div>

            {/* Ações de Status */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Mudar Status</p>
              <div className="grid grid-cols-2 gap-2">
                {!selectedAg.data_entrada && (
                  <button onClick={() => handleStatusChange(selectedAg.id, 'RECEBIDA NA OFICINA', '', true, false)} className="p-2 text-xs font-bold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                    📥 Marcar Entrada
                  </button>
                )}
                {selectedAg.data_entrada && !selectedAg.data_saida && (
                   <button onClick={() => handleStatusChange(selectedAg.id, 'ENTREGUE / FINALIZADA', '', false, true)} className="p-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                    📤 Registrar Saída
                  </button>
                )}
                <button onClick={() => handleStatusChange(selectedAg.id, 'EM SERVIÇO')} className="p-2 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">🔧 Em Serviço</button>
                <button onClick={() => handleStatusChange(selectedAg.id, 'AGUARDANDO PEÇA', 'Falta peça')} className="p-2 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">📦 Aguard. Peça</button>
                <button onClick={() => handleStatusChange(selectedAg.id, 'PRONTA')} className="p-2 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">✅ Pronta</button>
              </div>
            </div>

            {/* Integração OS */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
               <p className="text-[10px] font-black uppercase text-emerald-700 mb-3">Integração Oficina</p>
               {selectedAg.sale_id ? (
                 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
                   <div className="flex items-center gap-2 text-emerald-700 font-bold">
                     <FileText size={16} /> OS #{selectedAg.sale_id}
                   </div>
                   {/* Aqui você pode adicionar um link para abrir a OS, se houver lógica no app principal */}
                   <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Vinculada</span>
                 </div>
               ) : (
                 <button onClick={() => createOS(selectedAg.id)} className="w-full p-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow flex items-center justify-center gap-2">
                   <FileText size={18} /> CRIAR ORDEM DE SERVIÇO
                 </button>
               )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">O que o cliente pediu</p>
                <p className="text-sm text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-200">{selectedAg.solicitacao_cliente || 'Nenhuma solicitação.'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Histórico</p>
                <div className="bg-white p-4 rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                  <AgendamentoTimeline agendamentoId={selectedAg.id} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <button onClick={() => { setEditingAg(selectedAg); setShowModal(true); }} className="flex-1 py-3 text-sm font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
              Editar Dados
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <AgendamentoModal 
          agendamento={editingAg}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          customers={customers}
          fetchCustomers={fetchCustomers}
          motorcycles={motorcycles}
          fetchMotorcycles={fetchMotorcycles}
        />
      )}
    </div>
  );
};

const MetricCard = ({ title, value, color, alert, standout }: any) => (
  <div className={`p-4 rounded-xl border ${standout ? 'border-2 shadow-md' : 'border-slate-100 shadow-sm'} bg-white relative overflow-hidden`}>
    {alert && <div className="absolute top-0 right-0 w-2 h-2 m-3 rounded-full bg-rose-500 animate-pulse" />}
    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{title}</p>
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center font-black text-lg`}>
        {value}
      </div>
    </div>
  </div>
);

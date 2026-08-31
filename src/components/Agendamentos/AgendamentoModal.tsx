import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Wrench, Search, AlertCircle, Save } from 'lucide-react';


export const AgendamentoModal = ({ agendamento, onClose, onSave, customers, fetchCustomers, motorcycles, fetchMotorcycles }: any) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    motorcycle_id: '',
    data_agendamento: new Date().toISOString().split('T')[0],
    horario_agendamento: '',
    previsao_conclusao: '',
    prioridade: 'NORMAL',
    modo_chegada: 'CLIENTE_LEVA',
    endereco_busca: '',
    bairro_busca: '',
    cidade_busca: '',
    referencia_busca: '',
    responsavel_busca: '',
    solicitacao_cliente: '',
    observacoes_internas: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Moto state
  const [showNewMoto, setShowNewMoto] = useState(false);
  const [newMoto, setNewMoto] = useState({ plate: '', model: '', brand: '', year: '', color: '', chassis: '', current_km: 0 });

  useEffect(() => {
    if (agendamento) {
      setFormData({
        ...agendamento,
        data_agendamento: agendamento.data_agendamento || new Date().toISOString().split('T')[0],
      });
      const client = customers.find((c: any) => c.id === agendamento.cliente_id);
      if (client) setSearchTerm(client.name);
    }
  }, [agendamento]);

  const filteredCustomers = customers.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cpf && c.cpf.includes(searchTerm)) ||
    (c.whatsapp && c.whatsapp.includes(searchTerm))
  ).slice(0, 5);

  const clientMotos = motorcycles.filter((m: any) => m.customer_id === Number(formData.cliente_id));

  const handleCreateMoto = async () => {
    if (!newMoto.plate || !newMoto.model) {
      alert('Placa e Modelo são obrigatórios');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/crm/motorcycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newMoto, customer_id: formData.cliente_id })
      });
      
      if (res.ok) {
        alert("Moto adicionada!");
        await fetchMotorcycles();
        setShowNewMoto(false);
      } else {
        alert("Erro ao adicionar moto");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id) return alert("Selecione um cliente");
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Preencha os dados do cliente e da moto</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
          {/* CLIENT SECTION */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
              <Search size={14} /> Busca de Cliente
            </h3>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Busque por Nome, CPF ou WhatsApp..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-bold"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (formData.cliente_id) setFormData({ ...formData, cliente_id: '', motorcycle_id: '' });
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
              
              {showDropdown && searchTerm && !formData.cliente_id && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, cliente_id: c.id });
                          setSearchTerm(c.name);
                          setShowDropdown(false);
                        }}
                      >
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{c.whatsapp} • {c.cpf || 'Sem CPF'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 font-medium text-sm">Nenhum cliente encontrado. Cadastre-o no CRM primeiro.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MOTO SECTION */}
          {formData.cliente_id && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
               <h3 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
                <Wrench size={14} /> Veículo do Cliente
              </h3>
              
              <select
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-rose-500 mb-4"
                value={formData.motorcycle_id}
                onChange={(e) => {
                  if (e.target.value === 'new') setShowNewMoto(true);
                  else {
                    setFormData({ ...formData, motorcycle_id: e.target.value });
                    setShowNewMoto(false);
                  }
                }}
              >
                <option value="">Selecione a Moto...</option>
                {clientMotos.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.brand} {m.model} - {m.plate}</option>
                ))}
                <option value="new">+ Cadastrar Nova Moto</option>
              </select>

              {showNewMoto && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Placa *" className="p-2 border rounded-lg" value={newMoto.plate} onChange={e => setNewMoto({...newMoto, plate: e.target.value})} />
                  <input type="text" placeholder="Modelo *" className="p-2 border rounded-lg" value={newMoto.model} onChange={e => setNewMoto({...newMoto, model: e.target.value})} />
                  <input type="text" placeholder="Marca" className="p-2 border rounded-lg" value={newMoto.brand} onChange={e => setNewMoto({...newMoto, brand: e.target.value})} />
                  <input type="text" placeholder="Ano" className="p-2 border rounded-lg" value={newMoto.year} onChange={e => setNewMoto({...newMoto, year: e.target.value})} />
                  <input type="text" placeholder="Cor" className="p-2 border rounded-lg" value={newMoto.color} onChange={e => setNewMoto({...newMoto, color: e.target.value})} />
                  <input type="text" placeholder="Chassi" className="p-2 border rounded-lg" value={newMoto.chassis} onChange={e => setNewMoto({...newMoto, chassis: e.target.value})} />
                  <button type="button" onClick={handleCreateMoto} className="col-span-full bg-slate-800 text-white font-bold py-2 rounded-lg hover:bg-slate-700">
                    Salvar Nova Moto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DATETIME SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Data do Agendamento</label>
              <input type="date" className="w-full p-3 border border-slate-300 rounded-xl font-bold" required value={formData.data_agendamento} onChange={e => setFormData({...formData, data_agendamento: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Horário</label>
              <input type="time" className="w-full p-3 border border-slate-300 rounded-xl font-bold" value={formData.horario_agendamento} onChange={e => setFormData({...formData, horario_agendamento: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Prioridade</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl font-bold" value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value})}>
                <option value="NORMAL">NORMAL</option>
                <option value="URGENTE">URGENTE</option>
              </select>
            </div>
          </div>

          {/* TRANSPORT SECTION */}
          <div className="bg-sky-50/50 p-6 rounded-xl border border-sky-100">
            <h3 className="text-xs font-black uppercase text-sky-700 mb-4">Como a moto chegará?</h3>
            <div className="flex gap-4 mb-4">
              <button type="button" onClick={() => setFormData({...formData, modo_chegada: 'CLIENTE_LEVA'})} className={`flex-1 p-3 rounded-xl font-bold transition-all border ${formData.modo_chegada === 'CLIENTE_LEVA' ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}>
                CLIENTE VAI LEVAR
              </button>
              <button type="button" onClick={() => setFormData({...formData, modo_chegada: 'KOMBAT_BUSCA'})} className={`flex-1 p-3 rounded-xl font-bold transition-all border ${formData.modo_chegada === 'KOMBAT_BUSCA' ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}>
                KOMBAT VAI BUSCAR
              </button>
            </div>

            {formData.modo_chegada === 'KOMBAT_BUSCA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-sky-200">
                <input type="text" placeholder="Endereço Completo" className="col-span-full p-3 border rounded-lg" value={formData.endereco_busca} onChange={e => setFormData({...formData, endereco_busca: e.target.value})} />
                <input type="text" placeholder="Bairro" className="p-3 border rounded-lg" value={formData.bairro_busca} onChange={e => setFormData({...formData, bairro_busca: e.target.value})} />
                <input type="text" placeholder="Ponto de Referência" className="p-3 border rounded-lg" value={formData.referencia_busca} onChange={e => setFormData({...formData, referencia_busca: e.target.value})} />
                <input type="text" placeholder="Responsável pela busca" className="col-span-full p-3 border rounded-lg" value={formData.responsavel_busca} onChange={e => setFormData({...formData, responsavel_busca: e.target.value})} />
              </div>
            )}
          </div>

          {/* TEXT AREAS */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-2">📝 O que o cliente pediu para fazer:</label>
            <textarea 
              className="w-full p-4 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 h-24 resize-none"
              placeholder="Ex: Trocar óleo, verificar freio..."
              value={formData.solicitacao_cliente}
              onChange={e => setFormData({...formData, solicitacao_cliente: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Observações Internas</label>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 h-16 resize-none"
              placeholder="Anotações apenas para a equipe..."
              value={formData.observacoes_internas}
              onChange={e => setFormData({...formData, observacoes_internas: e.target.value})}
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 flex items-center gap-2 transition-all">
            <Save size={18} /> Salvar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
};

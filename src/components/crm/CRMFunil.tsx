import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, Pencil, Trash2, Send, 
  Bike, Tag, AlertTriangle, ArrowRight, DollarSign 
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  company: string; // Used for Motorcycle details
  interest?: string; // Piece/Service sought
  value: number;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Novo' | 'Em atendimento' | 'Aguardando cliente' | 'Orçamento enviado' | 'Negociação' | 'Aprovado' | 'Venda concluída' | 'Perdido' | 'Pós-venda';
}

interface CRMFunilProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  onUpdateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onSendWhatsApp: (phone: string, text: string) => void;
  formatBRL: (v: number) => string;
}

const STAGES: Lead['status'][] = [
  'Novo', 'Em atendimento', 'Aguardando cliente', 
  'Orçamento enviado', 'Negociação', 'Aprovado', 
  'Venda concluída', 'Perdido', 'Pós-venda'
];

export default function CRMFunil({
  leads,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onSendWhatsApp,
  formatBRL
}: CRMFunilProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMoto, setFormMoto] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formPriority, setFormPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [formStatus, setFormStatus] = useState<Lead['status']>('Novo');

  const handleOpenAddModal = () => {
    setEditingLead(null);
    setFormName('');
    setFormPhone('');
    setFormMoto('');
    setFormInterest('');
    setFormValue('');
    setFormPriority('Média');
    setFormStatus('Novo');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormPhone(lead.phone || '');
    setFormMoto(lead.company || '');
    setFormInterest(lead.interest || '');
    setFormValue(String(lead.value));
    setFormPriority(lead.priority);
    setFormStatus(lead.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValue) || 0;

    const payload = {
      name: formName,
      phone: formPhone,
      company: formMoto,
      interest: formInterest,
      value: val,
      priority: formPriority,
      status: formStatus
    };

    if (editingLead) {
      await onUpdateLead(editingLead.id, payload);
    } else {
      await onAddLead(payload);
    }
    setIsModalOpen(false);
  };

  const handleMoveStatus = async (id: string, newStatus: Lead['status']) => {
    await onUpdateLead(id, { status: newStatus });
  };

  const handleStartWhatsApp = (lead: Lead) => {
    const msg = `Olá, ${lead.name}! Tudo bem? Sou da Kombat Moto Peças. Vi que está procurando ${lead.interest || 'peças/serviços'} para sua ${lead.company || 'moto'}. Como posso te ajudar hoje? 🏍️`;
    onSendWhatsApp(lead.phone, msg);
  };

  const filteredLeads = leads.filter(l => {
    const term = searchQuery.toLowerCase();
    return (
      (l.name || '').toLowerCase().includes(term) ||
      (l.phone || '').includes(term) ||
      (l.company || '').toLowerCase().includes(term) ||
      (l.interest || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn">
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, moto ou peça..."
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
          <span>Adicionar Lead</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-[500px]">
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => l.status === stage);
          const stageTotal = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-900/10 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[620px]"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{stage}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      {stageLeads.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatBRL(stageTotal)}</p>
                </div>
              </div>

              {/* Card List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[250px]">
                {stageLeads.map(lead => (
                  <motion.div
                    layoutId={String(lead.id)}
                    key={lead.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    {/* Header: Priority & Actions */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        lead.priority === 'Alta' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        lead.priority === 'Média' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        Prioridade {lead.priority}
                      </span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEditModal(lead)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o lead ${lead.name}?`)) onDeleteLead(lead.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={() => handleStartWhatsApp(lead)}
                          className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                          title="Contato WhatsApp"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase truncate">{lead.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Bike size={12} className="text-slate-400" />
                        <span>{lead.company || 'Moto não informada'}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Tag size={12} className="text-slate-400" />
                        <span>Interesse: {lead.interest || 'Peça / Serviço'}</span>
                      </p>
                    </div>

                    {/* Footer: Price and Stage select */}
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2 text-[10px]">
                      <span className="font-black text-rose-600">{formatBRL(lead.value)}</span>
                      <select
                        value={lead.status}
                        onChange={e => handleMoveStatus(lead.id, e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 border-none outline-none font-bold text-[9px] text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="py-8 text-center text-[10px] text-slate-400 italic">
                    Nenhum lead nesta etapa.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                {editingLead ? 'Editar Lead' : 'Novo Lead / Oportunidade'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">WhatsApp/Telefone</label>
                  <input
                    type="text"
                    placeholder="(43) 99999-9999"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Moto (Modelo/Ano)</label>
                  <input
                    type="text"
                    placeholder="Titan 160 2022"
                    value={formMoto}
                    onChange={e => setFormMoto(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Peça ou Serviço Buscado</label>
                  <input
                    type="text"
                    placeholder="Pneu Pirelli / Revisão..."
                    value={formInterest}
                    onChange={e => setFormInterest(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    placeholder="250.00"
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Etapa do Funil</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all text-xs"
              >
                {editingLead ? 'Salvar Alterações' : 'Salvar Novo Lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
const X = ({ size, className, onClick }: any) => (
  <button onClick={onClick} className={className}>
    <XIcon size={size} />
  </button>
);
import { X as XIcon } from 'lucide-react';

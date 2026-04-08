import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Pencil, Trash2, Send } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado';
  phone?: string;
}

interface CRMTabProps {
  leads: Lead[];
  searchTerm: string;
  globalSearchTerm: string;
  setSearchTerm: (s: string) => void;
  setEditingLead: (l: Lead | null) => void;
  setLeadForm: (f: any) => void;
  setIsLeadModalOpen: (open: boolean) => void;
  handleEditLead: (l: Lead) => void;
  handleDeleteLead: (id: string) => void;
  setSelectedLead: (l: Lead) => void;
  setIsMessageModalOpen: (open: boolean) => void;
  formatBRL: (v: number) => string;
  moveLead: (id: string, status: Lead['status']) => void;
}

const CRMTab: React.FC<CRMTabProps> = ({
  leads,
  searchTerm,
  globalSearchTerm,
  setSearchTerm,
  setEditingLead,
  setLeadForm,
  setIsLeadModalOpen,
  handleEditLead,
  handleDeleteLead,
  setSelectedLead,
  setIsMessageModalOpen,
  formatBRL,
  moveLead
}) => {
  const columns: Lead['status'][] = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];
  const filteredLeads = leads.filter(l => {
    const search = (searchTerm + globalSearchTerm).toLowerCase();
    return (
      l.name.toLowerCase().includes(search) ||
      l.company.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CRM de Vendas</h2>
          <p className="text-sm text-slate-500">Gerencie seus leads e negociações</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar leads..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingLead(null);
              setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
              setIsLeadModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Lead
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-[600px]">
        {columns.map(column => (
          <div key={column} className="flex-shrink-0 w-80 bg-slate-50/50 rounded-2xl border border-slate-400 flex flex-col">
            <div className="p-4 border-b border-slate-400 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                {column}
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  {filteredLeads.filter(l => l.status === column).length}
                </span>
              </h3>
              <MoreVertical size={16} className="text-slate-400" />
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              {filteredLeads.filter(l => l.status === column).map(lead => (
                <motion.div
                  layoutId={lead.id}
                  key={lead.id}
                  className="bg-white p-4 rounded-xl border border-slate-400 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.priority === 'Alta' ? 'bg-rose-100 text-rose-600' :
                      lead.priority === 'Média' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                      {lead.priority}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditLead(lead)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Editar Lead"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Lead"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsMessageModalOpen(true);
                        }}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Enviar Mensagem"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{lead.name}</h4>
                  <p className="text-xs text-slate-500 mb-3">{lead.company}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-400">
                    <span className="text-sm font-bold text-slate-900">{formatBRL(lead.value)}</span>
                    <select
                      className="text-[10px] bg-slate-50 border-none rounded-md p-1 focus:ring-0 cursor-pointer"
                      value={lead.status}
                      onChange={(e) => moveLead(lead.id, e.target.value as any)}
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRMTab;

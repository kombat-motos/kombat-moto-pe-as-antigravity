import React, { useState, useEffect } from 'react';
import { Edit2, Play, Trash2, Power, Search, Plus } from 'lucide-react';

interface AIInstructionListProps {
  onEdit: (id: string) => void;
  onNew: () => void;
}

const AIInstructionList: React.FC<AIInstructionListProps> = ({ onEdit, onNew }) => {
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai_instructions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstructions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'ativa' ? 'deactivate' : 'activate';
      const res = await fetch(`/api/ai_instructions/${id}/${newStatus}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInstructions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta instrução?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ai_instructions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInstructions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = instructions.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou categoria..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button 
          onClick={onNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Nova Instrução
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Prioridade</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Última Atualização</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma instrução encontrada.</td></tr>
            ) : (
              filtered.map(inst => (
                <tr key={inst.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inst.title}</td>
                  <td className="px-4 py-3 text-gray-500">{inst.category || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${inst.priority === 'crítica' ? 'bg-red-100 text-red-700' : 
                        inst.priority === 'alta' ? 'bg-orange-100 text-orange-700' : 
                        inst.priority === 'baixa' ? 'bg-gray-100 text-gray-700' : 
                        'bg-blue-100 text-blue-700'}`}>
                      {inst.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${inst.status === 'ativa' ? 'bg-green-100 text-green-700' : 
                        inst.status === 'rascunho' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inst.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggleStatus(inst.id, inst.status)} title={inst.status === 'ativa' ? 'Desativar' : 'Ativar'} className={`p-1.5 rounded transition-colors ${inst.status === 'ativa' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                        <Power size={18} />
                      </button>
                      <button onClick={() => onEdit(inst.id)} title="Editar" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(inst.id)} title="Excluir" className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AIInstructionList;

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const AIDictionary: React.FC = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', term: '', meaning: '', synonyms: '', category: 'geral' });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai_instructions/dictionary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/ai_instructions/dictionary/${formData.id}` : '/api/ai_instructions/dictionary';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsEditing(false);
        setFormData({ id: '', term: '', meaning: '', synonyms: '', category: 'geral' });
        fetchTerms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir este termo?")) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/ai_instructions/dictionary/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTerms();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = terms.filter(t => 
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.synonyms || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar termo ou sinônimo..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setFormData({ id: '', term: '', meaning: '', synonyms: '', category: 'geral' }); setIsEditing(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Novo Termo
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Termo</label>
            <input required type="text" value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg outline-none" placeholder="Ex: Batata" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Significado</label>
            <input required type="text" value={formData.meaning} onChange={e => setFormData({...formData, meaning: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg outline-none" placeholder="Ex: Mecânico Batatinha" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Sinônimos (vírgula)</label>
            <input type="text" value={formData.synonyms} onChange={e => setFormData({...formData, synonyms: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg outline-none" placeholder="Batatinha, Batatão" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Termo</th>
              <th className="px-4 py-3 font-semibold">Significado</th>
              <th className="px-4 py-3 font-semibold">Sinônimos</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum termo encontrado.</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.term}</td>
                  <td className="px-4 py-3 text-gray-600">{t.meaning}</td>
                  <td className="px-4 py-3 text-gray-500">{t.synonyms || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setFormData(t); setIsEditing(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors mr-2">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={18} />
                    </button>
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

export default AIDictionary;

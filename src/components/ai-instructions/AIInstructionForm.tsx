import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Play } from 'lucide-react';

interface AIInstructionFormProps {
  id: string | null;
  onBack: () => void;
}

const AIInstructionForm: React.FC<AIInstructionFormProps> = ({ id, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'geral',
    instruction_type: 'conhecimento do sistema',
    priority: 'normal',
    is_global: false,
    status: 'rascunho',
    keywords: '', // string for textarea
    modules: [{ module: 'todos os módulos', route: '' }]
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInstruction();
    }
  }, [id]);

  const fetchInstruction = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ai_instructions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title,
          description: data.description || '',
          content: data.content,
          category: data.category,
          instruction_type: data.instruction_type,
          priority: data.priority,
          is_global: !!data.is_global,
          status: data.status,
          keywords: (data.keywords || []).join(', '),
          modules: data.modules?.length > 0 ? data.modules : [{ module: 'todos os módulos', route: '' }]
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        status: publish ? 'ativa' : formData.status,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
      };

      const token = localStorage.getItem('token');
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/ai_instructions/${id}` : '/api/ai_instructions';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onBack();
      } else {
        alert("Erro ao salvar instrução.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar instrução.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <button type="button" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {id ? 'Editar Instrução' : 'Nova Instrução'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input 
              required
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Regra de estoque baixo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea 
              rows={2}
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Breve explicação da regra..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="geral">Geral</option>
                <option value="estoque">Estoque</option>
                <option value="vendas">Vendas</option>
                <option value="financeiro">Financeiro</option>
                <option value="oficina">Oficina</option>
                <option value="clientes">Clientes</option>
                <option value="regras da IA">Regras da IA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="crítica">Crítica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
            <input 
              type="text" 
              value={formData.keywords} 
              onChange={e => setFormData({...formData, keywords: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="estoque baixo, repor, mínimo..."
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="is_global"
              checked={formData.is_global}
              onChange={e => setFormData({...formData, is_global: e.target.checked})}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="is_global" className="text-sm text-gray-700">
              Instrução Global (Aplicada em todas as conversas)
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Instrução *</label>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2 text-sm text-amber-800">
              <p className="font-semibold mb-1">Dicas para uma boa instrução:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Seja direto e objetivo.</li>
                <li>Descreva claramente as condições.</li>
                <li>Diga o que a IA deve ou não deve fazer.</li>
              </ul>
            </div>
            <textarea 
              required
              rows={12}
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
              placeholder="Escreva a instrução detalhada aqui..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button 
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          Salvar Rascunho
        </button>
        <button 
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Play size={18} />
          Publicar Instrução
        </button>
      </div>
    </form>
  );
};

export default AIInstructionForm;

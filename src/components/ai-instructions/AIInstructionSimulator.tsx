import React, { useState, useEffect } from 'react';
import { Play, Code, AlertCircle } from 'lucide-react';

const AIInstructionSimulator: React.FC = () => {
  const [instructions, setInstructions] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState('');
  const [simulatedModule, setSimulatedModule] = useState('geral');
  const [simulatedQuestion, setSimulatedQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const handleSimulate = async () => {
    if (!selectedInst) return alert('Selecione uma instrução para testar.');
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ai_instructions/${selectedInst}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module: simulatedModule,
          question: simulatedQuestion
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-4">Configurar Simulação</h3>
        
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrução a Forçar</label>
            <select 
              value={selectedInst} 
              onChange={e => setSelectedInst(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">Selecione...</option>
              {instructions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.title} ({inst.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo Simulado</label>
            <select 
              value={simulatedModule} 
              onChange={e => setSimulatedModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="geral">Geral</option>
              <option value="financeiro">Financeiro</option>
              <option value="estoque">Estoque</option>
              <option value="pdv">Frente de Caixa (PDV)</option>
              <option value="os">Ordens de Serviço</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta do Usuário</label>
            <textarea 
              rows={3}
              value={simulatedQuestion}
              onChange={e => setSimulatedQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
              placeholder="Ex: Quais contas estão atrasadas?"
            />
          </div>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading || !selectedInst}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play size={18} />
          Executar Simulação
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg flex flex-col overflow-hidden">
        <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 text-slate-300 border-b border-slate-700">
          <Code size={18} />
          <span className="font-mono text-sm">Contexto Injetado no Gemini</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto font-mono text-sm text-green-400">
          {!result && !loading && (
            <div className="text-slate-500 h-full flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} />
              <p>Execute uma simulação para ver o resultado</p>
            </div>
          )}
          {loading && <div className="text-slate-400 animate-pulse">Simulando contexto...</div>}
          {result && (
            <pre className="whitespace-pre-wrap">{result.simulatedContext}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInstructionSimulator;

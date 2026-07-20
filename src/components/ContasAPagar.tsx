import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Calendar, DollarSign, Wallet, FileText, 
  CheckCircle, AlertCircle, X, Trash2, Edit2, Upload, Paperclip, Eye, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInDays, parseISO, isPast, isToday } from 'date-fns';

interface Fornecedor {
  id: number;
  nome: string;
}

interface ContaPagar {
  id: number;
  tipo_lancamento: string;
  fornecedor_id: number;
  fornecedor_nome: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_compra: string;
  data_vencimento: string;
  status: string;
  forma_pagamento: string;
  parcelas: number;
  parcela_atual: number;
  arquivo_boleto_url: string;
  comprovante_url: string;
  data_pagamento: string;
  observacoes: string;
}

export default function ContasAPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Forms
  const [formData, setFormData] = useState({
    tipo_lancamento: 'compra',
    fornecedor_id: '',
    descricao: '',
    categoria: 'peças',
    valor: '',
    data_compra: '',
    data_vencimento: '',
    forma_pagamento: 'boleto',
    parcelas: '1',
    observacoes: ''
  });
  const [fileBoleto, setFileBoleto] = useState<File | null>(null);
  
  const [payData, setPayData] = useState({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'pix'
  });
  const [fileComprovante, setFileComprovante] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resContas, resFornecedores] = await Promise.all([
        fetch('/api/contas-pagar').then(r => r.json()),
        fetch('/api/fornecedores').then(r => r.json())
      ]);
      setContas(resContas);
      setFornecedores(resFornecedores);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
    setLoading(false);
  };

  const getStatusInfo = (conta: ContaPagar) => {
    if (conta.status === 'pago') return { text: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
    
    const dueDate = parseISO(conta.data_vencimento);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Vencido', color: 'bg-rose-100 text-rose-700 font-bold animate-pulse', icon: AlertCircle };
    }
    
    const diff = differenceInDays(dueDate, today);
    if (diff === 0) return { text: 'Vence Hoje', color: 'bg-amber-100 text-amber-700 font-bold', icon: AlertCircle };
    if (diff <= 2) return { text: `Vence em ${diff} dias`, color: 'bg-orange-100 text-orange-700', icon: Calendar };
    
    return { text: 'Em Aberto', color: 'bg-slate-100 text-slate-700', icon: Calendar };
  };

  const filteredContas = contas.filter(c => {
    const matchesSearch = c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.fornecedor_nome && c.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'todas') return matchesSearch;
    if (filterStatus === 'pendentes') return matchesSearch && c.status !== 'pago';
    if (filterStatus === 'pagas') return matchesSearch && c.status === 'pago';
    
    if (filterStatus === 'vencidas') {
      const dueDate = parseISO(c.data_vencimento);
      const today = new Date();
      today.setHours(0,0,0,0);
      return matchesSearch && c.status !== 'pago' && isPast(dueDate) && !isToday(dueDate);
    }
    
    return matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, String(value)));
    if (fileBoleto) data.append('arquivo_boleto', fileBoleto);

    try {
      await fetch('/api/contas-pagar', {
        method: 'POST',
        body: data
      });
      fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar conta.");
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConta) return;

    const data = new FormData();
    data.append('data_pagamento', payData.data_pagamento);
    data.append('forma_pagamento', payData.forma_pagamento);
    if (fileComprovante) data.append('comprovante', fileComprovante);

    try {
      await fetch(`/api/contas-pagar/${selectedConta.id}/pay`, {
        method: 'PATCH',
        body: data
      });
      fetchData();
      setIsPayModalOpen(false);
      setSelectedConta(null);
    } catch (err) {
      console.error("Erro ao pagar:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_lancamento: 'compra',
      fornecedor_id: '',
      descricao: '',
      categoria: 'peças',
      valor: '',
      data_compra: '',
      data_vencimento: '',
      forma_pagamento: 'boleto',
      parcelas: '1',
      observacoes: ''
    });
    setFileBoleto(null);
  };

  // Summaries
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const totalAberto = contas.filter(c => c.status !== 'pago').reduce((acc, c) => acc + c.valor, 0);
  const totalVencido = contas.filter(c => c.status !== 'pago' && isPast(parseISO(c.data_vencimento)) && !isToday(parseISO(c.data_vencimento))).reduce((acc, c) => acc + c.valor, 0);
  const totalPagoMes = contas.filter(c => c.status === 'pago' && c.data_pagamento?.startsWith(new Date().toISOString().substring(0,7))).reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Resumos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Total em Aberto</p>
            <h3 className="text-2xl font-black text-slate-800">R$ {totalAberto.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center"><Wallet size={24}/></div>
        </div>
        <div className="bg-rose-500 p-6 rounded-2xl shadow-sm border border-rose-600 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase opacity-80">Total Vencido</p>
            <h3 className="text-2xl font-black">R$ {totalVencido.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center"><AlertCircle size={24}/></div>
        </div>
        <div className="bg-emerald-500 p-6 rounded-2xl shadow-sm border border-emerald-600 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase opacity-80">Pago (Mês atual)</p>
            <h3 className="text-2xl font-black">R$ {totalPagoMes.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle size={24}/></div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-sm border border-indigo-700 text-white flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => setIsModalOpen(true)}>
          <div className="flex flex-col h-full justify-center">
            <h3 className="text-xl font-bold flex items-center gap-2"><Plus size={24}/> Nova Conta</h3>
            <p className="text-sm opacity-80 mt-1">Registrar despesa</p>
          </div>
        </div>
      </div>

      {/* Lista e Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['todas', 'pendentes', 'vencidas', 'pagas'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilterStatus(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar conta..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Descrição / Fornecedor</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Vencimento</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Valor</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContas.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma conta encontrada.</td></tr>
              ) : (
                filteredContas.map(conta => {
                  const status = getStatusInfo(conta);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={conta.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{conta.descricao}</p>
                        <p className="text-xs text-slate-500">{conta.fornecedor_nome || 'Avulsa'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs uppercase font-bold">{conta.categoria}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-700">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">R$ {conta.valor.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${status.color}`}>
                          <StatusIcon size={12} /> {status.text}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setSelectedConta(conta); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Visualizar">
                            <Eye size={18} />
                          </button>
                          {conta.status !== 'pago' && (
                            <button onClick={() => { setSelectedConta(conta); setIsPayModalOpen(true); }} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition-colors">
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Nova Conta a Pagar</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="form-conta" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                      <select value={formData.tipo_lancamento} onChange={e => setFormData({...formData, tipo_lancamento: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="compra">Compra (Fornecedor)</option>
                        <option value="boleto">Nota Promissória Avulsa</option>
                        <option value="avulsa">Conta Avulsa da Empresa</option>
                      </select>
                    </div>
                    {formData.tipo_lancamento === 'compra' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Fornecedor</label>
                        <select value={formData.fornecedor_id} onChange={e => setFormData({...formData, fornecedor_id: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" required>
                          <option value="">Selecione...</option>
                          {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                    <input type="text" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ex: Compra de peças Honda, Conta de Luz..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                      <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="peças">Peças</option>
                        <option value="oficina">Oficina/Ferramentas</option>
                        <option value="aluguel">Aluguel</option>
                        <option value="energia">Energia</option>
                        <option value="internet">Internet</option>
                        <option value="impostos">Impostos/Contador</option>
                        <option value="funcionários">Funcionários</option>
                        <option value="manutenção">Manutenção</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Valor Total (R$)</label>
                      <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Data da Compra/Ref.</label>
                      <input type="date" value={formData.data_compra} onChange={e => setFormData({...formData, data_compra: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Data de Vencimento</label>
                      <input type="date" required value={formData.data_vencimento} onChange={e => setFormData({...formData, data_vencimento: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Anexar Nota Promissória / Documento (PDF ou Imagem)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                      <input type="file" id="fileBoleto" className="hidden" onChange={e => setFileBoleto(e.target.files?.[0] || null)} />
                      <label htmlFor="fileBoleto" className="cursor-pointer flex flex-col items-center justify-center text-slate-500">
                        <Upload size={24} className="mb-2" />
                        <span className="font-medium text-sm text-indigo-600 hover:text-indigo-700">Clique para selecionar o arquivo</span>
                        {fileBoleto && <span className="mt-2 text-xs text-slate-700 bg-slate-200 px-2 py-1 rounded">Selecionado: {fileBoleto.name}</span>}
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100">Cancelar</button>
                <button form="form-conta" type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Salvar Conta</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Pagamento */}
        {isPayModalOpen && selectedConta && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Confirmar Pagamento</h3>
              <p className="text-slate-600 mb-6">Conta: <strong>{selectedConta.descricao}</strong><br/>Valor: <strong className="text-rose-600">R$ {selectedConta.valor.toFixed(2)}</strong></p>
              
              <form id="form-pay" onSubmit={handlePaySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data do Pagamento</label>
                  <input type="date" required value={payData.data_pagamento} onChange={e => setPayData({...payData, data_pagamento: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select required value={payData.forma_pagamento} onChange={e => setPayData({...payData, forma_pagamento: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="pix">PIX</option>
                    <option value="boleto">Nota Promissória</option>
                    <option value="transferencia">Transferência TED/DOC</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Comprovante (opcional)</label>
                  <input type="file" onChange={e => setFileComprovante(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </form>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancelar</button>
                <button form="form-pay" type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2"><CheckCircle size={18}/> Confirmar Pagamento</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedConta && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Detalhes da Conta</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Descrição</p>
                    <p className="font-medium">{selectedConta.descricao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Fornecedor</p>
                    <p className="font-medium">{selectedConta.fornecedor_nome || 'Avulso'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Valor</p>
                    <p className="font-black text-xl text-slate-900">R$ {selectedConta.valor.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Vencimento</p>
                    <p className="font-medium">{new Date(selectedConta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <hr className="my-4 border-slate-100" />
                  
                  {selectedConta.status === 'pago' ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
                      <p className="font-black text-lg flex items-center gap-2"><CheckCircle size={20}/> PAGO</p>
                      <p className="text-sm mt-1">Data: {selectedConta.data_pagamento ? new Date(selectedConta.data_pagamento).toLocaleDateString('pt-BR') : '-'}</p>
                      <p className="text-sm">Forma: {selectedConta.forma_pagamento}</p>
                      {selectedConta.comprovante_url && (
                        <a href={selectedConta.comprovante_url} target="_blank" className="text-xs mt-3 text-emerald-700 underline font-medium block">Ver Comprovante Anexo</a>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => { setIsViewModalOpen(false); setIsPayModalOpen(true); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">
                      Marcar como Pago
                    </button>
                  )}
                </div>

                <div className="w-full md:w-2/3 bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[300px]">
                  {selectedConta.arquivo_boleto_url ? (
                    selectedConta.arquivo_boleto_url.endsWith('.pdf') ? (
                      <embed src={selectedConta.arquivo_boleto_url} type="application/pdf" className="w-full h-full min-h-[500px]" />
                    ) : (
                      <img src={selectedConta.arquivo_boleto_url} alt="Nota Promissória" className="max-w-full max-h-full object-contain p-2" />
                    )
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText size={48} className="mx-auto mb-2 opacity-20" />
                      <p>Nenhuma nota promissória anexada</p>
                    </div>
                  )}

                  {/* Stamp PAGO over image */}
                  {selectedConta.status === 'pago' && selectedConta.arquivo_boleto_url && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/20">
                      <div className="border-8 border-emerald-500 text-emerald-500 rotate-[-25deg] px-8 py-4 rounded-3xl opacity-80 backdrop-blur-sm shadow-2xl">
                        <p className="text-6xl font-black uppercase tracking-widest leading-none text-shadow-xl">PAGO</p>
                        <p className="text-center text-xl font-bold mt-2 text-shadow-md">
                          {selectedConta.data_pagamento ? new Date(selectedConta.data_pagamento).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

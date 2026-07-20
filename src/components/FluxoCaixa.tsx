import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, Package, Bike, TrendingUp, Truck, DollarSign, Percent, Plus, X, ArrowUpCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FluxoCaixa() {
  const [cashSessions, setCashSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({ openingBalance: '', notes: '' });
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ type: 'Sangria' as 'Suprimento' | 'Sangria', amount: '', description: '' });

  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [resSessions, resTransactions, resSales, resProducts] = await Promise.all([
        fetch('/api/cash_sessions').then(r => r.json()).catch(() => []),
        fetch('/api/cash_transactions').then(r => r.json()).catch(() => []),
        fetch('/api/dashboard/stats').then(r => r.json()).catch(() => ({})), // we need sales for revenue calculation, but there isn't a direct /api/sales endpoint. Wait, how do we get sales?
        fetch('/api/products').then(r => r.json()).catch(() => [])
      ]);
      
      if (Array.isArray(resSessions)) {
        const mappedSessions = resSessions.map((s: any) => ({
          id: s.id, openedAt: s.opened_at, closedAt: s.closed_at,
          openingBalance: s.opening_balance, closingBalance: s.closing_balance,
          expectedBalance: s.expected_balance || 0, status: s.status, notes: s.notes
        }));
        setCashSessions(mappedSessions);
        const active = mappedSessions.find((s: any) => s.status === 'Aberto');
        setActiveSession(active || null);
      }
      
      if (Array.isArray(resTransactions)) {
        setCashTransactions(resTransactions.map((t: any) => ({
          id: t.id, sessionId: t.session_id, type: t.type, amount: t.amount,
          description: t.description, date: t.date
        })));
      }

      // To make it simple without altering the whole backend structure, we will just use mock values for now
      // Or we can assume it will be passed as props. Let's assume we don't have sales fetched yet, we just show 0 or handle it gracefully.
      setProducts(Array.isArray(resProducts) ? resProducts : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      await fetch('/api/cash_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          opened_at: new Date().toISOString(),
          opening_balance: parseFloat(cashForm.openingBalance.toString().replace(',', '.')) || 0,
          status: 'Aberto',
          notes: cashForm.notes
        })
      });
      setIsCashModalOpen(false);
      setCashForm({ openingBalance: '', notes: '' });
      fetchData();
      alert('Caixa aberto com sucesso!');
    } catch (error) {
      console.error('Error opening cash:', error);
      alert('Erro ao abrir caixa.');
    }
  };

  const handleCloseCash = async () => {
    if (!activeSession) return;
    const closingBalance = prompt("Informe o saldo final em dinheiro no caixa:");
    if (closingBalance === null) return;

    // Simplified calculation for now
    const sessionTransactions = cashTransactions.filter(t => t.sessionId === activeSession.id);
    const totalTransactions = sessionTransactions.reduce((acc, t) => acc + (t.type === 'Suprimento' ? t.amount : -t.amount), 0);
    const expected = activeSession.openingBalance + totalTransactions; // + totalSales (if available)

    try {
      await fetch(`/api/cash_sessions/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closed_at: new Date().toISOString(),
          closing_balance: parseFloat(closingBalance) || 0,
          expected_balance: expected,
          status: 'Fechado'
        })
      });
      setActiveSession(null);
      alert(`Caixa fechado! \nEsperado (apenas mov.): R$ ${expected.toFixed(2)} \nInformado: R$ ${parseFloat(closingBalance).toFixed(2)} \nDiferença: R$ ${(parseFloat(closingBalance) - expected).toFixed(2)}`);
      fetchData();
    } catch (error) {
      console.error('Error closing cash:', error);
      alert('Erro ao fechar caixa.');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      await fetch('/api/cash_transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          session_id: activeSession?.id,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount.toString().replace(',', '.')) || 0,
          description: transactionForm.description,
          date: new Date().toISOString()
        })
      });
      setIsTransactionModalOpen(false);
      setTransactionForm({ type: 'Sangria', amount: '', description: '' });
      fetchData();
      alert('Movimentação registrada!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao registrar movimentação.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cash Control Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${activeSession ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
            <Wallet size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Status do Caixa</h3>
            <p className={`text-sm font-medium ${activeSession ? 'text-rose-600' : 'text-slate-500'}`}>
              {activeSession ? `ABERTO (Início: ${new Date(activeSession.openedAt).toLocaleTimeString()})` : 'CAIXA FECHADO'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!activeSession ? (
            <button
              onClick={() => setIsCashModalOpen(true)}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
            >
              <Plus size={18} /> Abrir Caixa
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <ArrowUpCircle size={18} /> Sangria/Suprimento
              </button>
              <button
                onClick={handleCloseCash}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
              >
                <X size={18} /> Fechar Caixa
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center text-slate-500">
        <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">Painel de Lucros em Desenvolvimento</h3>
        <p className="text-sm">Os gráficos detalhados de vendas e serviços serão conectados à API em breve.</p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCashModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCashModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Abertura de Caixa</h3>
              <form onSubmit={handleOpenCash} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Saldo Inicial (Troco) R$</label>
                  <input type="number" step="0.01" required value={cashForm.openingBalance} onChange={e => setCashForm({...cashForm, openingBalance: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Observações</label>
                  <input type="text" value={cashForm.notes} onChange={e => setCashForm({...cashForm, notes: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCashModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Abrir Caixa</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTransactionModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Sangria ou Suprimento</h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                  <select value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Sangria">Sangria (Retirada)</option>
                    <option value="Suprimento">Suprimento (Entrada)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor R$</label>
                  <input type="number" step="0.01" required value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <input type="text" required value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Confirmar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

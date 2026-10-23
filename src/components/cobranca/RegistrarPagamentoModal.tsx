// src/components/cobranca/RegistrarPagamentoModal.tsx
// Modal de Pagamento de Notas (Total, Parcial e Multi-Notas) com Emissão de Recibo

import React, { useState, useEffect } from 'react';
import { 
  X, Check, DollarSign, Receipt, Percent, ShieldCheck, 
  CreditCard, Banknote, QrCode, AlertCircle 
} from 'lucide-react';
import { CustomerDebtGroup, CreditNote } from './types';
import { formatCurrencyBRL, formatDateBR } from './defaultTemplates';
import { generatePaymentReceiptPDF } from './CobrancaPDFGenerator';

interface RegistrarPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDebtGroup | null;
  selectedNotes: CreditNote[];
  currentUser?: any;
  companyData?: any;
  onPaymentSuccess?: () => void;
}

export const RegistrarPagamentoModal: React.FC<RegistrarPagamentoModalProps> = ({
  isOpen,
  onClose,
  customer,
  selectedNotes,
  currentUser,
  companyData,
  onPaymentSuccess
}) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [discountApplied, setDiscountApplied] = useState<string>('0');
  const [fineApplied, setFineApplied] = useState<string>('0');
  const [interestApplied, setInterestApplied] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const initialIds = selectedNotes.length > 0 
        ? selectedNotes.map(n => n.id) 
        : (customer.notes ? customer.notes.filter(n => n.status !== 'Pago').map(n => n.id) : []);
      
      setSelectedNoteIds(initialIds);

      // Calcula saldo total das notas selecionadas
      const activeNotes = (customer.notes || []).filter(n => initialIds.includes(n.id));
      const totalBal = activeNotes.reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);
      setAmountPaid(totalBal.toFixed(2));
      setDiscountApplied('0');
      setFineApplied('0');
      setInterestApplied('0');
      setPaymentMethod('Pix');
      setReceivedBy(currentUser?.name || currentUser?.username || 'Operador Financeiro');
      setObservation('');
    }
  }, [isOpen, customer, selectedNotes, currentUser]);

  if (!isOpen || !customer) return null;

  const activeNotes = (customer.notes || []).filter(n => selectedNoteIds.includes(n.id));
  const totalBalanceOfSelected = activeNotes.reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);

  const toggleNote = (noteId: number) => {
    if (selectedNoteIds.includes(noteId)) {
      const updated = selectedNoteIds.filter(id => id !== noteId);
      setSelectedNoteIds(updated);
      const newTotal = (customer.notes || [])
        .filter(n => updated.includes(n.id))
        .reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);
      setAmountPaid(newTotal.toFixed(2));
    } else {
      const updated = [...selectedNoteIds, noteId];
      setSelectedNoteIds(updated);
      const newTotal = (customer.notes || [])
        .filter(n => updated.includes(n.id))
        .reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);
      setAmountPaid(newTotal.toFixed(2));
    }
  };

  const selectAllNotes = () => {
    const allUnpaid = (customer.notes || []).filter(n => n.status !== 'Pago').map(n => n.id);
    setSelectedNoteIds(allUnpaid);
    const total = (customer.notes || [])
      .filter(n => allUnpaid.includes(n.id))
      .reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);
    setAmountPaid(total.toFixed(2));
  };

  const handleQuickAmount = (ratio: number) => {
    const val = Number((totalBalanceOfSelected * ratio).toFixed(2));
    setAmountPaid(val.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNoteIds.length === 0) {
      alert('Selecione ao menos uma nota para receber.');
      return;
    }

    const payNum = parseFloat(amountPaid.replace(',', '.'));
    if (isNaN(payNum) || payNum <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credit/batch-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          selected_credit_ids: selectedNoteIds,
          amount_paid: payNum,
          discount_applied: parseFloat(discountApplied.replace(',', '.')) || 0,
          fine_applied: parseFloat(fineApplied.replace(',', '.')) || 0,
          interest_applied: parseFloat(interestApplied.replace(',', '.')) || 0,
          payment_method: paymentMethod,
          received_by: receivedBy,
          observation: observation
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento');

      // Pergunta se deseja emitir recibo
      const wantReceipt = confirm(`✅ Pagamento de ${formatCurrencyBRL(payNum)} registrado com sucesso!\nRecibo: ${data.receipt_number}\n\nDeseja emitir e imprimir o Recibo Oficial agora?`);
      
      if (wantReceipt && data.receipt_number) {
        generatePaymentReceiptPDF(customer, {
          receiptNumber: data.receipt_number,
          amountPaid: payNum,
          paymentMethod: paymentMethod,
          receivedBy: receivedBy,
          observation: observation,
          settledNotes: data.settled_notes || []
        }, companyData);
      }

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Registrar Pagamento de Cobrança</h3>
              <p className="text-xs text-slate-400">Baixa total ou parcial com conciliação automática</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Customer info */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <p className="font-bold text-white text-sm">{customer.customer_name}</p>
              <p className="text-xs text-slate-400">CPF: {customer.cpf || 'Não informado'} &bull; Cel: {customer.whatsapp || customer.phone || 'N/A'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Total Pendente</span>
              <p className="text-base font-black text-rose-400">{formatCurrencyBRL(customer.total_balance)}</p>
            </div>
          </div>

          {/* Notes Selection for payment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selecione as notas a serem amortizadas / quitadas:
              </label>
              <button 
                type="button" 
                onClick={selectAllNotes}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
              >
                Selecionar Todas ({customer.notes.filter(n => n.status !== 'Pago').length})
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {customer.notes.filter(n => n.status !== 'Pago').map(note => {
                const isSelected = selectedNoteIds.includes(note.id);
                const bal = note.balance > 0 ? note.balance : note.original_value;

                return (
                  <div
                    key={note.id}
                    onClick={() => toggleNote(note.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} 
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-200">{note.identifier || `#${note.id}`}</span>
                        <span className="text-[11px] text-slate-400 ml-2">Venc: {formatDateBR(note.due_date)}</span>
                        {note.is_overdue && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded ml-2 font-bold">
                            {Math.abs(note.days_overdue)}d atraso
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-sm text-emerald-400">{formatCurrencyBRL(bal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amount and Quick Buttons */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Valor Efetivamente Recebido (R$):
                </label>
                <p className="text-[11px] text-slate-500">Saldo das notas selecionadas: {formatCurrencyBRL(totalBalanceOfSelected)}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(1.0)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Total (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.5)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.25)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  25%
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">R$</span>
              <input
                type="text"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Additional Rates & Discounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Desconto Autorizado (R$)</label>
              <input
                type="text"
                value={discountApplied}
                onChange={(e) => setDiscountApplied(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Juros Cobrados (R$)</label>
              <input
                type="text"
                value={interestApplied}
                onChange={(e) => setInterestApplied(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Multa Cobrada (R$)</label>
              <input
                type="text"
                value={fineApplied}
                onChange={(e) => setFineApplied(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Payment Method & Received By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Forma de Pagamento:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Pix">Pix (Transferência Instantânea)</option>
                <option value="Dinheiro">Dinheiro (Espécie)</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Transferência Bancária">Transferência / TED</option>
                <option value="Boleto">Boleto Liquidado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Operador / Responsável:
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                placeholder="Nome do operador"
              />
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Observações / Comprovante (Opcional):
            </label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Pago no balcão pelo cliente, comprovante conferido no extrato"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Check size={16} />
            {isSubmitting ? 'Registrando...' : 'Confirmar e Baixar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

// src/components/cobranca/NegociarDividaModal.tsx
// Modal de Negociação e Parcelamento de Dívida com Geração de Termo de Acordo e WhatsApp

import React, { useState, useEffect } from 'react';
import { 
  X, Handshake, FileText, Calendar, DollarSign, 
  Percent, CheckCircle, MessageSquare 
} from 'lucide-react';
import { CustomerDebtGroup, CreditNote } from './types';
import { formatCurrencyBRL, formatDateBR } from './defaultTemplates';
import { generateAgreementPDF } from './CobrancaPDFGenerator';

interface NegociarDividaModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDebtGroup | null;
  selectedNotes: CreditNote[];
  companyData?: any;
  onNegotiationSuccess?: (agreementData: any) => void;
  onOpenWhatsAppAgreement?: (agreementData: any) => void;
}

export const NegociarDividaModal: React.FC<NegociarDividaModalProps> = ({
  isOpen,
  onClose,
  customer,
  selectedNotes,
  companyData,
  onNegotiationSuccess,
  onOpenWhatsAppAgreement
}) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [discountAuthorized, setDiscountAuthorized] = useState<string>('0');
  const [downPayment, setDownPayment] = useState<string>('0');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [firstDueDate, setFirstDueDate] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const initialIds = selectedNotes.length > 0 
        ? selectedNotes.map(n => n.id) 
        : (customer.notes ? customer.notes.filter(n => n.status !== 'Pago').map(n => n.id) : []);
      setSelectedNoteIds(initialIds);

      // Default first due date: 30 days from now
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setFirstDueDate(d.toISOString().split('T')[0]);
      setDiscountAuthorized('0');
      setDownPayment('0');
      setInstallmentsCount(3);
      setObservation('');
    }
  }, [isOpen, customer, selectedNotes]);

  if (!isOpen || !customer) return null;

  const activeNotes = (customer.notes || []).filter(n => selectedNoteIds.includes(n.id));
  const originalTotal = activeNotes.reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);

  const discountNum = parseFloat(discountAuthorized.replace(',', '.')) || 0;
  const downPaymentNum = parseFloat(downPayment.replace(',', '.')) || 0;
  const netTotalToFinance = Math.max(0, originalTotal - discountNum - downPaymentNum);
  const installmentValue = installmentsCount > 0 ? Number((netTotalToFinance / installmentsCount).toFixed(2)) : 0;

  const toggleNote = (id: number) => {
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(selectedNoteIds.filter(nId => nId !== id));
    } else {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNoteIds.length === 0) {
      alert('Selecione ao menos uma nota para renegociar.');
      return;
    }
    if (netTotalToFinance <= 0 && downPaymentNum <= 0) {
      alert('O valor final do acordo deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credit/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          selected_credit_ids: selectedNoteIds,
          original_total: originalTotal,
          discount_authorized: discountNum,
          down_payment: downPaymentNum,
          installments_count: installmentsCount,
          first_due_date: firstDueDate,
          observation: observation
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao firmar acordo');

      // Gera termo de acordo PDF
      const wantPdf = confirm(`🤝 Acordo #${data.agreement_id} registrado com sucesso!\n\nDeseja gerar e imprimir o Termo Oficial de Acordo em PDF agora?`);
      if (wantPdf) {
        generateAgreementPDF(customer, {
          agreementId: data.agreement_id,
          originalTotal: originalTotal,
          discountAuthorized: discountNum,
          downPayment: downPaymentNum,
          negotiatedTotal: netTotalToFinance,
          installments: data.installments || [],
          observation: observation
        }, companyData);
      }

      if (onNegotiationSuccess) {
        onNegotiationSuccess({
          agreementId: data.agreement_id,
          originalTotal,
          discountNum,
          downPaymentNum,
          netTotalToFinance,
          installmentsCount,
          firstDueDate,
          installments: data.installments || []
        });
      }

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
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Handshake size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Negociar Dívida &amp; Parcelamento</h3>
              <p className="text-xs text-slate-400">Repactuação de saldos sem duplicar débitos históricos</p>
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
              <span className="text-[10px] uppercase font-bold text-slate-400">Original Selecionado</span>
              <p className="text-base font-black text-white">{formatCurrencyBRL(originalTotal)}</p>
            </div>
          </div>

          {/* Notes Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Selecione as notas incluídas na renegociação:
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {customer.notes.filter(n => n.status !== 'Pago').map(note => {
                const isSelected = selectedNoteIds.includes(note.id);
                const bal = note.balance > 0 ? note.balance : note.original_value;

                return (
                  <div
                    key={note.id}
                    onClick={() => toggleNote(note.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-500/10 border-blue-500/40 text-white' 
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-blue-500" />
                      <span className="font-bold text-xs">{note.identifier || `#${note.id}`}</span>
                      <span className="text-[10px] text-slate-400">Venc: {formatDateBR(note.due_date)}</span>
                    </div>
                    <span className="font-bold text-xs">{formatCurrencyBRL(bal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Desconto Concedido (R$):
              </label>
              <input
                type="text"
                value={discountAuthorized}
                onChange={(e) => setDiscountAuthorized(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Entrada em Dinheiro / Pix (R$):
              </label>
              <input
                type="text"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Número de Parcelas:
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24].map(num => (
                  <option key={num} value={num}>{num}x {num === 1 ? '(Parcela Única)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Primeiro Vencimento:
              </label>
              <input
                type="date"
                required
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Recalculation Summary Box */}
          <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-300">Resumo da Proposta</span>
              <p className="text-xs text-slate-300 mt-0.5">
                {installmentsCount}x parcelas de <strong className="text-white font-bold">{formatCurrencyBRL(installmentValue)}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-300">Novo Total Financiado</span>
              <p className="text-xl font-black text-blue-400">{formatCurrencyBRL(netTotalToFinance)}</p>
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Observações do Acordo:
            </label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Acordo realizado presencialmente na loja com autorização da gerência"
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all"
          >
            <Handshake size={16} />
            {isSubmitting ? 'Processando...' : 'Firmar Acordo e Gerar Parcelas'}
          </button>
        </div>
      </div>
    </div>
  );
};

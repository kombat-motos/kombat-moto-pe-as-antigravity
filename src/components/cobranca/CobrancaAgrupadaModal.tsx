// src/components/cobranca/CobrancaAgrupadaModal.tsx
// Módulo de Cobrança Agrupada por Cliente - PRIORIDADE MÁXIMA

import React, { useState, useEffect } from 'react';
import { 
  X, CheckSquare, Square, MessageCircle, FileText, 
  DollarSign, Handshake, Clock, ShieldAlert, CheckCircle, 
  Layers, Printer, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { CustomerDebtGroup, CreditNote, WhatsAppTemplate } from './types';
import { formatCurrencyBRL, formatDateBR } from './defaultTemplates';
import { generateConsolidatedPDF, generateIndividualPDF } from './CobrancaPDFGenerator';
import { WhatsAppModal } from './WhatsAppModal';
import { RegistrarPagamentoModal } from './RegistrarPagamentoModal';
import { NegociarDividaModal } from './NegociarDividaModal';
import { HistoricoCobrancaModal } from './HistoricoCobrancaModal';

interface CobrancaAgrupadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDebtGroup | null;
  companyData?: any;
  currentUser?: any;
  customTemplates?: Record<string, WhatsAppTemplate>;
  pixKey?: string;
  onDataRefresh?: () => void;
}

export const CobrancaAgrupadaModal: React.FC<CobrancaAgrupadaModalProps> = ({
  isOpen,
  onClose,
  customer,
  companyData,
  currentUser,
  customTemplates,
  pixKey,
  onDataRefresh
}) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);

  // Submodals
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      // By default, select all open/unpaid notes
      const initialIds = (customer.notes || [])
        .filter(n => n.status !== 'Pago')
        .map(n => n.id);
      setSelectedNoteIds(initialIds);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const notesList = customer.notes || [];
  const unpaidNotes = notesList.filter(n => n.status !== 'Pago');
  const selectedNotes = notesList.filter(n => selectedNoteIds.includes(n.id));

  // Dynamic recalculations
  let selectedOriginal = 0;
  let selectedPaid = 0;
  let selectedBalance = 0;
  let selectedOverdue = 0;
  let selectedUpcoming = 0;

  selectedNotes.forEach(n => {
    const bal = n.balance > 0 ? n.balance : n.original_value;
    selectedOriginal += n.original_value || 0;
    selectedPaid += n.paid_value || 0;
    selectedBalance += bal;
    if (n.is_overdue) selectedOverdue += bal;
    else selectedUpcoming += bal;
  });

  const isAllSelected = unpaidNotes.length > 0 && unpaidNotes.every(n => selectedNoteIds.includes(n.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(unpaidNotes.map(n => n.id));
    }
  };

  const toggleNote = (id: number) => {
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(selectedNoteIds.filter(nId => nId !== id));
    } else {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const handlePrintConsolidated = () => {
    if (selectedNotes.length === 0) {
      alert('Selecione ao menos uma nota para gerar o PDF consolidado.');
      return;
    }
    generateConsolidatedPDF(customer, selectedNotes, companyData, pixKey);
  };

  const handlePrintIndividual = (note: CreditNote) => {
    generateIndividualPDF(customer, note, companyData, pixKey);
  };

  const handlePrintAllIndividuals = () => {
    if (selectedNotes.length === 0) {
      alert('Selecione ao menos uma nota.');
      return;
    }
    selectedNotes.forEach(n => {
      generateIndividualPDF(customer, n, companyData, pixKey);
    });
  };

  const handleOpenWhatsApp = () => {
    if (selectedNotes.length === 0) {
      alert('Selecione ao menos uma nota para cobrar.');
      return;
    }
    setIsWhatsAppOpen(true);
  };

  const isBlocked = customer.credit_status?.includes('BLOQUEADO');

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Layers size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base uppercase tracking-tight">Cobrança Agrupada por Cliente</h3>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isBlocked ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {customer.credit_status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Seleção independente de notas, total dinâmico e envio unificado</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                title="Visualizar Linha do Tempo e Histórico"
              >
                <Clock size={14} />
                Histórico
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Customer Profile Banner */}
          <div className="p-6 pb-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-white">{customer.customer_name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  <span>CPF/CNPJ: <strong className="text-slate-300">{customer.cpf || 'Não informado'}</strong></span>
                  <span>WhatsApp: <strong className="text-emerald-400">{customer.whatsapp || customer.phone || 'Sem telefone'}</strong></span>
                  {customer.address && (
                    <span>Endereço: <strong className="text-slate-300">{customer.address}, {customer.neighborhood} - {customer.city}</strong></span>
                  )}
                </div>
                {customer.credit_block_reason && (
                  <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                    <ShieldAlert size={14} /> Motivo do bloqueio: {customer.credit_block_reason}
                  </p>
                )}
              </div>

              {/* Dynamic Totals Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Selecionado ({selectedNotes.length})</span>
                  <p className="text-2xl font-black text-rose-400">{formatCurrencyBRL(selectedBalance)}</p>
                </div>
                <div className="text-right border-l border-slate-800 pl-4">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Vencido em Atraso</span>
                  <p className="text-sm font-bold text-amber-300">{formatCurrencyBRL(selectedOverdue)}</p>
                  <span className="text-[9px] text-slate-400">A vencer: {formatCurrencyBRL(selectedUpcoming)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Notes */}
          <div className="px-6 py-2 overflow-y-auto flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare size={16} className="text-rose-400" />
                      Desmarcar Todas
                    </>
                  ) : (
                    <>
                      <Square size={16} className="text-slate-400" />
                      Selecionar Todas ({unpaidNotes.length})
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  {selectedNotes.length} de {notesList.length} notas selecionadas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintAllIndividuals}
                  className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                  title="Gerar PDFs individuais de todas as notas selecionadas"
                >
                  <FileText size={13} />
                  PDFs Individuais
                </button>
              </div>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="p-3 w-10 text-center">Sel.</th>
                    <th className="p-3">Identificador / Venda</th>
                    <th className="p-3">Data Compra</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3 text-right">Valor Original</th>
                    <th className="p-3 text-right">Já Pago</th>
                    <th className="p-3 text-right">Saldo Pendente</th>
                    <th className="p-3 text-center">Situação</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {notesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        Nenhuma nota registrada para este cliente.
                      </td>
                    </tr>
                  ) : (
                    notesList.map(note => {
                      const isSelected = selectedNoteIds.includes(note.id);
                      const isPaid = note.status === 'Pago';
                      const bal = note.balance > 0 ? note.balance : note.original_value;

                      return (
                        <tr 
                          key={note.id}
                          onClick={() => !isPaid && toggleNote(note.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-rose-500/10 hover:bg-rose-500/15' 
                              : isPaid 
                                ? 'bg-slate-950/20 opacity-60' 
                                : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={isPaid}
                              checked={isSelected}
                              onChange={() => toggleNote(note.id)}
                              className="rounded border-slate-700 text-rose-600 focus:ring-rose-500/20 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-white">
                            <span className="font-mono">{note.identifier || `#${note.id}`}</span>
                            {note.moto_details && (
                              <p className="text-[10px] text-slate-400 font-normal truncate max-w-[160px]">{note.moto_details}</p>
                            )}
                          </td>
                          <td className="p-3 text-slate-400">{formatDateBR(note.sale_date)}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-300">{formatDateBR(note.due_date)}</span>
                            {note.is_overdue && (
                              <span className="text-[10px] text-rose-400 block font-bold">
                                {Math.abs(note.days_overdue)} dias atraso
                              </span>
                            )}
                            {note.is_due_today && (
                              <span className="text-[10px] text-amber-400 block font-bold">
                                Vence Hoje
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-300">{formatCurrencyBRL(note.original_value)}</td>
                          <td className="p-3 text-right text-emerald-400">{formatCurrencyBRL(note.paid_value || 0)}</td>
                          <td className="p-3 text-right font-black text-rose-400 text-sm">
                            {formatCurrencyBRL(bal)}
                          </td>
                          <td className="p-3 text-center">
                            {isPaid ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                Quitada
                              </span>
                            ) : note.is_overdue ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Atrasada
                              </span>
                            ) : note.is_due_today ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Vence Hoje
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                A Vencer
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handlePrintIndividual(note)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Gerar PDF desta nota"
                            >
                              <FileText size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintConsolidated}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shadow-sm"
              >
                <Printer size={15} />
                Gerar PDF Consolidado
              </button>

              <button
                type="button"
                onClick={() => setIsNegotiationOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs border border-blue-500/30 transition-all"
              >
                <Handshake size={15} />
                Negociar Dívida
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all"
              >
                <DollarSign size={16} />
                Registrar Pagamento
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all"
              >
                <MessageCircle size={16} />
                COBRAR TODAS NO WHATSAPP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        customer={customer}
        selectedNotes={selectedNotes}
        customTemplates={customTemplates}
        pixKey={pixKey}
        initialTemplateCode={selectedNotes.length > 1 ? 'C' : 'B'}
        onCollectionLogged={onDataRefresh}
      />

      <RegistrarPagamentoModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        customer={customer}
        selectedNotes={selectedNotes}
        currentUser={currentUser}
        companyData={companyData}
        onPaymentSuccess={() => {
          if (onDataRefresh) onDataRefresh();
          onClose();
        }}
      />

      <NegociarDividaModal
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        customer={customer}
        selectedNotes={selectedNotes}
        companyData={companyData}
        onNegotiationSuccess={() => {
          if (onDataRefresh) onDataRefresh();
          onClose();
        }}
      />

      <HistoricoCobrancaModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={customer}
      />
    </>
  );
};

// src/components/cobranca/defaultTemplates.ts
// Modelos Profissionais de Mensagens WhatsApp - Central de Cobranças Kombat Moto Peças

import { WhatsAppTemplate, CreditNote, CustomerDebtGroup } from './types';
import { format } from 'date-fns';

export const DEFAULT_WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  MODELO_A: {
    id: 'MODELO_A',
    code: 'A',
    title: 'Modelo A: Lembrete Antecipado',
    description: 'Enviado 3 dias antes do vencimento para avisar cordialmente o cliente.',
    body: `Olá, {cliente}!

Aqui é da Kombat Moto Peças.

Estamos entrando em contato para lembrar sobre o vencimento da sua compra.

Nota: {numero}
Vencimento: {data}
Valor pendente: {valor}

Caso já tenha efetuado o pagamento, desconsidere esta mensagem e, se possível, envie o comprovante.

Kombat Moto Peças
Andirá - PR`,
    is_active: true
  },

  MODELO_B: {
    id: 'MODELO_B',
    code: 'B',
    title: 'Modelo B: Cobrança Individual',
    description: 'Cobrança padrão para uma nota vencida com dias de atraso e valor pendente.',
    body: `Olá, {cliente}!

Identificamos uma pendência financeira em seu cadastro na Kombat Moto Peças.

Nota: {numero}
Compra: {data_compra}
Vencimento: {vencimento}
Valor pendente: {valor}
Dias em atraso: {dias_atraso}

Solicitamos a regularização ou contato para esclarecimentos.

Caso já tenha pago, favor encaminhar o comprovante.

Kombat Moto Peças`,
    is_active: true
  },

  MODELO_C: {
    id: 'MODELO_C',
    code: 'C',
    title: 'Modelo C: Cobrança Agrupada',
    description: 'Cobrança dinâmica para múltiplas notas do mesmo cliente com lista numerada e total geral.',
    body: `Olá, {cliente}!

Segue o demonstrativo atualizado das suas pendências na Kombat Moto Peças.

NOTAS EM ABERTO:

{lista_notas}

TOTAL GERAL PENDENTE: {total_geral}

Solicitamos a conferência dos valores e a regularização das pendências.

Se alguma nota já foi paga, encaminhe o comprovante para conferência.

Agradecemos sua atenção.

Kombat Moto Peças
Andirá - Paraná`,
    is_active: true
  },

  MODELO_D: {
    id: 'MODELO_D',
    code: 'D',
    title: 'Modelo D: Cobrança Após Vencimento',
    description: 'Mensagem de cobrança institucional para saldos vencidos e convite para negociação.',
    body: `Olá, {cliente}.

Consta em nosso sistema um saldo vencido de {valor_total}, referente às compras realizadas na Kombat Moto Peças.

O demonstrativo detalhado está disponível para conferência.

Pedimos que entre em contato para regularização ou negociação.

Caso o pagamento já tenha sido realizado, envie o comprovante para atualização cadastral.

Kombat Moto Peças.`,
    is_active: true
  },

  MODELO_E: {
    id: 'MODELO_E',
    code: 'E',
    title: 'Modelo E: Acordo de Pagamento',
    description: 'Resumo oficial após negociação de dívida com valor, entrada, parcelas e vencimentos.',
    body: `Olá, {cliente}.

Conforme nossa negociação, segue o resumo do acordo:

Valor negociado: {valor}
Entrada: {entrada}
Parcelas: {parcelas}
Próximo vencimento: {vencimento}

Acompanhe os vencimentos para manter o acordo em dia.

Kombat Moto Peças.`,
    is_active: true
  }
};

export function formatCurrencyBRL(val: number): string {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const str = String(dateStr).trim();
    if (str.includes('/')) return str;
    const clean = str.includes('T') ? str.split('T')[0] : str;
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Interpolação inteligente de mensagens com dados reais
 * Garante que não envia variáveis vazias ({cliente}, etc.)
 */
export function buildWhatsAppMessage(
  templateCode: 'A' | 'B' | 'C' | 'D' | 'E',
  customTemplates: Record<string, WhatsAppTemplate> | undefined,
  customer: CustomerDebtGroup,
  selectedNotes: CreditNote[],
  extraData?: {
    agreementValor?: number;
    agreementEntrada?: number;
    agreementParcelas?: string;
    agreementProximoVencimento?: string;
    pixKey?: string;
  }
): string {
  const templates = { ...DEFAULT_WHATSAPP_TEMPLATES, ...(customTemplates || {}) };
  const templateKey = `MODELO_${templateCode}`;
  const tmpl = templates[templateKey] || DEFAULT_WHATSAPP_TEMPLATES[templateKey];
  if (!tmpl) return '';

  let message = tmpl.body;
  const firstName = (customer.customer_name || 'Cliente').trim().split(' ')[0];

  // Substitui {cliente}
  message = message.replace(/\{cliente\}/g, firstName);

  // Se for Modelo C (Cobrança Agrupada)
  if (templateCode === 'C') {
    const dynamicList = selectedNotes.map((n, idx) => {
      const numStr = n.identifier || `#${n.id}`;
      const dueStr = formatDateBR(n.due_date);
      const valStr = formatCurrencyBRL(n.balance > 0 ? n.balance : n.original_value);
      return `${idx + 1}. Nota ${numStr}\nVencimento: ${dueStr}\nSaldo: ${valStr}`;
    }).join('\n\n');

    const totalGeral = selectedNotes.reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);

    message = message.replace(/\{lista_notas\}/g, dynamicList || 'Nenhuma nota selecionada');
    message = message.replace(/\{total_geral\}/g, formatCurrencyBRL(totalGeral));
  } 
  // Se for Modelo A ou B (Individual)
  else if (templateCode === 'A' || templateCode === 'B') {
    const singleNote = selectedNotes[0] || (customer.notes && customer.notes[0]);
    if (singleNote) {
      const numStr = singleNote.identifier || `#${singleNote.id}`;
      const dueStr = formatDateBR(singleNote.due_date);
      const buyStr = formatDateBR(singleNote.sale_date);
      const valStr = formatCurrencyBRL(singleNote.balance > 0 ? singleNote.balance : singleNote.original_value);
      const atrasoStr = Math.max(0, singleNote.days_overdue);

      message = message.replace(/\{numero\}/g, numStr);
      message = message.replace(/\{data\}/g, dueStr);
      message = message.replace(/\{data_compra\}/g, buyStr);
      message = message.replace(/\{vencimento\}/g, dueStr);
      message = message.replace(/\{valor\}/g, valStr);
      message = message.replace(/\{dias_atraso\}/g, `${atrasoStr} dia(s)`);
    }
  } 
  // Se for Modelo D (Cobrança Pós Vencimento)
  else if (templateCode === 'D') {
    const totalVencido = selectedNotes.length > 0 
      ? selectedNotes.filter(n => n.is_overdue).reduce((acc, n) => acc + n.balance, 0)
      : customer.total_overdue;
    const valTotal = totalVencido > 0 ? totalVencido : customer.total_balance;
    message = message.replace(/\{valor_total\}/g, formatCurrencyBRL(valTotal));
  } 
  // Se for Modelo E (Acordo de Pagamento)
  else if (templateCode === 'E') {
    const vNeg = extraData?.agreementValor ? formatCurrencyBRL(extraData.agreementValor) : formatCurrencyBRL(customer.total_balance);
    const vEnt = extraData?.agreementEntrada ? formatCurrencyBRL(extraData.agreementEntrada) : 'R$ 0,00';
    const vPar = extraData?.agreementParcelas || '1x';
    const vProx = extraData?.agreementProximoVencimento ? formatDateBR(extraData.agreementProximoVencimento) : 'A combinar';

    message = message.replace(/\{valor\}/g, vNeg);
    message = message.replace(/\{entrada\}/g, vEnt);
    message = message.replace(/\{parcelas\}/g, vPar);
    message = message.replace(/\{vencimento\}/g, vProx);
  }

  // Opcional: Chave Pix se presente
  if (extraData?.pixKey) {
    message += `\n\nChave Pix para pagamento: ${extraData.pixKey}`;
  }

  return message;
}

/**
 * Validação rigorosa de telefone celular para WhatsApp
 */
export function validateWhatsAppNumber(phoneStr?: string): { isValid: boolean; formatted: string; clean: string; error?: string } {
  if (!phoneStr) {
    return { isValid: false, formatted: '', clean: '', error: 'Cliente não possui telefone cadastrado.' };
  }

  const clean = phoneStr.replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    return { isValid: false, formatted: '', clean, error: 'Telefone incompleto (mínimo de 10 dígitos com DDD).' };
  }

  // Se tiver 10 ou 11 dígitos, adiciona o DDI do Brasil 55
  const withCountry = clean.length <= 11 ? `55${clean}` : clean;
  return { isValid: true, formatted: withCountry, clean, error: undefined };
}

/**
 * Gera URL de WhatsApp (Web ou App)
 */
export function createWhatsAppUrl(phoneClean: string, messageText: string, preferWeb: boolean = true): string {
  const encoded = encodeURIComponent(messageText);
  if (preferWeb) {
    return `https://web.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`;
  }
  return `https://wa.me/${phoneClean}?text=${encoded}`;
}

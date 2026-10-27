/**
 * src/utils/billingDate.ts
 * Cálculo inteligente e seguro de dia fixo de vencimento para vendas a prazo / fiado
 * Sistema Kombat Moto Peças
 */

/**
 * Retorna a data no formato YYYY-MM-DD baseada no dia local do sistema
 */
export function getLocalDateISOString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte 'YYYY-MM-DD' para 'DD/MM/YYYY'
 */
export function formatBillingDueDateBR(isoDateStr?: string): string {
  if (!isoDateStr) return 'N/A';
  const clean = isoDateStr.split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
}

/**
 * Calcula a próxima data de vencimento com base no dia fixo do cliente (billing_day 1-31).
 *
 * REGRAS DE NEGÓCIO KOMBAT:
 * - Se billingDay não for informado (null/undefined/0), projeta fallbackDays (padrão 30 dias).
 * - Se dia da venda <= billingDay: vence no mês corrente no dia billingDay.
 * - Se dia da venda > billingDay: vence no próximo mês no dia billingDay.
 * - Venda no próprio dia do vencimento: vence no mesmo dia.
 * - Dias 29, 30 ou 31 em meses mais curtos (ex: Fevereiro): ajusta automaticamente para o último dia válido do mês.
 * - Livre de distorções de fuso horário / timezone (trabalha com inteiros de ano, mês e dia).
 *
 * @param baseDate Data da operação (Date object ou string 'YYYY-MM-DD')
 * @param billingDay Dia fixo de vencimento do cliente (1 a 31)
 * @param fallbackDays Dias corridos para clientes sem dia fixo (padrão 30)
 * @returns Data no formato 'YYYY-MM-DD'
 */
export function calculateBillingDueDate(
  baseDate: Date | string = new Date(),
  billingDay?: number | null,
  fallbackDays: number = 30
): string {
  let year: number;
  let month: number; // 1 a 12
  let day: number;

  if (typeof baseDate === 'string') {
    const clean = baseDate.split('T')[0].trim();
    const parts = clean.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      const d = new Date(baseDate);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    }
  } else if (baseDate instanceof Date && !isNaN(baseDate.getTime())) {
    year = baseDate.getFullYear();
    month = baseDate.getMonth() + 1;
    day = baseDate.getDate();
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
    day = now.getDate();
  }

  // Se o cliente não tem dia fixo configurado (1 a 31), usa regra padrão de +fallbackDays
  const bDay = billingDay ? Number(billingDay) : null;
  if (!bDay || bDay < 1 || bDay > 31) {
    const standardDate = new Date(year, month - 1, day + fallbackDays);
    const sY = standardDate.getFullYear();
    const sM = String(standardDate.getMonth() + 1).padStart(2, '0');
    const sD = String(standardDate.getDate()).padStart(2, '0');
    return `${sY}-${sM}-${sD}`;
  }

  let targetYear = year;
  let targetMonth: number;

  if (day <= bDay) {
    // Venda anterior ou no próprio dia fixo: vence no mês atual
    targetMonth = month;
  } else {
    // Venda após o dia fixo: vence no próximo mês
    targetMonth = month + 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
  }

  // Limite máximo de dias no mês destino (ex: 28 ou 29 para Fev, 30 para Abr/Jun/Set/Nov)
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const finalDay = Math.min(bDay, maxDaysInTargetMonth);

  const finalYearStr = String(targetYear).padStart(4, '0');
  const finalMonthStr = String(targetMonth).padStart(2, '0');
  const finalDayStr = String(finalDay).padStart(2, '0');

  return `${finalYearStr}-${finalMonthStr}-${finalDayStr}`;
}

/**
 * Retorna uma prévia detalhada com formato BR e indicador de ajuste
 */
export function getBillingDayPreview(
  billingDay?: number | null,
  baseDate: Date = new Date()
): {
  dueDateISO: string;
  dueDateBR: string;
  description: string;
  isClamped: boolean;
} {
  const bDay = billingDay ? Number(billingDay) : null;
  const dueDateISO = calculateBillingDueDate(baseDate, bDay);
  const dueDateBR = formatBillingDueDateBR(dueDateISO);

  if (!bDay || bDay < 1 || bDay > 31) {
    return {
      dueDateISO,
      dueDateBR,
      description: 'Regra padrão: vence 30 dias após a emissão.',
      isClamped: false
    };
  }

  const [y, m, d] = dueDateISO.split('-').map(Number);
  const isClamped = d < bDay;

  return {
    dueDateISO,
    dueDateBR,
    description: isClamped
      ? `Ajustado para o último dia válido deste mês (${d}/${String(m).padStart(2, '0')}).`
      : `Vence pontualmente no próximo dia ${String(bDay).padStart(2, '0')}.`,
    isClamped
  };
}

/**
 * Retorna uma descrição amigável para exibição em badges e resumos
 */
export function getBillingDayLabel(billingDay?: number | null): string {
  if (!billingDay || billingDay < 1 || billingDay > 31) {
    return 'Sem dia fixo (30 dias)';
  }
  return `Dia ${String(billingDay).padStart(2, '0')}`;
}

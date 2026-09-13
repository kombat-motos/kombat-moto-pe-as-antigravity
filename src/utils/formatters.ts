// src/utils/formatters.ts
// Utilitário central de formatação padrão oficial: Moeda Brasileira e Datas

export const formatCurrencyBRL = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  let num: number;
  if (typeof value === 'number') {
    num = isNaN(value) ? 0 : value;
  } else {
    const cleaned = String(value).trim().replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
    num = parseFloat(cleaned);
    if (isNaN(num)) num = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const parseCurrencyBRL = (valueStr: string): number => {
  if (!valueStr) return 0;
  const cleaned = valueStr.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDateBR = (dateInput: any, includeTime = false): string => {
  if (!dateInput) return '-';
  try {
    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      const str = String(dateInput).trim();
      // Handle DD/MM/YYYY format
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            dateObj = new Date(y, m - 1, d);
          } else {
            dateObj = new Date(str);
          }
        } else {
          dateObj = new Date(str);
        }
      } else {
        dateObj = new Date(str);
      }
    }

    if (isNaN(dateObj.getTime())) return String(dateInput);

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(dateInput);
  }
};

export const maskCPF = (cpf?: string | null): string => {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.***.${digits.substring(6, 9)}-**`;
  }
  if (digits.length === 14) {
    return `**.***.***/${digits.substring(8, 12)}-**`;
  }
  return '***.***.***-**';
};

export const maskPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const ddd = digits.substring(0, 2);
    const last4 = digits.substring(digits.length - 4);
    return `(${ddd}) *****-${last4}`;
  }
  return '(**) *****-****';
};

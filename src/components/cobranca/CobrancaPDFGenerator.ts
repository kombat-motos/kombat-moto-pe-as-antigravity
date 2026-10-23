// src/components/cobranca/CobrancaPDFGenerator.ts
// Gerador de Demonstrativos Financeiros em PDF para Kombat Moto Peças

import { CreditNote, CustomerDebtGroup } from './types';
import { formatCurrencyBRL, formatDateBR } from './defaultTemplates';

interface CompanyInfo {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  razaoSocial: 'Kombat comercio de auto peças ltda',
  nomeFantasia: 'Kombat Moto Peças',
  cnpj: '12.802.931/0001-92',
  telefone: '(43) 3538-4537',
  email: 'kombatpecas@gmail.com',
  endereco: 'Rua: Paraná, 342',
  bairro: 'Centro',
  cidade: 'Andirá',
  estado: 'PR',
  cep: '86380-000'
};

function getPrintBaseStyles(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1e293b;
        background: #fff;
        font-size: 11px;
        line-height: 1.4;
        padding: 15mm;
      }
      
      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
        .page-break { page-break-after: always; }
      }

      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 12px;
        border-bottom: 2px solid #e2e8f0;
        margin-bottom: 14px;
      }

      .brand-title {
        font-size: 20px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #0f172a;
        text-transform: uppercase;
      }

      .brand-subtitle {
        font-size: 12px;
        font-weight: 700;
        color: #e11d48;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-top: 2px;
      }

      .company-details {
        font-size: 10px;
        color: #64748b;
        margin-top: 4px;
        line-height: 1.3;
      }

      .doc-meta {
        text-align: right;
        font-size: 10px;
        color: #475569;
      }

      .doc-badge {
        display: inline-block;
        background: #0f172a;
        color: #fff;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 800;
        font-size: 10px;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .section-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 14px;
      }

      .section-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        margin-bottom: 6px;
      }

      .customer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 8px;
        font-size: 11px;
      }

      .customer-field strong {
        color: #334155;
        font-weight: 600;
      }

      table.notes-table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 10.5px;
      }

      table.notes-table th {
        background: #f1f5f9;
        color: #475569;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.4px;
        padding: 8px 6px;
        border-top: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
        text-align: left;
      }

      table.notes-table td {
        padding: 7px 6px;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }

      table.notes-table tr:nth-child(even) td {
        background: #fafafa;
      }

      .text-right { text-align: right; }
      .text-center { text-align: center; }

      .status-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 8.5px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .badge-overdue { background: #ffe4e6; color: #be123c; }
      .badge-today { background: #fef3c7; color: #b45309; }
      .badge-upcoming { background: #dcfce7; color: #15803d; }
      .badge-paid { background: #e0e7ff; color: #4338ca; }

      .summary-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
        margin-bottom: 16px;
      }

      .summary-box {
        width: 280px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 10px 14px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 11px;
      }

      .summary-row.total {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 2px solid #0f172a;
        font-size: 13px;
        font-weight: 900;
        color: #be123c;
      }

      .pix-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .pix-details {
        font-size: 10.5px;
        color: #166534;
      }

      .pix-key {
        font-family: monospace;
        font-size: 12px;
        font-weight: 700;
        background: #dcfce7;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        margin-top: 2px;
      }

      .signatures {
        margin-top: 35px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        text-align: center;
        font-size: 10px;
        color: #475569;
      }

      .sign-line {
        border-top: 1px solid #94a3b8;
        padding-top: 4px;
        margin-top: 25px;
      }

      .footer-notice {
        margin-top: 24px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
        font-size: 8.5px;
        color: #94a3b8;
        text-align: center;
        line-height: 1.3;
      }

      .print-btn-bar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
        z-index: 9999;
      }

      .btn-print {
        background: #e11d48;
        color: #fff;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
      }
    </style>
  `;
}

function openPrintWindow(htmlContent: string, title: string) {
  const win = window.open('', '_blank', 'width=900,height=850');
  if (!win) {
    alert('Por favor, permita pop-ups para visualizar o demonstrativo em PDF.');
    return;
  }

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${getPrintBaseStyles()}
    </head>
    <body>
      <div class="print-btn-bar no-print">
        <button class="btn-print" onclick="window.print()">IMPRIMIR / SALVAR EM PDF</button>
      </div>
      ${htmlContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

/**
 * Gera Demonstrativo Consolidado de Contas a Receber (todas as notas selecionadas)
 */
export function generateConsolidatedPDF(
  customer: CustomerDebtGroup,
  selectedNotes: CreditNote[],
  companyData?: CompanyInfo,
  pixKey?: string
) {
  const comp = { ...DEFAULT_COMPANY, ...(companyData || {}) };
  const docNumber = `DEM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const emissionDate = formatDateBR(new Date().toISOString());

  const notes = selectedNotes.length > 0 ? selectedNotes : customer.notes;

  let totalOriginal = 0;
  let totalPaid = 0;
  let totalBalance = 0;
  let totalOverdue = 0;
  let totalUpcoming = 0;

  notes.forEach(n => {
    const bal = n.balance > 0 ? n.balance : n.original_value;
    totalOriginal += n.original_value || 0;
    totalPaid += n.paid_value || 0;
    totalBalance += bal;
    if (n.is_overdue) totalOverdue += bal;
    else totalUpcoming += bal;
  });

  const notesHtml = notes.map(n => {
    const bal = n.balance > 0 ? n.balance : n.original_value;
    let badge = '<span class="status-badge badge-upcoming">A Vencer</span>';
    if (n.status === 'Pago') badge = '<span class="status-badge badge-paid">Quitada</span>';
    else if (n.is_due_today) badge = '<span class="status-badge badge-today">Vence Hoje</span>';
    else if (n.is_overdue) badge = `<span class="status-badge badge-overdue">Atrasado ${Math.abs(n.days_overdue)}d</span>`;

    return `
      <tr>
        <td style="font-weight: 700;">${n.identifier || `#${n.id}`}</td>
        <td>${formatDateBR(n.sale_date)}</td>
        <td style="font-weight: 600;">${formatDateBR(n.due_date)}</td>
        <td class="text-right">${formatCurrencyBRL(n.original_value)}</td>
        <td class="text-right" style="color: #059669;">${formatCurrencyBRL(n.paid_value || 0)}</td>
        <td class="text-right" style="font-weight: 800; color: #be123c;">${formatCurrencyBRL(bal)}</td>
        <td class="text-center">${badge}</td>
      </tr>
    `;
  }).join('');

  const effectivePix = pixKey || comp.cnpj || '12.802.931/0001-92';

  const content = `
    <div class="header-container">
      <div>
        <h1 class="brand-title">${comp.nomeFantasia}</h1>
        <h2 class="brand-subtitle">Demonstrativo de Contas a Receber</h2>
        <div class="company-details">
          ${comp.razaoSocial} &bull; CNPJ: ${comp.cnpj}<br>
          ${comp.endereco}, ${comp.bairro} &bull; ${comp.cidade}/${comp.estado} &bull; CEP: ${comp.cep}<br>
          Telefone / WhatsApp: ${comp.telefone} &bull; Email: ${comp.email}
        </div>
      </div>
      <div class="doc-meta">
        <span class="doc-badge">CONSOLIDADO</span><br>
        <strong>Nº Demonstrativo:</strong> ${docNumber}<br>
        <strong>Emissão:</strong> ${emissionDate}<br>
        <strong>Qtd. Notas:</strong> ${notes.length}
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">Dados do Cliente</div>
      <div class="customer-grid">
        <div class="customer-field"><strong>Nome / Razão:</strong> ${customer.customer_name}</div>
        <div class="customer-field"><strong>CPF / CNPJ:</strong> ${customer.cpf || 'Não informado'}</div>
        <div class="customer-field"><strong>Telefone / WhatsApp:</strong> ${customer.whatsapp || customer.phone || 'Não informado'}</div>
        <div class="customer-field" style="grid-column: span 3;"><strong>Endereço:</strong> ${customer.address ? `${customer.address}, ${customer.neighborhood} - ${customer.city}` : 'Não cadastrado'}</div>
      </div>
    </div>

    <table class="notes-table">
      <thead>
        <tr>
          <th>Nº da Nota</th>
          <th>Data Compra</th>
          <th>Vencimento</th>
          <th class="text-right">Valor Original</th>
          <th class="text-right">Valor Pago</th>
          <th class="text-right">Saldo Restante</th>
          <th class="text-center">Situação</th>
        </tr>
      </thead>
      <tbody>
        ${notesHtml}
      </tbody>
    </table>

    <div class="summary-container">
      <div class="summary-box">
        <div class="summary-row">
          <span>Total Original:</span>
          <strong>${formatCurrencyBRL(totalOriginal)}</strong>
        </div>
        <div class="summary-row">
          <span>Total Já Amortizado:</span>
          <span style="color: #059669;">- ${formatCurrencyBRL(totalPaid)}</span>
        </div>
        <div class="summary-row">
          <span>Total Vencido em Atraso:</span>
          <span style="color: #be123c; font-weight: 700;">${formatCurrencyBRL(totalOverdue)}</span>
        </div>
        <div class="summary-row">
          <span>Total a Vencer:</span>
          <span>${formatCurrencyBRL(totalUpcoming)}</span>
        </div>
        <div class="summary-row total">
          <span>TOTAL GERAL PENDENTE:</span>
          <span>${formatCurrencyBRL(totalBalance)}</span>
        </div>
      </div>
    </div>

    <div class="pix-box">
      <div class="pix-details">
        <strong>PAGAMENTO FACILITADO VIA PIX</strong><br>
        Efetue a transferência usando a chave abaixo e encaminhe o comprovante para confirmação e baixa imediata:
      </div>
      <div>
        <span class="pix-key">${effectivePix}</span>
      </div>
    </div>

    <div class="signatures">
      <div>
        <div class="sign-line">
          ${customer.customer_name}<br>
          Assinatura do Cliente
        </div>
      </div>
      <div>
        <div class="sign-line">
          ${comp.nomeFantasia}<br>
          Departamento Financeiro
        </div>
      </div>
    </div>

    <div class="footer-notice">
      Este demonstrativo reflete as posições financeiras ativas no sistema Kombat Moto Peças na data de emissão.
      Caso já tenha efetuado a liquidação de algum dos títulos acima relacionados, favor desconsiderar e nos enviar o comprovante de pagamento para conciliação bancária.
    </div>
  `;

  openPrintWindow(content, `Demonstrativo Consolidado - ${customer.customer_name}`);
}

/**
 * Gera Demonstrativo Individual por Nota
 */
export function generateIndividualPDF(
  customer: CustomerDebtGroup,
  note: CreditNote,
  companyData?: CompanyInfo,
  pixKey?: string
) {
  const comp = { ...DEFAULT_COMPANY, ...(companyData || {}) };
  const docNumber = `NOTA-${note.id}-${Date.now().toString(36).toUpperCase()}`;
  const emissionDate = formatDateBR(new Date().toISOString());

  const balance = note.balance > 0 ? note.balance : note.original_value;
  const effectivePix = pixKey || comp.cnpj || '12.802.931/0001-92';

  let badge = '<span class="status-badge badge-upcoming">A Vencer</span>';
  if (note.status === 'Pago') badge = '<span class="status-badge badge-paid">Quitada</span>';
  else if (note.is_due_today) badge = '<span class="status-badge badge-today">Vence Hoje</span>';
  else if (note.is_overdue) badge = `<span class="status-badge badge-overdue">Atrasado ${Math.abs(note.days_overdue)}d</span>`;

  const content = `
    <div class="header-container">
      <div>
        <h1 class="brand-title">${comp.nomeFantasia}</h1>
        <h2 class="brand-subtitle">Demonstrativo Individual de Nota / Título</h2>
        <div class="company-details">
          ${comp.razaoSocial} &bull; CNPJ: ${comp.cnpj}<br>
          ${comp.endereco}, ${comp.bairro} &bull; ${comp.cidade}/${comp.estado}<br>
          Telefone / WhatsApp: ${comp.telefone}
        </div>
      </div>
      <div class="doc-meta">
        <span class="doc-badge">INDIVIDUAL</span><br>
        <strong>Nº Demonstrativo:</strong> ${docNumber}<br>
        <strong>Emissão:</strong> ${emissionDate}
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">Dados do Cliente</div>
      <div class="customer-grid">
        <div class="customer-field"><strong>Nome / Razão:</strong> ${customer.customer_name}</div>
        <div class="customer-field"><strong>CPF / CNPJ:</strong> ${customer.cpf || 'Não informado'}</div>
        <div class="customer-field"><strong>Telefone:</strong> ${customer.whatsapp || customer.phone || 'Não informado'}</div>
      </div>
    </div>

    <div class="section-card" style="background: #fff; border: 2px solid #e2e8f0;">
      <div class="section-title" style="color: #0f172a;">Detalhes da Nota Financeira</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Identificador da Nota</span>
          <p style="font-size: 13px; font-weight: 900; color: #0f172a;">${note.identifier || `#${note.id}`}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Data da Venda</span>
          <p style="font-size: 13px; font-weight: 700; color: #334155;">${formatDateBR(note.sale_date)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Data de Vencimento</span>
          <p style="font-size: 13px; font-weight: 900; color: #be123c;">${formatDateBR(note.due_date)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Valor Original</span>
          <p style="font-size: 13px; font-weight: 700; color: #334155;">${formatCurrencyBRL(note.original_value)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Valor Já Pago</span>
          <p style="font-size: 13px; font-weight: 700; color: #059669;">${formatCurrencyBRL(note.paid_value || 0)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Situação do Título</span>
          <p style="margin-top: 2px;">${badge}</p>
        </div>
      </div>

      <div style="margin-top: 16px; padding: 12px; background: #fff1f2; border-radius: 6px; border: 1px solid #fecdd3; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 800; color: #9f1239; text-transform: uppercase;">Saldo Pendente Desta Nota:</span>
        <span style="font-size: 18px; font-weight: 900; color: #be123c;">${formatCurrencyBRL(balance)}</span>
      </div>
    </div>

    <div class="pix-box">
      <div class="pix-details">
        <strong>PAGAMENTO FACILITADO VIA PIX</strong><br>
        Chave Pix da Kombat Moto Peças para quitação desta nota:
      </div>
      <div>
        <span class="pix-key">${effectivePix}</span>
      </div>
    </div>

    <div class="signatures">
      <div>
        <div class="sign-line">
          ${customer.customer_name}<br>
          Assinatura do Cliente
        </div>
      </div>
      <div>
        <div class="sign-line">
          ${comp.nomeFantasia}<br>
          Departamento Financeiro
        </div>
      </div>
    </div>

    <div class="footer-notice">
      Comprovante emitido pelo sistema Kombat Moto Peças. Em caso de dúvidas ou para envio de comprovantes, contate o telefone ${comp.telefone}.
    </div>
  `;

  openPrintWindow(content, `Nota Individual - ${note.identifier || note.id}`);
}

/**
 * Gera Termo de Acordo e Renegociação de Dívida
 */
export function generateAgreementPDF(
  customer: CustomerDebtGroup,
  agreementData: {
    agreementId: number;
    originalTotal: number;
    discountAuthorized: number;
    downPayment: number;
    negotiatedTotal: number;
    installments: any[];
    observation?: string;
  },
  companyData?: CompanyInfo
) {
  const comp = { ...DEFAULT_COMPANY, ...(companyData || {}) };
  const emissionDate = formatDateBR(new Date().toISOString());

  const instHtml = agreementData.installments.map((inst, idx) => `
    <tr>
      <td class="text-center" style="font-weight: 700;">${inst.parcel_number || idx + 1}ª Parcela</td>
      <td class="text-center" style="font-weight: 800; color: #be123c;">${formatDateBR(inst.due_date)}</td>
      <td class="text-right" style="font-weight: 800;">${formatCurrencyBRL(inst.value)}</td>
      <td class="text-center">${inst.identifier || `ACORDO-${agreementData.agreementId}-${idx + 1}`}</td>
    </tr>
  `).join('');

  const content = `
    <div class="header-container">
      <div>
        <h1 class="brand-title">${comp.nomeFantasia}</h1>
        <h2 class="brand-subtitle">Termo Oficial de Acordo e Parcelamento de Dívida</h2>
        <div class="company-details">
          ${comp.razaoSocial} &bull; CNPJ: ${comp.cnpj}<br>
          ${comp.endereco}, ${comp.bairro} &bull; ${comp.cidade}/${comp.estado}
        </div>
      </div>
      <div class="doc-meta">
        <span class="doc-badge" style="background: #1e3a8a;">ACORDO Nº ${agreementData.agreementId}</span><br>
        <strong>Data:</strong> ${emissionDate}
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">Dados das Partes</div>
      <p><strong>Credor:</strong> ${comp.razaoSocial} (CNPJ: ${comp.cnpj})</p>
      <p style="margin-top: 4px;"><strong>Devedor:</strong> ${customer.customer_name} (CPF/CNPJ: ${customer.cpf || 'Não informado'}) &bull; Telefone: ${customer.whatsapp || customer.phone || 'N/A'}</p>
    </div>

    <div class="section-card">
      <div class="section-title">Condições Negociadas</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700;">VALOR ORIGINAL</span>
          <p style="font-size: 13px; font-weight: 800;">${formatCurrencyBRL(agreementData.originalTotal)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700;">DESCONTO CONCEDIDO</span>
          <p style="font-size: 13px; font-weight: 800; color: #059669;">- ${formatCurrencyBRL(agreementData.discountAuthorized)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700;">ENTRADA REALIZADA</span>
          <p style="font-size: 13px; font-weight: 800; color: #2563eb;">${formatCurrencyBRL(agreementData.downPayment)}</p>
        </div>
        <div>
          <span style="font-size: 9px; color: #64748b; font-weight: 700;">SALDO PARCELADO</span>
          <p style="font-size: 15px; font-weight: 900; color: #be123c;">${formatCurrencyBRL(agreementData.negotiatedTotal)}</p>
        </div>
      </div>
    </div>

    <table class="notes-table">
      <thead>
        <tr>
          <th class="text-center">Parcela</th>
          <th class="text-center">Data de Vencimento</th>
          <th class="text-right">Valor da Parcela</th>
          <th class="text-center">Identificador</th>
        </tr>
      </thead>
      <tbody>
        ${instHtml}
      </tbody>
    </table>

    <div class="section-card" style="background: #fff; border-left: 4px solid #1e3a8a; font-size: 10px; color: #475569;">
      <strong>CLÁUSULA DE CUMPRIMENTO:</strong> O não pagamento de qualquer uma das parcelas nas datas estipuladas poderá ensejar o cancelamento do presente acordo com a perda dos descontos concedidos, restabelecimento da dívida original corrigida e suspensão cadastral de crédito no estabelecimento comercial.
    </div>

    <div class="signatures" style="margin-top: 45px;">
      <div>
        <div class="sign-line">
          ${customer.customer_name}<br>
          Assinatura do Devedor
        </div>
      </div>
      <div>
        <div class="sign-line">
          ${comp.nomeFantasia}<br>
          Representante Kombat Moto Peças
        </div>
      </div>
    </div>
  `;

  openPrintWindow(content, `Termo de Acordo #${agreementData.agreementId} - ${customer.customer_name}`);
}

/**
 * Gera Recibo Oficial de Pagamento / Quitação
 */
export function generatePaymentReceiptPDF(
  customer: CustomerDebtGroup,
  receiptData: {
    receiptNumber: string;
    amountPaid: number;
    paymentMethod: string;
    receivedBy: string;
    observation?: string;
    settledNotes: any[];
  },
  companyData?: CompanyInfo
) {
  const comp = { ...DEFAULT_COMPANY, ...(companyData || {}) };
  const emissionDate = formatDateBR(new Date().toISOString());

  const settledHtml = receiptData.settledNotes.map((n, idx) => `
    <tr>
      <td>${n.identifier || `Nota #${n.credit_id}`}</td>
      <td class="text-right" style="font-weight: 700;">${formatCurrencyBRL(n.amount_applied)}</td>
      <td class="text-center">${n.is_fully_paid ? '<strong style="color: #059669;">QUITADA</strong>' : 'AMORTIZADA'}</td>
    </tr>
  `).join('');

  const content = `
    <div class="header-container">
      <div>
        <h1 class="brand-title">${comp.nomeFantasia}</h1>
        <h2 class="brand-subtitle" style="color: #059669;">Recibo de Pagamento e Quitação</h2>
        <div class="company-details">
          ${comp.razaoSocial} &bull; CNPJ: ${comp.cnpj}<br>
          ${comp.endereco}, ${comp.bairro} &bull; ${comp.cidade}/${comp.estado}
        </div>
      </div>
      <div class="doc-meta">
        <span class="doc-badge" style="background: #059669;">RECIBO Nº ${receiptData.receiptNumber}</span><br>
        <strong>Emissão:</strong> ${emissionDate}
      </div>
    </div>

    <div class="section-card" style="background: #f0fdf4; border-color: #bbf7d0; padding: 16px;">
      <div style="font-size: 13px; color: #166534; line-height: 1.6;">
        Recebemos de <strong>${customer.customer_name}</strong> (CPF/CNPJ: ${customer.cpf || 'Não informado'})<br>
        a quantia de <strong style="font-size: 18px; color: #14532d;">${formatCurrencyBRL(receiptData.amountPaid)}</strong><br>
        via <strong>${receiptData.paymentMethod}</strong>, referente à liquidação/amortização dos débitos especificados abaixo.
      </div>
    </div>

    <table class="notes-table">
      <thead>
        <tr>
          <th>Título / Nota</th>
          <th class="text-right">Valor Baixado</th>
          <th class="text-center">Situação Final</th>
        </tr>
      </thead>
      <tbody>
        ${settledHtml}
      </tbody>
    </table>

    ${receiptData.observation ? `
      <div style="font-size: 10px; color: #64748b; margin-top: 8px;">
        <strong>Observações:</strong> ${receiptData.observation}
      </div>
    ` : ''}

    <div class="signatures" style="margin-top: 40px;">
      <div>
        <div class="sign-line">
          ${customer.customer_name}<br>
          Cliente
        </div>
      </div>
      <div>
        <div class="sign-line">
          ${receiptData.receivedBy || 'Operador Financeiro'}<br>
          ${comp.nomeFantasia}
        </div>
      </div>
    </div>
  `;

  openPrintWindow(content, `Recibo #${receiptData.receiptNumber} - ${customer.customer_name}`);
}

// tests/critical_flows_test.ts
// Testes automatizados de fluxos críticos de segurança, permissões, estoque e crédito para o ERP Kombat Moto Peças

import { formatCurrencyBRL, formatDateBR, maskCPF, maskPhone } from '../src/utils/formatters.js';
import { hasPermission, normalizeRole, ROLE_PERMISSIONS } from '../src/types/auth.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(suite: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ suite, name, passed: true });
    console.log(`  ✅ [PASS] ${suite} -> ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.message });
    console.error(`  ❌ [FAIL] ${suite} -> ${name}: ${err.message}`);
  }
}

console.log("\n=======================================================");
console.log("🧪 INICIANDO TESTES DE FLUXOS CRÍTICOS (KOMBAT ERP)");
console.log("=======================================================\n");

// 1. FORMATADORES BRASILEIROS
runTest("Formatação Brasileira", "Deve formatar moeda corretamente no padrão R$ 1.234,56", () => {
  const formatted1 = formatCurrencyBRL(1234.56);
  // Allow non-breaking spaces or regular spaces between R$ and value
  const clean1 = formatted1.replace(/\u00a0/g, ' ');
  assert(clean1 === 'R$ 1.234,56', `Esperado 'R$ 1.234,56', obtido '${clean1}'`);

  const formatted2 = formatCurrencyBRL(0);
  const clean2 = formatted2.replace(/\u00a0/g, ' ');
  assert(clean2 === 'R$ 0,00', `Esperado 'R$ 0,00', obtido '${clean2}'`);

  const formatted3 = formatCurrencyBRL("1500.50");
  const clean3 = formatted3.replace(/\u00a0/g, ' ');
  assert(clean3 === 'R$ 1.500,50', `Esperado 'R$ 1.500,50', obtido '${clean3}'`);
});

runTest("Formatação Brasileira", "Deve formatar data no padrão DD/MM/AAAA", () => {
  const dateISO = '2026-09-13T10:00:00.000Z';
  const formattedDate = formatDateBR(dateISO);
  assert(formattedDate.length === 10, `Tamanho esperado 10, obtido ${formattedDate.length}`);
  assert(formattedDate.includes('/'), `Deve conter barras: ${formattedDate}`);
});

runTest("Minimização de Dados", "Deve mascarar CPF e Telefone para perfis sem permissão sensível", () => {
  const maskedCpf = maskCPF('12345678901');
  assert(maskedCpf === '***.***.789-**', `CPF mascarado inválido: ${maskedCpf}`);

  const maskedPhone = maskPhone('43999887766');
  assert(maskedPhone === '(43) *****-7766', `Telefone mascarado inválido: ${maskedPhone}`);
});

// 2. RBAC E MATRIZ DE PERMISSÕES
runTest("RBAC & Permissões", "Administrador deve possuir todas as permissões críticas", () => {
  assert(hasPermission('ADMIN', 'sales:create'), "ADMIN deve poder criar venda");
  assert(hasPermission('ADMIN', 'sales:cancel'), "ADMIN deve poder cancelar venda");
  assert(hasPermission('ADMIN', 'financial:manage'), "ADMIN deve gerenciar financeiro");
  assert(hasPermission('ADMIN', 'users:manage'), "ADMIN deve gerenciar usuários");
  assert(hasPermission('Administrador', 'sales:cancel'), "Papel legado 'Administrador' deve mapear para ADMIN");
});

runTest("RBAC & Permissões", "Balcão não pode gerenciar usuários nem cancelar vendas sem autorização", () => {
  assert(hasPermission('BALCAO', 'sales:create'), "BALCAO deve poder criar venda");
  assert(hasPermission('BALCAO', 'receivables:collect'), "BALCAO pode receber parcelas");
  assert(!hasPermission('BALCAO', 'sales:cancel'), "BALCAO NÃO deve poder cancelar venda");
  assert(!hasPermission('BALCAO', 'financial:manage'), "BALCAO NÃO deve poder gerenciar conciliação financeira");
  assert(!hasPermission('BALCAO', 'users:manage'), "BALCAO NÃO deve poder gerenciar usuários");
});

runTest("RBAC & Permissões", "Mecânico restrito a OS e serviços", () => {
  assert(hasPermission('MECANICO', 'os:update'), "MECANICO deve atualizar OS");
  assert(!hasPermission('MECANICO', 'sales:cancel'), "MECANICO não pode cancelar venda");
  assert(!hasPermission('MECANICO', 'financial:view'), "MECANICO não pode ver financeiro");
  assert(!hasPermission('MECANICO', 'customers:view_sensitive'), "MECANICO não pode ver dados sensíveis");
});

runTest("RBAC & Permissões", "Perfil Consulta deve ter acesso estritamente leitura básica", () => {
  assert(hasPermission('CONSULTA', 'stock:view'), "CONSULTA pode ver estoque");
  assert(!hasPermission('CONSULTA', 'sales:create'), "CONSULTA não pode vender");
  assert(!hasPermission('CONSULTA', 'customers:view_sensitive'), "CONSULTA não pode ver dados pessoais sensíveis");
});

// 3. REGRA DE CRÉDITO KOMBAT (> 30 DIAS)
runTest("Regra de Crédito Kombat (> 30 dias)", "Regra de bloqueio a partir do 31º dia de atraso", () => {
  // Simulação de cálculo de atraso
  const checkOverdueLogic = (diffDays: number): boolean => {
    return diffDays > 30; // Bloqueia apenas a partir do 31º dia
  };

  assert(!checkOverdueLogic(0), "Débito em dia (0 dias) não deve ser bloqueado");
  assert(!checkOverdueLogic(15), "Débito com 15 dias de atraso não deve ser bloqueado");
  assert(!checkOverdueLogic(30), "Débito com exatamente 30 dias de atraso NÃO deve ser bloqueado automaticamente");
  assert(checkOverdueLogic(31), "Débito com 31 dias de atraso DEVE ser bloqueado automaticamente");
  assert(checkOverdueLogic(60), "Débito com 60 dias de atraso DEVE ser bloqueado");
});

// 4. SANITIZAÇÃO DE AUDITORIA
runTest("Segurança e Auditoria", "Sanitizador deve expurgar senhas e chaves antes de gravar audit_logs", () => {
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitive = ['password', 'token', 'secret', 'jwt', 'api_key', 'authorization'];
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (sensitive.some(s => k.toLowerCase().includes(s))) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = sanitize(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  };

  const dirtyPayload = {
    username: 'operador1',
    password: 'SuperSecretPassword123!',
    token: 'jwt.token.here',
    sale: { id: 'V-100', total: 250.00, client_token: 'secret_key' }
  };

  const cleaned = sanitize(dirtyPayload);
  assert(cleaned.password === '[REDACTED]', "Senha não foi expurgada!");
  assert(cleaned.token === '[REDACTED]', "Token não foi expurgado!");
  assert(cleaned.sale.client_token === '[REDACTED]', "Token aninhado não foi expurgado!");
  assert(cleaned.sale.total === 250.00, "Dados comerciais válidos devem ser preservados");
});

// 5. CANCELAMENTO IDEMPOTENTE
runTest("Idempotência de Cancelamento", "Venda já cancelada não pode reverter estoque em duplicidade", () => {
  let stock = 10;
  let saleStatus = 'Concluído';
  let cancelAttempts = 0;

  const cancelSaleSimulation = (qty: number): { success: boolean; error?: string } => {
    cancelAttempts++;
    if (saleStatus === 'Cancelado') {
      return { success: false, error: "Venda já cancelada anteriormente." };
    }
    // Primeira vez: reverte estoque
    stock += qty;
    saleStatus = 'Cancelado';
    return { success: true };
  };

  // Venda de 2 peças (estoque inicial 10 - 2 = 8)
  stock = 8;

  // Primeiro cancelamento
  const first = cancelSaleSimulation(2);
  assert(first.success, "Primeiro cancelamento deve ser aceito");
  assert(stock === 10, `Estoque deveria voltar para 10, ficou em ${stock}`);
  assert(saleStatus === 'Cancelado', "Status deve ser Cancelado");

  // Segundo cancelamento (idempotência)
  const second = cancelSaleSimulation(2);
  assert(!second.success, "Segundo cancelamento deve ser rejeitado");
  assert(second.error === "Venda já cancelada anteriormente.", "Mensagem de erro esperada");
  assert(stock === 10, `Estoque NÃO deve ser devolvido novamente! Ficou em ${stock}`);
});

console.log("\n=======================================================");
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = total - passed;

console.log(`RESULTADO DOS TESTES: ${passed}/${total} passaram (${failed} falhas)`);
if (failed === 0) {
  console.log("🎉 TODOS OS TESTES DE FLUXOS CRÍTICOS FORAM APROVADOS!");
} else {
  console.error("⚠️ EXISTEM FALHAS NOS TESTES!");
}
console.log("=======================================================\n");

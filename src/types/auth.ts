// src/types/auth.ts
// Tipagem centralizada de RBAC com 5 Níveis de Acesso e Matriz Granular por Módulo

export type AppRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'MECANICO' | 'CONSULTA';

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: 'Administrador (Acesso Total)',
  GERENTE: 'Gerente (Operacional Amplo)',
  VENDEDOR: 'Vendedor (Vendas e Atendimento)',
  MECANICO: 'Mecânico (Oficina e Serviços)',
  CONSULTA: 'Consulta (Apenas Visualização)'
};

export type PermissionAction =
  | 'visualizar'
  | 'cadastrar'
  | 'editar'
  | 'excluir'
  | 'aprovar'
  | 'exportar'
  | 'administrar';

export const ACTION_LABELS: Record<PermissionAction, string> = {
  visualizar: 'Visualizar',
  cadastrar: 'Cadastrar',
  editar: 'Editar',
  excluir: 'Excluir',
  aprovar: 'Aprovar',
  exportar: 'Exportar',
  administrar: 'Administrar'
};

export type AppModule =
  | 'dashboard'
  | 'pdv'
  | 'orcamentos'
  | 'oficina'
  | 'estoque'
  | 'clientes'
  | 'crm'
  | 'whatsapp'
  | 'financeiro'
  | 'relatorios'
  | 'etiquetas'
  | 'biblioteca'
  | 'ia'
  | 'configuracoes';

export const MODULE_LABELS: Record<AppModule, { name: string; description: string }> = {
  dashboard: { name: 'Dashboard', description: 'Visão geral do negócio, métricas e faturamento' },
  pdv: { name: 'PDV / Caixa', description: 'Frente de caixa, realização de vendas e recebimentos' },
  orcamentos: { name: 'Orçamentos', description: 'Criação e aprovação de propostas comerciais' },
  oficina: { name: 'Oficina / OS', description: 'Ordens de serviço, agendamentos e pátio' },
  estoque: { name: 'Estoque', description: 'Catálogo de peças, preços, compras e inventário' },
  clientes: { name: 'Clientes', description: 'Cadastro de clientes, limite e análise de crédito' },
  crm: { name: 'CRM de Vendas', description: 'Funil de prospecção, leads e follow-ups' },
  whatsapp: { name: 'WhatsApp', description: 'Envio de comprovantes, pedidos e cobrança' },
  financeiro: { name: 'Financeiro', description: 'Fluxo de caixa, fiado, contas a pagar e receber' },
  relatorios: { name: 'Relatórios', description: 'Relatórios analíticos, gerenciais e fiscais' },
  etiquetas: { name: 'Etiquetas', description: 'Geração e impressão de etiquetas de produtos' },
  biblioteca: { name: 'Biblioteca', description: 'Catálogos de fabricantes, manuais e esquemas' },
  ia: { name: 'Inteligência Artificial', description: 'Assistente virtual Ozzy IA e automações' },
  configuracoes: { name: 'Configurações', description: 'Dados da empresa, usuários e permissões' }
};

export interface ModulePermissions {
  visualizar: boolean;
  cadastrar: boolean;
  editar: boolean;
  excluir: boolean;
  aprovar: boolean;
  exportar: boolean;
  administrar: boolean;
}

export type CustomPermissions = Partial<Record<AppModule, Partial<ModulePermissions>>> & {
  estoque_visualizar_custo?: boolean;
  pdv_desconto_livre?: boolean;
  pdv_cancelar_venda?: boolean;
};

export interface SystemUser {
  id: number;
  name?: string;
  username: string;
  email?: string;
  phone?: string;
  role: AppRole;
  active: boolean | number;
  custom_permissions?: string | CustomPermissions | null;
  last_login_at?: string;
  created_at?: string;
}

export interface UserSession {
  id: number;
  name?: string;
  username: string;
  role: AppRole;
  permissions?: string[];
  custom_permissions?: CustomPermissions | null;
  active?: boolean | number;
}

// Normalização segura e retrocompatível de papéis
export const normalizeRole = (role?: any): AppRole => {
  if (!role) return 'CONSULTA';
  const clean = String(role).trim().toUpperCase();
  if (clean === 'ADMIN' || clean === 'ADMINISTRADOR') return 'ADMIN';
  if (clean === 'GERENTE') return 'GERENTE';
  if (clean === 'VENDEDOR' || clean === 'BALCAO' || clean === 'ATENDENTE') return 'VENDEDOR';
  if (clean === 'MECANICO' || clean === 'MECÂNICO') return 'MECANICO';
  if (clean === 'FINANCEIRO') return 'GERENTE'; // Financeiro mapeado com acesso gerencial financeiro
  if (clean === 'CONSULTA') return 'CONSULTA';
  return 'CONSULTA';
};

// Verifica se o usuário possui status de Administrador
export const isAdmin = (userOrRole?: any): boolean => {
  if (!userOrRole) return false;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  return normalizeRole(role) === 'ADMIN';
};

// Matriz de permissões padrão para cada papel
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Record<AppModule, ModulePermissions> & {
  estoque_visualizar_custo: boolean;
  pdv_desconto_livre: boolean;
  pdv_cancelar_venda: boolean;
}> = {
  ADMIN: {
    dashboard: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    pdv: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    orcamentos: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    oficina: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    estoque: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    clientes: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    crm: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    whatsapp: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    financeiro: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    relatorios: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    etiquetas: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    biblioteca: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    ia: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    configuracoes: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: true },
    estoque_visualizar_custo: true,
    pdv_desconto_livre: true,
    pdv_cancelar_venda: true,
  },
  GERENTE: {
    dashboard: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: true, exportar: true, administrar: false },
    pdv: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    orcamentos: { visualizar: true, cadastrar: true, editar: true, excluir: true, aprovar: true, exportar: true, administrar: false },
    oficina: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    estoque: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    clientes: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    crm: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    whatsapp: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: false, administrar: false },
    financeiro: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: true, exportar: true, administrar: false },
    relatorios: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: true, administrar: false },
    etiquetas: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: true, administrar: false },
    biblioteca: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: true, administrar: false },
    ia: { visualizar: true, cadastrar: true, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    configuracoes: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque_visualizar_custo: true,
    pdv_desconto_livre: true,
    pdv_cancelar_venda: true,
  },
  VENDEDOR: {
    dashboard: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    pdv: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: false, administrar: false },
    orcamentos: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: true, administrar: false },
    oficina: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    clientes: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: false, administrar: false },
    crm: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: false, administrar: false },
    whatsapp: { visualizar: true, cadastrar: true, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    financeiro: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    relatorios: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    etiquetas: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    biblioteca: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    ia: { visualizar: true, cadastrar: true, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    configuracoes: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque_visualizar_custo: false, // Por padrão, vendedor não vê custo
    pdv_desconto_livre: false,
    pdv_cancelar_venda: false,
  },
  MECANICO: {
    dashboard: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    pdv: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    orcamentos: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    oficina: { visualizar: true, cadastrar: true, editar: true, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    clientes: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    crm: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    whatsapp: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    financeiro: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    relatorios: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    etiquetas: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    biblioteca: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    ia: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    configuracoes: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque_visualizar_custo: false,
    pdv_desconto_livre: false,
    pdv_cancelar_venda: false,
  },
  CONSULTA: {
    dashboard: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    pdv: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    orcamentos: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    oficina: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    clientes: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    crm: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    whatsapp: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    financeiro: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    relatorios: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    etiquetas: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    biblioteca: { visualizar: true, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    ia: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    configuracoes: { visualizar: false, cadastrar: false, editar: false, excluir: false, aprovar: false, exportar: false, administrar: false },
    estoque_visualizar_custo: false,
    pdv_desconto_livre: false,
    pdv_cancelar_venda: false,
  }
};

// Checagem granular de permissão para usuário
export const hasPermission = (
  userOrRole: any,
  moduleOrLegacyPermission: AppModule | string,
  action: PermissionAction = 'visualizar'
): boolean => {
  if (!userOrRole) return false;

  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const normRole = normalizeRole(role);

  // Administrador tem permissão irrestrita
  if (normRole === 'ADMIN') return true;

  // Se for objeto user com custom_permissions personalizadas
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    let custom = userOrRole.custom_permissions;
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch {}
    }
    if (custom && typeof custom === 'object') {
      const moduleKey = moduleOrLegacyPermission as AppModule;
      if (custom[moduleKey] && typeof custom[moduleKey][action] === 'boolean') {
        return custom[moduleKey][action];
      }
    }
  }

  // Fallback para matriz padrão do papel
  const defaultRole = DEFAULT_ROLE_PERMISSIONS[normRole];
  if (!defaultRole) return false;

  const mod = moduleOrLegacyPermission as AppModule;
  if (defaultRole[mod] && typeof defaultRole[mod][action] === 'boolean') {
    return defaultRole[mod][action];
  }

  return false;
};

// Helper para verificar se usuário pode ver preço de custo no estoque
export const canViewCostPrice = (userOrRole: any): boolean => {
  if (!userOrRole) return false;
  if (isAdmin(userOrRole)) return true;

  if (typeof userOrRole === 'object' && userOrRole !== null) {
    let custom = userOrRole.custom_permissions;
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch {}
    }
    if (custom && typeof custom.estoque_visualizar_custo === 'boolean') {
      return custom.estoque_visualizar_custo;
    }
  }

  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const normRole = normalizeRole(role);
  return DEFAULT_ROLE_PERMISSIONS[normRole]?.estoque_visualizar_custo ?? false;
};


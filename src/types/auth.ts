// src/types/auth.ts
// Tipagem centralizada de RBAC com matriz granular de permissões

export type AppRole = 'ADMIN' | 'BALCAO' | 'MECANICO' | 'FINANCEIRO' | 'CONSULTA';

export type Permission =
  | 'sales:create'
  | 'sales:cancel'
  | 'sales:discount'
  | 'receivables:collect'
  | 'financial:manage'
  | 'financial:view'
  | 'os:create'
  | 'os:update'
  | 'os:cancel'
  | 'stock:view'
  | 'stock:adjust'
  | 'customers:view_sensitive'
  | 'users:manage';

export interface UserSession {
  id: number;
  username: string;
  role: AppRole;
  permissions: Permission[];
}

// Mapeamento retrocompatível de papéis legados
export const normalizeRole = (role?: string): AppRole => {
  if (!role) return 'CONSULTA';
  const clean = role.trim().toUpperCase();
  if (clean === 'ADMIN' || clean === 'ADMINISTRADOR') return 'ADMIN';
  if (clean === 'BALCAO' || clean === 'ATENDENTE') return 'BALCAO';
  if (clean === 'MECANICO' || clean === 'MECÂNICO') return 'MECANICO';
  if (clean === 'FINANCEIRO') return 'FINANCEIRO';
  if (clean === 'CONSULTA') return 'CONSULTA';
  return 'CONSULTA';
};

// Matriz de permissões por perfil
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ADMIN: [
    'sales:create',
    'sales:cancel',
    'sales:discount',
    'receivables:collect',
    'financial:manage',
    'financial:view',
    'os:create',
    'os:update',
    'os:cancel',
    'stock:view',
    'stock:adjust',
    'customers:view_sensitive',
    'users:manage',
  ],
  BALCAO: [
    'sales:create',
    'receivables:collect',
    'os:create',
    'stock:view',
    'customers:view_sensitive',
  ],
  MECANICO: [
    'os:create',
    'os:update',
    'stock:view',
  ],
  FINANCEIRO: [
    'receivables:collect',
    'financial:manage',
    'financial:view',
    'stock:view',
    'stock:adjust',
    'customers:view_sensitive',
  ],
  CONSULTA: [
    'stock:view',
  ],
};

export const hasPermission = (role: string | undefined, permission: Permission): boolean => {
  const normRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normRole] || [];
  return permissions.includes(permission);
};

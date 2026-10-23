import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Trash2,
  Key,
  X,
  AlertTriangle,
  CheckCircle,
  Ban,
  Lock,
  Unlock,
  Edit3,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Briefcase,
  ShoppingBag,
  Wrench,
  Clock,
  FileText,
  Check,
  Plus,
  AlertCircle,
  Sparkles,
  Filter,
  Save,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Sliders
} from 'lucide-react';
import {
  AppRole,
  AppModule,
  PermissionAction,
  ROLE_LABELS,
  ACTION_LABELS,
  MODULE_LABELS,
  ModulePermissions,
  CustomPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  normalizeRole,
  isAdmin
} from '../types/auth';

export interface UserManagementUser {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: AppRole;
  active: boolean;
  custom_permissions?: CustomPermissions | null;
  last_login_at?: string;
  created_at?: string;
}

interface UserManagementModuleProps {
  currentUser: {
    id: number;
    username: string;
    name?: string;
    role: string;
    custom_permissions?: any;
  };
  onUserUpdated?: () => void;
}

const ALL_MODULES: AppModule[] = [
  'dashboard',
  'pdv',
  'orcamentos',
  'oficina',
  'estoque',
  'clientes',
  'crm',
  'whatsapp',
  'financeiro',
  'relatorios',
  'etiquetas',
  'biblioteca',
  'ia',
  'configuracoes'
];

const ALL_ACTIONS: PermissionAction[] = [
  'visualizar',
  'cadastrar',
  'editar',
  'excluir',
  'aprovar',
  'exportar',
  'administrar'
];

export default function UserManagementModule({ currentUser, onUserUpdated }: UserManagementModuleProps) {
  const [usersList, setUsersList] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AppRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  // Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Seleções para modais
  const [selectedUser, setSelectedUser] = useState<UserManagementUser | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [modalTab, setModalTab] = useState<'dados' | 'permissoes'>('dados');

  // Form de Usuário
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('VENDEDOR');
  const [formActive, setFormActive] = useState(true);
  const [formCustomPerms, setFormCustomPerms] = useState<CustomPermissions>({});
  const [submitting, setSubmitting] = useState(false);

  // Form de Redefinição de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Histórico
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Claim Owner
  const [claimKey, setClaimKey] = useState('');
  const [claiming, setClaiming] = useState(false);

  const isCurrentAdmin = isAdmin(currentUser);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 6000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao carregar colaboradores');
      }

      const data = await res.json();
      setUsersList(Array.isArray(data) ? data : []);
      setErrorMsg('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao buscar colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  // Filtragem dos Usuários
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone || '').includes(searchTerm);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.active) ||
        (statusFilter === 'BLOCKED' && !u.active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter]);

  // Contadores
  const stats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter(u => u.active).length;
    const admins = usersList.filter(u => u.role === 'ADMIN').length;
    const blocked = usersList.filter(u => !u.active).length;
    return { total, active, admins, blocked };
  }, [usersList]);

  // Abrir Modal de Criação
  const handleOpenCreateModal = () => {
    setIsCreatingNew(true);
    setSelectedUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('VENDEDOR');
    setFormActive(true);
    setFormCustomPerms(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS.VENDEDOR)));
    setModalTab('dados');
    setIsEditModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (u: UserManagementUser) => {
    setIsCreatingNew(false);
    setSelectedUser(u);
    setFormName(u.name || u.username);
    setFormUsername(u.username);
    setFormPassword('');
    setFormEmail(u.email || '');
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setFormActive(u.active);

    // Inicializa permissões: customizadas se existirem, ou as padrões da role
    const initialPerms = u.custom_permissions
      ? JSON.parse(JSON.stringify(u.custom_permissions))
      : JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.VENDEDOR));
    setFormCustomPerms(initialPerms);

    setModalTab('dados');
    setIsEditModalOpen(true);
  };

  // Troca de Role no Formulario: Atualiza matriz de permissões se o usuário desejar
  const handleRoleChangeInForm = (newRole: AppRole) => {
    setFormRole(newRole);
    // Carrega permissões padrões da nova role selecionada
    const defaultForNewRole = DEFAULT_ROLE_PERMISSIONS[newRole];
    if (defaultForNewRole) {
      setFormCustomPerms(JSON.parse(JSON.stringify(defaultForNewRole)));
    }
  };

  // Carregar padrões da role manualmente
  const handleResetToRoleDefaults = () => {
    const defaultForRole = DEFAULT_ROLE_PERMISSIONS[formRole];
    if (defaultForRole) {
      setFormCustomPerms(JSON.parse(JSON.stringify(defaultForRole)));
      showNotification(`Matriz redefinida para os padrões de ${ROLE_LABELS[formRole]}`);
    }
  };

  // Toggle de Permissão Específica no Módulo
  const handleToggleModuleAction = (mod: AppModule, action: PermissionAction) => {
    setFormCustomPerms(prev => {
      const currentMod = prev[mod] || (DEFAULT_ROLE_PERMISSIONS[formRole]?.[mod] as ModulePermissions) || {
        visualizar: false,
        cadastrar: false,
        editar: false,
        excluir: false,
        aprovar: false,
        exportar: false,
        administrar: false
      };

      const updatedMod = {
        ...currentMod,
        [action]: !currentMod[action]
      };

      return {
        ...prev,
        [mod]: updatedMod
      };
    });
  };

  // Toggle de Permissão Especial (ex: visualizar custo)
  const handleToggleSpecialPerm = (key: 'estoque_visualizar_custo' | 'pdv_desconto_livre' | 'pdv_cancelar_venda') => {
    setFormCustomPerms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle de todas as ações de um módulo
  const handleToggleAllModuleActions = (mod: AppModule, targetState: boolean) => {
    setFormCustomPerms(prev => {
      const updatedMod: ModulePermissions = {
        visualizar: targetState,
        cadastrar: targetState,
        editar: targetState,
        excluir: targetState,
        aprovar: targetState,
        exportar: targetState,
        administrar: targetState
      };
      return {
        ...prev,
        [mod]: updatedMod
      };
    });
  };

  // Salvar Criação ou Edição
  const handleSubmitUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim()) {
      return alert('O nome de login (usuário) é obrigatório.');
    }
    if (isCreatingNew && (!formPassword || formPassword.length < 4)) {
      return alert('A senha inicial deve conter pelo menos 4 caracteres.');
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        name: formName.trim() || formUsername.trim(),
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        active: formActive,
        custom_permissions: formRole === 'ADMIN' ? null : formCustomPerms
      };

      let url = '/api/usuarios';
      let method = 'POST';

      if (isCreatingNew) {
        payload.password = formPassword;
      } else if (selectedUser) {
        url = `/api/usuarios/${selectedUser.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar colaborador.');
      }

      showNotification(data.message || 'Operação realizada com sucesso!');
      setIsEditModalOpen(false);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao processar formulário.');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal de Redefinir Senha
  const handleOpenPasswordModal = (u: UserManagementUser) => {
    setSelectedUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Submeter Redefinição de Senha
  const handleSubmitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 4) {
      return alert('A nova senha deve ter no mínimo 4 caracteres.');
    }
    if (newPassword !== confirmPassword) {
      return alert('As senhas digitadas não coincidem.');
    }

    setPasswordSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha.');

      showNotification(`Senha de ${selectedUser.username} alterada com sucesso!`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Falha ao redefinir senha.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Bloquear / Reativar Colaborador
  const handleToggleStatus = async (u: UserManagementUser) => {
    const actionName = u.active ? 'bloquear' : 'reativar';
    if (!confirm(`Deseja realmente ${actionName} o acesso do colaborador ${u.name || u.username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${u.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !u.active })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${actionName} usuário.`);

      showNotification(data.message || `Status de ${u.username} atualizado com sucesso!`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  // Excluir Colaborador
  const handleDeleteUser = async (u: UserManagementUser) => {
    if (u.id === currentUser.id) {
      return alert('Você não pode excluir o seu próprio usuário logado!');
    }

    if (!confirm(`Tem certeza que deseja excluir o colaborador '${u.name || u.username}'?\n\nCaso o usuário possua histórico contábil ou ordens de serviço, seu acesso será desativado com segurança para manter a integridade dos dados.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover colaborador.');

      showNotification(data.message || 'Colaborador removido com sucesso!');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao excluir colaborador.');
    }
  };

  // Abrir Modal de Histórico de Auditoria
  const handleOpenHistoryModal = async (u: UserManagementUser) => {
    setSelectedUser(u);
    setIsHistoryModalOpen(true);
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${u.id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Reivindicar Titularidade de Administrador (Owner Claim)
  const handleClaimOwner = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/usuarios/claim-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recoveryKey: claimKey })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao confirmar titularidade.');

      alert(data.message || 'Titularidade de Administrador atribuída com sucesso! Recarregando sistema...');
      setIsClaimModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Falha na verificação de titularidade.');
    } finally {
      setClaiming(false);
    }
  };

  // Formatação de Função (Badge)
  const renderRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield size={12} className="text-purple-600 dark:text-purple-400" />
            Administrador
          </span>
        );
      case 'GERENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Briefcase size={12} className="text-indigo-600 dark:text-indigo-400" />
            Gerente
          </span>
        );
      case 'VENDEDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShoppingBag size={12} className="text-emerald-600 dark:text-emerald-400" />
            Vendedor
          </span>
        );
      case 'MECANICO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Wrench size={12} className="text-amber-600 dark:text-amber-400" />
            Mecânico
          </span>
        );
      case 'CONSULTA':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Eye size={12} className="text-slate-500 dark:text-slate-400" />
            Consulta
          </span>
        );
    }
  };

  // Se o usuário logado não for Administrador e o backend bloquear, renderiza alerta seguro com opção de verificar titularidade
  if (!isCurrentAdmin) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-rose-50 text-rose-800 p-6 rounded-3xl border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 flex items-start gap-4">
          <AlertTriangle size={28} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-black uppercase tracking-wider">Acesso Restrito ao Painel de Segurança</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Apenas colaboradores com perfil de <strong>Administrador</strong> têm autorização para gerenciar a equipe, criar acessos e modificar privilégios no sistema Kombat Moto Peças.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                Sou o Proprietário (Verificar Titularidade)
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Reivindicação de Titularidade */}
        {isClaimModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldCheck size={22} />
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Verificação de Titularidade
                  </h3>
                </div>
                <button
                  onClick={() => setIsClaimModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Se a sua conta é a do proprietário e você necessita de privilégios de Administrador, o sistema fará a validação de segurança segura.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Chave Mestra de Segurança (ou Deixe em Branco se não houver Administradores ativos)
                </label>
                <input
                  type="password"
                  placeholder="Chave de segurança..."
                  value={claimKey}
                  onChange={e => setClaimKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClaimOwner}
                  disabled={claiming}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {claiming ? 'Verificando...' : 'Confirmar e Atribuir Administrador'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Notificações no Topo */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between dark:bg-rose-950/30 dark:border-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between dark:bg-emerald-950/30 dark:border-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X size={16} /></button>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl shadow-md shadow-rose-200 dark:shadow-none">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
              Usuários e Permissões
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie colaboradores, níveis de acesso, senhas e matriz granular de segurança
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all dark:bg-slate-700 dark:text-slate-200"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-100 dark:shadow-none transition-all"
          >
            <Plus size={16} />
            <span>+ Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Métricas e Cards Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl dark:bg-slate-900 dark:text-slate-300">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Usuários</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuários Ativos</p>
            <p className="text-lg font-black text-emerald-600">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl dark:bg-purple-950/40 dark:text-purple-400">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administradores</p>
            <p className="text-lg font-black text-purple-700 dark:text-purple-400">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950/40 dark:text-rose-400">
            <Ban size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bloqueados</p>
            <p className="text-lg font-black text-rose-600">{stats.blocked}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, login, email ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Função:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none text-xs pr-2 cursor-pointer"
            >
              <option value="ALL">Todas</option>
              <option value="ADMIN">Administrador</option>
              <option value="GERENTE">Gerente</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="MECANICO">Mecânico</option>
              <option value="CONSULTA">Consulta</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none text-xs pr-2 cursor-pointer"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-xs font-bold">Carregando usuários e permissões...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Nenhum colaborador encontrado.</p>
            <p className="text-[10px] text-slate-400">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Nome / Colaborador</th>
                  <th className="py-3.5 px-4">Login</th>
                  <th className="py-3.5 px-4">Função / Perfil</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Último Acesso</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map(u => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      {/* Colaborador */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : u.role === 'GERENTE'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : u.role === 'VENDEDOR'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : u.role === 'MECANICO'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {(u.name || u.username).substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {u.name || u.username}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 font-black uppercase px-2 py-0.5 rounded-full dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  Sua Conta
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {u.email || u.phone || 'Sem contato extra'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Login */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        @{u.username}
                      </td>

                      {/* Função */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(u.role)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Bloqueado
                          </span>
                        )}
                      </td>

                      {/* Último Acesso */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {u.last_login_at ? (
                          new Date(u.last_login_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">Nunca acessou</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Editar Dados & Permissões */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                            title="Editar Dados e Permissões"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Redefinir Senha */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all"
                            title="Redefinir Senha"
                          >
                            <Key size={15} />
                          </button>

                          {/* Bloquear / Reativar */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-all ${
                              u.active
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={u.active ? 'Bloquear Acesso' : 'Reativar Acesso'}
                          >
                            {u.active ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Histórico */}
                          <button
                            onClick={() => handleOpenHistoryModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                            title="Histórico de Atividades"
                          >
                            <FileText size={15} />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-20"
                            title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir Colaborador'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: NOVO OU EDITAR COLABORADOR & MATRIZ PERMISSÕES  */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950/40">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                    {isCreatingNew ? 'Cadastrar Novo Colaborador' : `Editar: ${selectedUser?.name || selectedUser?.username}`}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Defina dados de acesso e a matriz de permissões individual
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-abas do Modal */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 bg-white dark:bg-slate-900 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('dados')}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                  modalTab === 'dados'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <User size={15} />
                <span>1. Dados Cadastrais & Nível</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('permissoes')}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                  modalTab === 'permissoes'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sliders size={15} />
                <span>2. Matriz Granular de Permissões</span>
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleSubmitUserForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalTab === 'dados' && (
                <div className="space-y-6">
                  {/* Linha 1: Nome e Login */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Nome Completo do Colaborador *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Eduardo Silva"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Nome de Usuário / Login *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                          @
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="carlos.kombat"
                          value={formUsername}
                          onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Senha (apenas na criação) ou Opcional */}
                  {isCreatingNew && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Senha Inicial de Acesso *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 4 caracteres..."
                          value={formPassword}
                          onChange={e => setFormPassword(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="flex items-center text-[11px] text-slate-400 pt-5">
                        <span>A senha poderá ser alterada pelo administrador a qualquer momento.</span>
                      </div>
                    </div>
                  )}

                  {/* Linha 3: Contatos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        placeholder="colaborador@kombat.com.br"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="text"
                        placeholder="(67) 99999-9999"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Níveis de Acesso - 5 Níveis */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">
                      Selecione o Nível de Acesso (Perfil Base):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* ADMIN */}
                      <div
                        onClick={() => handleRoleChangeInForm('ADMIN')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formRole === 'ADMIN'
                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={16} className="text-purple-600" />
                          <span className="font-black text-xs uppercase text-purple-700 dark:text-purple-300">
                            1. Administrador
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Acesso irrestrito a todo o sistema, financeiro, custos, relatórios e gestão de segurança.
                        </p>
                      </div>

                      {/* GERENTE */}
                      <div
                        onClick={() => handleRoleChangeInForm('GERENTE')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formRole === 'GERENTE'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase size={16} className="text-indigo-600" />
                          <span className="font-black text-xs uppercase text-indigo-700 dark:text-indigo-300">
                            2. Gerente
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Acesso operacional amplo, financeiro, estoque e relatórios. Não altera administradores.
                        </p>
                      </div>

                      {/* VENDEDOR */}
                      <div
                        onClick={() => handleRoleChangeInForm('VENDEDOR')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formRole === 'VENDEDOR'
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag size={16} className="text-emerald-600" />
                          <span className="font-black text-xs uppercase text-emerald-700 dark:text-emerald-300">
                            3. Vendedor
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Frente de caixa (PDV), orçamentos, clientes e catálogo de peças (sem visualizar preços de custo).
                        </p>
                      </div>

                      {/* MECANICO */}
                      <div
                        onClick={() => handleRoleChangeInForm('MECANICO')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formRole === 'MECANICO'
                            ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Wrench size={16} className="text-amber-600" />
                          <span className="font-black text-xs uppercase text-amber-700 dark:text-amber-300">
                            4. Mecânico
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Acesso às ordens de serviço (OS), agendamentos do pátio e serviços da oficina.
                        </p>
                      </div>

                      {/* CONSULTA */}
                      <div
                        onClick={() => handleRoleChangeInForm('CONSULTA')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formRole === 'CONSULTA'
                            ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Eye size={16} className="text-slate-600" />
                          <span className="font-black text-xs uppercase text-slate-700 dark:text-slate-300">
                            5. Consulta
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Somente leitura nos módulos autorizados. Não pode cadastrar, alterar nem excluir dados.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status do Usuário */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={e => setFormActive(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                      />
                      <span>Colaborador Ativo (Pode fazer login no sistema)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ABA 2: MATRIZ GRANULAR DE PERMISSÕES */}
              {modalTab === 'permissoes' && (
                <div className="space-y-6">
                  {/* Banner de Ajuda / Admin */}
                  {formRole === 'ADMIN' ? (
                    <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl text-xs dark:bg-purple-950/20 dark:border-purple-800 flex items-start gap-3">
                      <Shield size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black uppercase tracking-wider mb-0.5">Perfil de Administrador</h4>
                        <p>
                          Como Administrador Geral, este colaborador tem acesso irrestrito a todos os módulos e ações do sistema Kombat por padrão.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Personalização Granular por Módulo
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Marque ou desmarque permissões individuais além do padrão do nível {ROLE_LABELS[formRole]}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToRoleDefaults}
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <RotateCcw size={12} />
                        Restaurar Padrão de {formRole}
                      </button>
                    </div>
                  )}

                  {/* Permissões Especiais de Segurança */}
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 tracking-wider flex items-center gap-1.5">
                      <Lock size={14} />
                      Permissões Críticas Especiais
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                        <input
                          type="checkbox"
                          checked={formRole === 'ADMIN' ? true : !!formCustomPerms.estoque_visualizar_custo}
                          disabled={formRole === 'ADMIN'}
                          onChange={() => handleToggleSpecialPerm('estoque_visualizar_custo')}
                          className="mt-0.5 text-rose-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Ver Preços de Custo</p>
                          <p className="text-[10px] text-slate-400">Permite ver valores de compra e margens de lucro no estoque</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                        <input
                          type="checkbox"
                          checked={formRole === 'ADMIN' ? true : !!formCustomPerms.pdv_desconto_livre}
                          disabled={formRole === 'ADMIN'}
                          onChange={() => handleToggleSpecialPerm('pdv_desconto_livre')}
                          className="mt-0.5 text-rose-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Desconto Livre no PDV</p>
                          <p className="text-[10px] text-slate-400">Pode aplicar qualquer percentual de desconto no caixa</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                        <input
                          type="checkbox"
                          checked={formRole === 'ADMIN' ? true : !!formCustomPerms.pdv_cancelar_venda}
                          disabled={formRole === 'ADMIN'}
                          onChange={() => handleToggleSpecialPerm('pdv_cancelar_venda')}
                          className="mt-0.5 text-rose-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Cancelar Vendas</p>
                          <p className="text-[10px] text-slate-400">Autorização para estornar ou cancelar cupons no PDV</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Tabela da Matriz dos 14 Módulos x 7 Ações */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <th className="py-3 px-4 min-w-[180px]">Módulo</th>
                            {ALL_ACTIONS.map(act => (
                              <th key={act} className="py-3 px-2 text-center capitalize">
                                {ACTION_LABELS[act]}
                              </th>
                            ))}
                            <th className="py-3 px-3 text-center">Atalhos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {ALL_MODULES.map(mod => {
                            const modInfo = MODULE_LABELS[mod];
                            const currentModPerms = formCustomPerms[mod] || (DEFAULT_ROLE_PERMISSIONS[formRole]?.[mod] as ModulePermissions) || {
                              visualizar: false,
                              cadastrar: false,
                              editar: false,
                              excluir: false,
                              aprovar: false,
                              exportar: false,
                              administrar: false
                            };

                            const allChecked = ALL_ACTIONS.every(act => !!currentModPerms[act]);

                            return (
                              <tr
                                key={mod}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    {modInfo?.name || mod}
                                  </p>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">
                                    {modInfo?.description}
                                  </p>
                                </td>

                                {ALL_ACTIONS.map(act => {
                                  const isChecked = formRole === 'ADMIN' ? true : !!currentModPerms[act];
                                  return (
                                    <td key={act} className="py-3 px-2 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={formRole === 'ADMIN'}
                                        checked={isChecked}
                                        onChange={() => handleToggleModuleAction(mod, act)}
                                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-50"
                                      />
                                    </td>
                                  );
                                })}

                                <td className="py-3 px-3 text-center">
                                  {formRole !== 'ADMIN' && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAllModuleActions(mod, !allChecked)}
                                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
                                    >
                                      {allChecked ? 'Desmarcar' : 'Todos'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Rodapé com Botões de Ação */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {modalTab === 'dados' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab('permissoes')}
                      className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Avançar para Matriz de Permissões <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalTab('dados')}
                      className="text-xs text-slate-500 font-bold hover:underline"
                    >
                      ← Voltar para Dados Cadastrais
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{submitting ? 'Salvando...' : isCreatingNew ? 'Cadastrar Colaborador' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: REDEFINIÇÃO DE SENHA COM BCRYPT                 */}
      {/* ======================================================== */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Key size={20} />
                <h3 className="font-black text-sm uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  Redefinir Senha
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Digite a nova senha para o colaborador <strong>{selectedUser.name || selectedUser.username}</strong> (@{selectedUser.username}).
            </p>

            <form onSubmit={handleSubmitResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Nova Senha (Mínimo 4 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite a nova senha..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita a nova senha..."
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Por segurança, a alteração de senha desconectará imediatamente todas as sessões ativas deste colaborador.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {passwordSubmitting ? 'Salvando...' : 'Confirmar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: HISTÓRICO DE AUDITORIA E ATIVIDADES DO USUÁRIO  */}
      {/* ======================================================== */}
      {isHistoryModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock size={20} />
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                    Histórico de Atividades & Auditoria
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Colaborador: {selectedUser.name || selectedUser.username} (@{selectedUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingLogs ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum registro de auditoria encontrado para este usuário.
                </div>
              ) : (
                auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {log.reason || `Ação executada no módulo ${log.module}`}
                    </p>
                    {log.ip_address && (
                      <p className="text-[9px] text-slate-400 font-mono">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

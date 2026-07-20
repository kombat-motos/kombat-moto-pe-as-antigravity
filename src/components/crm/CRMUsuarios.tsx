import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Users, Trash2, Key, X, AlertTriangle } from 'lucide-react';

interface SystemUser {
  id: number;
  username: string;
  role: 'Administrador' | 'Atendente' | 'Mecânico' | 'Financeiro';
  created_at: string;
}

interface CRMUsuariosProps {
  currentUser: { id: number; username: string; role: string };
}

export default function CRMUsuarios({ currentUser }: CRMUsuariosProps) {
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/usuarios', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao carregar usuários');
        }
        return res.json();
      })
      .then(data => {
        setUsersList(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  const handleUpdateRole = (userId: number, newRole: SystemUser['role']) => {
    fetch(`/api/usuarios/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ role: newRole })
    })
      .then(res => res.json())
      .then(() => {
        alert('Permissão atualizada com sucesso!');
        fetchUsers();
      })
      .catch(err => console.error(err));
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === currentUser.id) {
      return alert('Você não pode excluir seu próprio usuário logado!');
    }

    if (confirm('Deseja excluir permanentemente o acesso deste usuário ao sistema Kombat?')) {
      fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(() => {
          alert('Usuário removido com sucesso!');
          fetchUsers();
        })
        .catch(err => console.error(err));
    }
  };

  if (currentUser.role !== 'Administrador') {
    return (
      <div className="bg-rose-50 text-rose-700 p-6 rounded-3xl border border-rose-200 flex items-start gap-3 text-xs dark:bg-rose-950/20 dark:border-rose-900 animate-fadeIn">
        <AlertTriangle size={20} className="flex-shrink-0" />
        <div>
          <h4 className="font-black uppercase tracking-wider mb-1">Acesso Restrito</h4>
          <p>Apenas usuários com perfil de **Administrador** têm permissão para acessar a gestão de usuários e segurança do sistema Kombat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Gestão de Usuários e Permissões</h2>
          <p className="text-[10px] text-slate-400">Gerencie quem tem acesso ao painel Kombat e quais são suas permissões</p>
        </div>
        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-950/30">
          <ShieldCheck size={22} />
        </div>
      </div>

      {errorMsg ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs">{errorMsg}</div>
      ) : loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold">
                <th className="p-4">Usuário</th>
                <th className="p-4">Data Cadastro</th>
                <th className="p-4">Perfil / Permissão</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 font-medium">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 uppercase">{u.username}</p>
                      {u.id === currentUser.id && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black uppercase px-1.5 py-0.5 rounded-full dark:bg-emerald-950/30">
                          Sua Conta
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">
                    {new Date(u.created_at || Date.now()).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role || 'Administrador'}
                      onChange={e => handleUpdateRole(u.id, e.target.value as any)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Administrador">Administrador (Total)</option>
                      <option value="Atendente">Atendente (Clientes/Orçamentos)</option>
                      <option value="Mecânico">Mecânico (Apenas Oficina OS)</option>
                      <option value="Financeiro">Financeiro (Relatórios/Caixa)</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === currentUser.id}
                      className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

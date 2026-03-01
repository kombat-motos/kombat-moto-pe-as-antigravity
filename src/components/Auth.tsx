import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, LogIn, UserRoundPlus as UserPlus, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configurados!");
}

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Safely render icons or fallback
  const SafeIcon = ({ Icon, size = 20 }: { Icon: any; size?: number }) => {
    try {
      if (!Icon) return <User size={size} />;
      return <Icon size={size} />;
    } catch (e) {
      console.warn("Error rendering icon, falling back to User", e);
      return <User size={size} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Erro de configuração: Variáveis do Supabase não encontradas. Verifique o ambiente (Vercel/Local).');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@kombatmoto.com`, // Usando username como prefixo de email se não houver email real
          password: password,
        });

        if (error) throw error;
        if (data.user) onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: `${username}@kombatmoto.com`,
          password: password,
          options: {
            data: {
              username: username,
            }
          }
        });

        if (error) throw error;
        setIsLogin(true);
        setError('Conta criada com sucesso! Verifique seu e-mail (ou tente logar).');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message === 'Invalid login credentials' ? 'Usuário ou senha inválidos' : (err.message || 'Erro ao processar autenticação'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100"
      >
        <div className="p-8 bg-rose-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <SafeIcon Icon={ShieldCheck} size={32} />
          </div>
          <h1 className="text-2xl font-bold">Kombat Moto</h1>
          <p className="text-rose-100 text-sm mt-1">Sistema de Gestão Segura</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Usuário</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SafeIcon Icon={User} size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Seu usuário"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SafeIcon Icon={Lock} size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-xl text-xs font-bold ${error.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <SafeIcon Icon={isLogin ? LogIn : UserPlus} size={20} />
                  {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>


          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Proteção de dados ativa. Acesso restrito a usuários autorizados.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

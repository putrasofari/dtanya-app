import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Email Anda belum dikonfirmasi. Silakan cek inbox email atau matikan "Confirm Email" di dashboard Supabase untuk testing.');
          }
          throw error;
        }
        navigate('/app/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) {
          if (error.message.includes('rate limit')) {
            throw new Error('Terlalu banyak permintaan pendaftaran. Silakan tunggu beberapa menit atau matikan "Confirm Email" di dashboard Supabase (Authentication > Providers > Email) untuk memudahkan testing.');
          }
          throw error;
        }
        setError('Pendaftaran berhasil! Silakan periksa email untuk verifikasi (jika diaktifkan) atau login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Header Gradient */}
        <div className="h-2 bg-dtanya-gradient"></div>
        
        <div className="p-8 lg:p-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 font-bold text-3xl text-white">D</div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
            <p className="mt-2 text-slate-400">
              {isLogin ? 'Masuk ke akun Dtanya Anda' : 'Daftar untuk mulai belajar bersama'}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-4 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-bold text-blue-500 hover:underline"
            >
              {isLogin ? 'Daftar' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

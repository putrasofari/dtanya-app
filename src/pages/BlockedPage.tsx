import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Send, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BlockedPage() {
  const [profile, setProfile] = useState<any>(null);
  const [appeal, setAppeal] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    }
    getProfile();
  }, []);

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('appeals').insert({
        user_id: profile.id,
        content: appeal,
      });
      if (error) throw error;
      setAppeal('');
      setMessage('Aju banding Anda telah dikirim. Mohon tunggu respon dari admin.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!profile) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Akun Diblokir</h1>
          <p className="mt-4 text-slate-400">
            Kami menemukan pelanggaran pada akun Anda. Akses Anda ke layanan Dtanya telah dibatasi.
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-red-500/5 p-6 border border-red-500/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-2">Alasan Pemblokiran:</h2>
          <p className="text-slate-200">{profile.block_reason || 'Pelanggaran terhadap syarat dan ketentuan layanan.'}</p>
        </div>

        {!message ? (
          <form onSubmit={handleAppeal} className="space-y-4">
            <h2 className="font-bold text-white">Ajukan Banding</h2>
            <textarea
              required
              value={appeal}
              onChange={(e) => setAppeal(e.target.value)}
              className="h-32 w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:border-blue-500"
              placeholder="Jelaskan alasan mengapa akun Anda harus dipulihkan..."
            />
            <button
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-500"
            >
              {loading ? 'Mengirim...' : <><Send size={18} /> Kirim Aju Banding</>}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-green-500/10 p-6 text-center text-green-500 font-medium border border-green-500/20">
            {message}
          </div>
        )}

        <button 
          onClick={logout}
          className="mt-8 flex w-full items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors"
        >
          <LogOut size={18} /> Keluar dari Akun
        </button>
      </div>
    </div>
  );
}

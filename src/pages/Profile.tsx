import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Camera, LogOut, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        setFullName(data.full_name || '');
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
      }).eq('id', profile.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setProfile({ ...profile, full_name: fullName });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Storage bucket "avatars" belum dibuat di Supabase. Silakan buat bucket "avatars" di dashboard Supabase (set to Public) atau jalankan script SQL.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('id', profile.id);

      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: publicUrl });
      setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profil Saya</h1>
        <p className="text-slate-400">Atur informasi publik dan preferensi akun Anda.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-slate-800 bg-slate-950">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500"><User size={64} /></div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white cursor-pointer shadow-lg hover:bg-blue-500 transition-all">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatar} disabled={loading} />
            </label>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">{profile.role}</span>
              {profile.role === 'admin' && <Shield size={12} className="text-blue-500" />}
            </div>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>

          {profile.warning_count > 0 && (
            <div className="mt-8 w-full rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-orange-500 mb-1">
                <AlertCircle size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">Peringatan Akun</span>
              </div>
              <p className="text-xs text-orange-500/80">
                Akun Anda memiliki <strong>{profile.warning_count}</strong> peringatan dari moderator. 
                Harap patuhi pedoman komunitas untuk menghindari pemblokiran permanen.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Role Akun</label>
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-800/50 p-4 text-slate-400 font-bold capitalize">
              {profile.role}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 p-4 font-bold text-red-500 hover:bg-red-500/10 transition-all"
      >
        <LogOut size={20} />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  );
}

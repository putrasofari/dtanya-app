import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Search, 
  MoreVertical, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'questions' | 'appeals'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [blockUserModal, setBlockUserModal] = useState<{id: string, name: string} | null>(null);
  const [warnUserModal, setWarnUserModal] = useState<{id: string, name: string} | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [search, setSearch] = useState('');
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } else if (activeTab === 'appeals') {
      const { data } = await supabase.from('appeals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
      setAppeals(data || []);
    } else if (activeTab === 'questions') {
      const { data } = await supabase.from('questions').select('*, profiles(full_name)').order('created_at', { ascending: false });
      setQuestions(data || []);
    }
    setLoading(false);
  }

  const handleWarnUser = async () => {
    if (!warnUserModal || !warnReason.trim()) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('warning_count').eq('id', warnUserModal.id).single();
      const newCount = (profile?.warning_count || 0) + 1;
      
      // Update warning count
      await supabase.from('profiles').update({ warning_count: newCount }).eq('id', warnUserModal.id);
      
      // Add notification
      await supabase.from('notifications').insert({
        user_id: warnUserModal.id,
        type: 'warning',
        title: 'Peringatan Akun',
        message: warnReason
      });

      setWarnUserModal(null);
      setWarnReason('');
      loadData();
    } catch (err: any) {
      setAdminActionError(err.message);
    }
  };

  const handleBlockUser = async () => {
    if (!blockUserModal || !blockReason.trim()) return;
    try {
      await supabase.from('profiles').update({ 
        is_blocked: true, 
        block_reason: blockReason 
      }).eq('id', blockUserModal.id);
      setBlockUserModal(null);
      setBlockReason('');
      loadData();
    } catch (err: any) {
      setAdminActionError(err.message);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await supabase.from('profiles').update({ 
        is_blocked: false, 
        block_reason: null 
      }).eq('id', userId);
      loadData();
    } catch (err: any) {
      setAdminActionError(err.message);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setAdminActionError(null);
    try {
      const { error, data } = await supabase.from('questions').delete().eq('id', confirmDelete).select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setAdminActionError('Gagal: Post tidak ditemukan atau izin ditolak.');
      }
      
      setConfirmDelete(null);
      loadData();
    } catch (err: any) {
      setAdminActionError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleResolveAppeal = async (appealId: string, userId: string, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      const { error } = await supabase.from('appeals').update({ status }).eq('id', appealId);
      if (error) throw error;

      if (status === 'approved') {
        const { error: profileError } = await supabase.from('profiles').update({ is_blocked: false, block_reason: null }).eq('id', userId);
        if (profileError) throw profileError;
      }

      // Add notification for the user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: status === 'approved' ? 'success' : 'warning',
        title: status === 'approved' ? 'Banding Diterima' : 'Banding Ditolak',
        message: status === 'approved' 
          ? 'Selamat! Banding Anda telah diterima. Akun Anda kini telah aktif kembali.' 
          : 'Maaf, banding Anda ditolak. Akun Anda tetap diblokir sesuai peraturan komunitas.'
      });

      // Update local state immediately for better response
      setAppeals(prev => prev.map(app => app.id === appealId ? { ...app, status } : app));
      
      // Still load data to catch any other changes
      await loadData();
    } catch (err: any) {
      setAdminActionError(err.message);
      console.error('Error resolving appeal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        <p className="text-slate-400">Manajemen user, konten, dan sistem Dtanya.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        {[
          { id: 'users', label: 'Pengguna', icon: Users },
          { id: 'questions', label: 'Konten', icon: MessageSquare },
          { id: 'appeals', label: 'Banding', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Cari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500"
        />
      </div>

      {/* Content Area */}
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  {activeTab === 'users' && (
                    <>
                      <th className="px-8 py-4 text-gradient">Pengguna</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Role</th>
                      <th className="px-8 py-4">Tindakan</th>
                    </>
                  )}
                  {activeTab === 'questions' && (
                    <>
                      <th className="px-8 py-4">Judul</th>
                      <th className="px-8 py-4">Penulis</th>
                      <th className="px-8 py-4">Kategori</th>
                      <th className="px-8 py-4">Tindakan</th>
                    </>
                  )}
                  {activeTab === 'appeals' && (
                    <>
                      <th className="px-8 py-4">Pengguna</th>
                      <th className="px-8 py-4">Alasan</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Tindakan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeTab === 'users' && users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase())).map((u) => (
                  <tr key={u.id}>
                    <td className="px-8 py-6">
                      <div className="font-bold text-white">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      {u.is_blocked ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase text-red-500 border border-red-500/20">Blocked</span>
                      ) : (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase text-green-500 border border-green-500/20">Active</span>
                      )}
                      <div className="mt-1 text-[10px] text-slate-500 font-bold uppercase">{u.warning_count} Warnings</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{u.role}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-4">
                        <button onClick={() => setWarnUserModal({id: u.id, name: u.full_name})} className="text-orange-500 hover:text-orange-400 transition-colors" title="Beri Peringatan">
                          <AlertTriangle size={20} />
                        </button>
                        {u.is_blocked ? (
                          <button onClick={() => handleUnblockUser(u.id)} className="text-green-500 hover:text-green-400 transition-colors" title="Buka Blokir">
                            <CheckCircle size={20} />
                          </button>
                        ) : (
                          <button onClick={() => setBlockUserModal({id: u.id, name: u.full_name})} className="text-red-500 hover:text-red-400 transition-colors" title="Blokir User">
                            <Ban size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'questions' && questions.filter(q => q.title?.toLowerCase().includes(search.toLowerCase())).map((q) => (
                  <tr key={q.id}>
                    <td className="px-8 py-6">
                      <div className="font-bold text-white line-clamp-1">{q.title}</div>
                    </td>
                    <td className="px-8 py-6 text-slate-400">{q.profiles?.full_name}</td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{q.category}</span>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setConfirmDelete(q.id)} 
                        disabled={deleting}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'appeals' && appeals.map((app) => (
                  <tr key={app.id}>
                    <td className="px-8 py-6">
                      <div className="font-bold text-white">{app.profiles?.full_name}</div>
                      <div className="text-xs text-slate-500">{app.profiles?.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-slate-300 italic">"{app.content}"</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                        app.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        app.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {app.status === 'pending' ? 'Menunggu' : 
                         app.status === 'approved' ? 'Diterima' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {app.status === 'pending' ? (
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleResolveAppeal(app.id, app.user_id, 'approved')} 
                            title="Terima Banding"
                            className="text-green-500 hover:text-green-400 transition-transform active:scale-95"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            onClick={() => handleResolveAppeal(app.id, app.user_id, 'rejected')} 
                            title="Tolak Banding"
                            className="text-red-500 hover:text-red-400 transition-transform active:scale-95"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-50">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Modals */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
            <Trash2 className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Hapus Konten?</h3>
            <p className="text-slate-400 mb-6">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteQuestion} disabled={deleting} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="w-full rounded-xl border border-slate-800 py-3 font-bold text-white hover:bg-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {blockUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Ban className="text-red-500" /> Blokir {blockUserModal.name}
            </h3>
            <textarea 
              placeholder="Alasan pemblokiran..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full h-32 rounded-xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-red-500 mb-6"
            />
            <div className="flex gap-4">
              <button onClick={() => setBlockUserModal(null)} className="flex-1 rounded-xl border border-slate-800 py-3 font-bold text-white hover:bg-slate-800">Batal</button>
              <button onClick={handleBlockUser} disabled={!blockReason.trim()} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50">Blokir</button>
            </div>
          </div>
        </div>
      )}

      {warnUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" /> Beri Peringatan ke {warnUserModal.name}
            </h3>
            <textarea 
              placeholder="Alasan peringatan..."
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="w-full h-32 rounded-xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-orange-500 mb-6"
            />
            <div className="flex gap-4">
              <button onClick={() => {
                setWarnUserModal(null);
                setWarnReason('');
              }} className="flex-1 rounded-xl border border-slate-800 py-3 font-bold text-white hover:bg-slate-800">Batal</button>
              <button onClick={handleWarnUser} disabled={!warnReason.trim()} className="flex-1 rounded-xl bg-orange-600 py-3 font-bold text-white hover:bg-orange-500 disabled:opacity-50">Kirim Peringatan</button>
            </div>
          </div>
        </div>
      )}

      {adminActionError && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-sm rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-start gap-4">
            <XCircle className="text-red-500 shrink-0" size={24} />
            <div className="flex-1">
              <p className="font-bold text-white mb-1">Terjadi Kesalahan</p>
              <p className="text-sm text-red-500/80 mb-4">{adminActionError}</p>
              <button 
                onClick={() => setAdminActionError(null)}
                className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

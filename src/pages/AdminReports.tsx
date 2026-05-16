import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Flag, ShieldAlert, CheckCircle, XCircle, Clock, User, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{qid: string, rid: string} | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(full_name),
          question:questions!question_id(title, content, id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      alert('Gagal memuat laporan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      
      if (error) throw error;
      loadReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirmDelete) return;
    const { qid: questionId, rid: reportId } = confirmDelete;
    
    setDeleting(true);
    setDeleteError(null);
    try {
      console.log('Admin: Memulai delete untuk ID:', questionId);
      const { error: deleteError, data } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)
        .select();
      
      if (deleteError) {
        setDeleteError('Admin Delete Error: ' + deleteError.message);
        throw deleteError;
      }
      
      // Try resolve report if it still exists
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId).maybeSingle();
      
      await loadReports();
      setConfirmDelete(null);
    } catch (err: any) {
      console.error('Operation failed:', err);
      if (!deleteError) setDeleteError('Gagal menghapus post (Admin): ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-white p-8">Memuat laporan...</div>;

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h2 className="text-sm text-slate-500 font-medium font-bold uppercase tracking-widest mb-1">Moderasi</h2>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Flag className="text-red-500" /> Laporan Pertanyaan
        </h1>
      </header>

      <div className="grid gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className={`rounded-[2rem] border p-6 transition-all ${
              report.status === 'pending' 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-slate-950 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      report.status === 'pending' ? 'bg-red-500/20 text-red-500' :
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {report.status}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: localeId })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User size={12} />
                    Oleh: <span className="text-white font-bold">{report.reporter?.full_name}</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Alasan Laporan:</p>
                  <p className="text-slate-300 italic">"{report.reason}"</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pertanyaan Terciduk:</p>
                  {report.question ? (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <h4 className="font-bold text-white mb-1">{report.question.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-2">{report.question.content}</p>
                      <Link 
                        to={`/app/questions/${report.question.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline"
                      >
                        Lihat Selengkapnya <ExternalLink size={12} />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 italic">Pertanyaan sudah dihapus.</div>
                  )}
                </div>
              </div>

              <div className="lg:w-48 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center lg:text-left">Tindakan</p>
                {report.status === 'pending' ? (
                  <>
                    {report.question && (
                      <button 
                        onClick={() => setConfirmDelete({ qid: report.question.id, rid: report.id })}
                        disabled={deleting}
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600/10 p-3 text-sm font-bold text-red-500 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        <Trash2 size={16} /> Hapus Post
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusUpdate(report.id, 'resolved')}
                      disabled={deleting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600/10 p-3 text-sm font-bold text-green-500 transition-all hover:bg-green-600 hover:text-white disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Tandai Selesai
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                      disabled={deleting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 p-3 text-sm font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
                    >
                      <XCircle size={16} /> Abaikan
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleStatusUpdate(report.id, 'pending')}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 p-3 text-sm font-bold text-slate-500 transition-all hover:border-slate-700 hover:text-white disabled:opacity-50"
                  >
                    Buka Kembali
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <ShieldAlert size={48} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Tidak ada laporan aktif</p>
            <p className="text-xs">Komunitas tetap aman dan terjaga.</p>
          </div>
        )}
      </div>

      {/* Admin Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <Trash2 size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Hapus Permanen?</h3>
            <p className="mb-8 text-slate-400 text-sm">Tindakan ini akan menghapus pertanyaan secara permanen dari database.</p>
            
            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteQuestion}
                disabled={deleting}
                className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="w-full rounded-2xl border border-slate-800 py-4 font-bold text-white transition-all hover:bg-slate-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

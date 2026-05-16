import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, User, Send, ChevronLeft, Trash2, ShieldAlert, Flag, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(prof);
    }

    const { data: q } = await supabase
      .from('questions')
      .select('*, profiles(id, full_name, avatar_url, role)')
      .eq('id', id)
      .single();
    
    if (!q) {
      navigate('/app/questions');
      return;
    }
    setQuestion(q);

    const { data: a } = await supabase
      .from('answers')
      .select('*, profiles(full_name, avatar_url, role)')
      .eq('question_id', id)
      .order('created_at', { ascending: true });
    
    setAnswers(a || []);
    setLoading(false);
  }

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    setSending(true);

    try {
      const { error } = await supabase.from('answers').insert({
        question_id: id,
        user_id: currentUser.id,
        content: newAnswer,
      });
      if (error) throw error;
      setNewAnswer('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteQuestion = async () => {
    setDeleteError(null);
    setDeleting(true);
    
    try {
      console.log('Eksekusi delete di Supabase untuk ID:', question.id);
      
      const { error, data } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id)
        .select();
      
      if (error) {
        setDeleteError('Database Error: ' + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        setDeleteError('Gagal: Postingan tidak ditemukan atau Anda tidak memiliki izin.');
        throw new Error('No rows deleted');
      }
      
      navigate('/app/questions');
    } catch (err: any) {
      console.error('Delete error:', err);
      if (!deleteError) setDeleteError('Terjadi kesalahan sistem: ' + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda harus login untuk melaporkan.');

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        question_id: id,
        reason: reportReason,
      });

      if (error) throw error;
      alert('Laporan berhasil dikirim. Terima kasih telah membantu menjaga komunitas kami.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={20} /> Kembali
      </button>

      {/* Main Question */}
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-medium">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-blue-600/20 bg-slate-800">
              {question.profiles?.avatar_url ? (
                <img src={question.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center"><User size={24} className="text-slate-500" /></div>
              )}
            </div>
            <div>
              <p className="text-white font-bold">{question.profiles?.full_name}</p>
              <p className="text-xs text-blue-500 uppercase font-bold tracking-widest">{question.profiles?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-slate-800 px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
              {question.category}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} />
              {formatDistanceToNow(new Date(question.created_at), { addSuffix: true, locale: localeId })}
            </div>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-extrabold text-white leading-tight">{question.title}</h1>
        <div className="prose prose-invert max-w-none mb-10 text-slate-300 leading-loose whitespace-pre-wrap">
          {question.content}
        </div>

        {question.image_url && (
          <div className="mb-10 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950">
            <img 
              src={question.image_url} 
              alt="Lampiran Pertanyaan" 
              className="w-full h-auto max-h-[500px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Actions (Report/Delete) */}
        <div className="flex items-center gap-6">
          {currentUser?.id !== question.user_id && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-red-400 transition-colors"
            >
              <Flag size={16} /> Laporkan Pertanyaan
            </button>
          )}
          
          {(currentUser?.id === question.user_id || currentUser?.role === 'admin') && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex items-center gap-2 text-red-500 text-sm font-bold hover:underline disabled:opacity-50"
            >
              <Trash2 size={16} /> Hapus Pertanyaan
            </button>
          )}
        </div>
        
        {deleteError && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold">
            {deleteError}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <Trash2 size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Hapus Pertanyaan?</h3>
            <p className="mb-8 text-slate-400">Tindakan ini tidak dapat dibatalkan. Semua jawaban juga akan terhapus.</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteQuestion}
                disabled={deleting}
                className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="w-full rounded-2xl border border-slate-800 py-4 font-bold text-white transition-all hover:bg-slate-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Flag className="text-red-500" size={24} /> Laporkan
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleReport} className="space-y-6">
              <p className="text-slate-400 text-sm leading-relaxed">
                Mengapa Anda melaporkan pertanyaan ini? Berikan alasan singkat agar admin dapat meninjau dengan benar.
              </p>
              <textarea
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Alasan laporan (misal: spam, bahasa kasar, tidak pantas...)"
                className="w-full h-32 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-red-500"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 rounded-2xl border border-slate-800 p-4 font-bold text-white transition-all hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reporting || !reportReason.trim()}
                  className="flex-1 rounded-2xl bg-red-600 p-4 font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {reporting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answers Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          Jawaban <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm">{answers.length}</span>
        </h2>

        <div className="space-y-4">
          {answers.map((a) => (
            <div key={a.id} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                  {a.profiles?.avatar_url ? (
                    <img src={a.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><User size={20} className="text-slate-500" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{a.profiles?.full_name}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.profiles?.role}</p>
                </div>
                <p className="text-[10px] text-slate-500">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: localeId })}
                </p>
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-13">
                {a.content}
              </div>
            </div>
          ))}

          {answers.length === 0 && (
            <div className="text-center py-10 text-slate-500">Belum ada jawaban. Bantu {question.profiles?.full_name} dengan menjawab pertanyaannya!</div>
          )}
        </div>
      </div>

      {/* Reply Box */}
      <div className="sticky bottom-4">
        <form onSubmit={handleAnswer} className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900 shadow-2xl p-2 flex items-center">
          <input 
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            disabled={sending}
            placeholder="Ketik jawaban kamu di sini..."
            className="flex-1 bg-transparent px-6 py-3 text-white placeholder-slate-500 outline-none"
          />
          <button 
            type="submit"
            disabled={sending || !newAnswer.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

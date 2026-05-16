import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Clock, Tag, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Activity() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyQuestions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('questions')
        .select(`
          *,
          answers:answers(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setQuestions(data || []);
      setLoading(false);
    }
    fetchMyQuestions();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Histori Aktivitas</h1>
        <p className="text-slate-400">Pantau semua pertanyaan yang pernah kamu ajukan.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900"></div>)}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Link 
              key={q.id} 
              to={`/app/questions/${q.id}`}
              className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all hover:bg-slate-800/50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${q.answers?.[0]?.count > 0 ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                  <p className="text-lg font-bold text-white line-clamp-1">{q.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-1 text-blue-500">
                    <Tag size={12} />
                    {q.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: localeId })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300">
                  <MessageCircle size={16} />
                  {q.answers?.[0]?.count || 0}
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  {q.answers?.[0]?.count > 0 ? 'Terjawab' : 'Belum Dijawab'}
                </span>
              </div>
            </Link>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-20 bg-slate-900 rounded-3xl border border-dashed border-slate-800">
              <p className="text-slate-500">Kamu belum pernah bertanya apa-apa.</p>
              <Link to="/app/ask" className="mt-4 inline-block text-blue-500 font-bold underline">Mulai bertanya sekarang</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MessageCircle, Search, Filter, Clock, User, ImageIcon, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function QuestionList() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchQuestions();
  }, [category]);

  async function fetchQuestions() {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select('*, profiles(full_name, avatar_url, role)')
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setQuestions(data || []);
    setLoading(false);
  }

  const filteredQuestions = Array.isArray(questions) ? questions.filter(q => 
    (q.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (q.content?.toLowerCase() || '').includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">Eksplorasi</h2>
          <h1 className="text-3xl font-bold text-white">Jelajahi <span className="text-gradient">Pertanyaan</span></h1>
        </div>
        <Link to="/app/ask" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Tanya Sekarang
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 group">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-slate-900/40 py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 backdrop-blur-md transition-all"
            placeholder="Cari pertanyaan..."
          />
        </div>
        <div className="flex gap-2 p-1 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md overflow-x-auto scrollbar-hide">
          {['all', 'pelajaran', 'wawasan', 'random'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                category === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-900/40 border border-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredQuestions.map((q) => (
            <Link 
              key={q.id} 
              to={`/app/questions/${q.id}`}
              className="group flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-6 transition-all hover:bg-slate-900/80 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-blue-400">
                  {q.category}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: localeId })}
                </span>
              </div>

              <h2 className="mb-3 text-lg font-bold text-white group-hover:text-blue-400 line-clamp-2 transition-colors leading-snug">{q.title}</h2>
              <p className={`text-sm text-slate-400 line-clamp-2 leading-relaxed font-light ${q.image_url ? 'mb-4' : 'mb-6'}`}>{q.content}</p>

              {q.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden border border-white/5 bg-slate-950 aspect-video relative group-hover:border-blue-500/30 transition-colors">
                  <img 
                    src={q.image_url} 
                    alt="" 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent"></div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-blue-500/20 bg-slate-800">
                    {q.profiles?.avatar_url ? (
                      <img src={q.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User size={14} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{q.profiles?.full_name}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  Bantu Jawab →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredQuestions.length === 0 && (
        <div className="text-center py-24 bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800">
          <HelpCircle size={64} className="mx-auto mb-4 text-slate-800" />
          <h3 className="text-xl font-bold text-slate-300">Belum ada pertanyaan</h3>
          <p className="text-slate-500">Jadilah yang pertama untuk bertanya!</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({ questions: 0, answers: 0, dailyTokens: 3 });
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Get total stats
      const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: aCount } = await supabase.from('answers').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      
      // Get today's questions to calculate tokens
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      const { data: qData } = await supabase
        .from('questions')
        .select('*, profiles(full_name, avatar_url, role)')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({ 
        questions: qCount || 0, 
        answers: aCount || 0,
        dailyTokens: Math.max(0, 3 - (todayCount || 0))
      });
      setRecentQuestions(qData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-sm text-slate-500 font-medium font-bold uppercase tracking-widest mb-1">Beranda</h2>
          <h1 className="text-3xl font-bold text-white">Selamat Datang Kembali, <span className="text-gradient">{profile?.full_name}</span></h1>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <div className={`h-2 w-2 rounded-full ${stats.dailyTokens > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Token Bertanya: <span className={stats.dailyTokens > 0 ? 'text-white' : 'text-red-500'}>{stats.dailyTokens}/3</span></span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500">
            <HelpCircle size={24} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pertanyaan</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.questions}</p>
          <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase tracking-tighter cursor-default">Semua Topik</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/10 text-sky-500">
            <MessageSquare size={24} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Jawaban</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.answers}</p>
          <p className="text-[10px] text-sky-400 mt-2 font-bold uppercase tracking-tighter cursor-default">Kontributor Aktif</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/10 text-orange-500">
            <AlertTriangle size={24} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Peringatan</p>
          <p className="text-3xl font-bold text-white mt-1">{profile?.warning_count || 0}</p>
          <p className="text-[10px] text-orange-400 mt-2 font-bold uppercase tracking-tighter cursor-default">Tetap Patuhi Aturan</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div 
          whileHover={{ y: -5, scale: 1.01 }}
          className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-sky-500 p-10 shadow-2xl shadow-blue-900/20"
        >
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white">Ada kesulitan PR?</h2>
            <p className="mb-8 text-blue-50 max-w-sm leading-relaxed">Tanyakan sekarang dan dapatkan penjelasan dari pakar atau teman-teman secara langsung.</p>
            <Link to="/app/ask" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-blue-600 transition-all hover:shadow-xl hover:shadow-white/20 active:scale-95">
              Tanya Sekarang <ArrowRight size={18} />
            </Link>
          </div>
          <HelpCircle size={220} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -5, scale: 1.01 }}
          className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/60 border border-white/10 p-10 shadow-xl"
        >
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white">Ayo berdiskusi!</h2>
            <p className="mb-8 text-slate-400 max-w-sm leading-relaxed">Bantu temanmu menyelesaikan kesulitan mereka dan tingkatkan reputasi belajarmu.</p>
            <Link to="/app/questions" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95">
              Bantu Jawab <ArrowRight size={18} />
            </Link>
          </div>
          <MessageSquare size={220} className="absolute -bottom-10 -right-10 text-slate-800/20 -rotate-12" />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">Pertanyaan Terbaru</h2>
          <Link to="/app/questions" className="text-sm font-bold text-blue-400 hover:underline">Lihat Semua</Link>
        </div>
        
        {recentQuestions.length > 0 ? (
          <div className="grid gap-4">
            {recentQuestions.map((q) => (
              <Link 
                key={q.id} 
                to={`/app/questions/${q.id}`}
                className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left"
              >
                {q.image_url ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={q.image_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                    <MessageSquare size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{q.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">Oleh {q.profiles?.full_name} • {q.category}</p>
                </div>
                <ArrowRight size={18} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
              <LayoutDashboard size={32} />
            </div>
            <h3 className="text-slate-300 font-bold">Belum ada aktivitas</h3>
            <p className="text-slate-500 text-sm mt-1">Mulai bertanya atau menjawab untuk melihat riwayat di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

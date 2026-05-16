import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Clock, CheckCircle, BellOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      
      // Mark all as read when viewing this page
      if (data && data.some(n => !n.read)) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      }
    } catch (err: any) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-[0_0_20px_rgba(37,99,235,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Notifikasi
          </h1>
          <p className="mt-2 text-slate-400 font-medium italic">Informasi penting terkait akun Anda.</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-slate-800 bg-slate-900/50 p-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-slate-600">
            <BellOff size={40} />
          </div>
          <h3 className="text-xl font-bold text-white">Belum Ada Notifikasi</h3>
          <p className="mt-2 text-slate-400">Anda akan menerima pemberitahuan di sini jika ada aktivitas akun atau peringatan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              className={`group relative overflow-hidden rounded-[2rem] border p-6 transition-all ${
                notif.read 
                  ? 'border-slate-800 bg-slate-900/40' 
                  : 'border-blue-500/30 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.05)]'
              }`}
            >
              <div className="flex items-start gap-5">
                <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  notif.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 
                  notif.type === 'success' ? 'bg-green-500/10 text-green-500' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {notif.type === 'warning' ? <AlertTriangle size={24} /> : 
                   notif.type === 'success' ? <CheckCircle size={24} /> : 
                   <CheckCircle size={24} />}
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className={`font-bold ${notif.read ? 'text-slate-200' : 'text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-300'}`}>
                    {notif.message}
                  </p>
                  
                  {!notif.read && (
                    <div className="absolute right-6 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

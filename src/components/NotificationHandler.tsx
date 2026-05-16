import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Info, CheckCircle, Bell, X } from 'lucide-react';

export default function NotificationHandler() {
  const [notification, setNotification] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let subscription: any;

    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initial check for unread notifications
      const { data: unread } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (unread) {
        setNotification(unread);
        setShow(true);
      }

      // Real-time subscription
      subscription = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            console.log('New notification received:', payload.new);
            setNotification(payload.new);
            setShow(true);
          }
        )
        .subscribe();
    }

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const markAsRead = async () => {
    if (!notification) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);
    
    setShow(false);
    // After animation/close, check if there are more unread
    setTimeout(checkForMore, 300);
  };

  const checkForMore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: unread } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (unread) {
      setNotification(unread);
      setShow(true);
    } else {
      setNotification(null);
    }
  };

  if (!show || !notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'warning': return <AlertTriangle className="text-orange-500" size={32} />;
      case 'success': return <CheckCircle className="text-green-500" size={32} />;
      default: return <Info className="text-blue-500" size={32} />;
    }
  };

  const getColorClass = () => {
    switch (notification.type) {
      case 'warning': return 'border-orange-500/20 bg-orange-500/10 text-orange-500';
      case 'success': return 'border-green-500/20 bg-green-500/10 text-green-500';
      default: return 'border-blue-500/20 bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
            <button onClick={markAsRead} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${getColorClass()}`}>
          {getIcon()}
        </div>
        
        <h3 className="mb-2 text-xl font-bold text-white flex items-center justify-center gap-2">
            <Bell size={20} className="text-blue-500 animate-bounce" />
            {notification.title}
        </h3>
        
        <div className="mb-8 rounded-2xl bg-slate-950 p-4 border border-white/5">
            <p className="text-slate-300 text-sm leading-relaxed italic">
                "{notification.message}"
            </p>
        </div>

        <button
          onClick={markAsRead}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
}

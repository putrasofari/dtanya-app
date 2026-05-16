import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HelpCircle, 
  PlusCircle, 
  History, 
  User, 
  ShieldAlert,
  Menu,
  X,
  LogOut,
  Flag,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import NotificationHandler from '../components/NotificationHandler';

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role, is_blocked').eq('id', user.id).single();
        setRole(data?.role || 'user');
        setIsBlocked(data?.is_blocked || false);
        
        if (data?.is_blocked && location.pathname !== '/app/blocked') {
          navigate('/app/blocked');
        }

        loadUnreadCount(user.id);

        // Real-time notification subscription
        const notifSubscription = supabase
          .channel('unread_notifications_count')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            () => loadUnreadCount(user.id)
          )
          .subscribe();

        // Real-time profile subscription (to catch blocking immediately)
        const profileSubscription = supabase
          .channel('profile_status')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              const newIsBlocked = payload.new.is_blocked;
              setIsBlocked(newIsBlocked);
              if (newIsBlocked && location.pathname !== '/app/blocked') {
                navigate('/app/blocked');
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(notifSubscription);
          supabase.removeChannel(profileSubscription);
        };
      }
    }
    getUserData();
  }, [location.pathname]);

  const loadUnreadCount = async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (!error) setUnreadCount(count || 0);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Pertanyaan', path: '/app/questions', icon: HelpCircle },
    { name: 'Tanya Sekarang', path: '/app/ask', icon: PlusCircle },
    { name: 'Aktivitas', path: '/app/activity', icon: History },
    { name: 'Profil', path: '/app/profile', icon: User },
    { name: 'Notifikasi', path: '/app/notifications', icon: Bell, badge: unreadCount },
  ];

  if (role === 'admin') {
    menuItems.push({ name: 'Admin Panel', path: '/app/admin', icon: ShieldAlert });
    menuItems.push({ name: 'Laporan', path: '/app/reports', icon: Flag });
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <NotificationHandler />
      
      {!isBlocked && (
        <>
          {/* Mobile Toggle */}
          <button 
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 rounded-lg bg-blue-600 p-2 lg:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900/50 border-r border-blue-500/20 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex h-full flex-col p-4">
              <div className="mb-10 flex items-center gap-3 px-4 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 font-bold text-white shadow-lg shadow-blue-500/20">
                  D
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300 leading-none">Dtanya</h1>
                  <p className="mt-1 text-[10px] font-medium text-slate-400 italic">Bingung? Dtanya aja!</p>
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                        isActive 
                          ? "sidebar-item-active" 
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-lg shadow-red-600/40 animate-pulse">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="rounded-2xl p-4 bg-slate-800/80 border border-white/5 shadow-inner">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Role Anda</p>
                  <p className="text-sm font-semibold text-blue-400 capitalize">{role}</p>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col relative overflow-hidden", isBlocked ? "w-full" : "")}>
        {/* Decorative Gradients */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-sky-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className={cn("flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-8", isBlocked ? "flex items-center justify-center p-0" : "")}>
          <div className={cn("mx-auto relative z-10", isBlocked ? "w-full min-h-screen" : "max-w-6xl")}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* Overlay */}
      {isOpen && !isBlocked && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
    </div>
  );
}

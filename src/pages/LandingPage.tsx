import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Users, MessageSquare, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold">D</div>
            <span className="text-xl font-bold tracking-tight">Dtanya</span>
          </div>
          <Link to="/login" className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium transition-transform hover:scale-105 active:scale-95">
            Mulai Belajar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight lg:text-7xl">
              Tanya Apapun, <br />
              <span className="text-blue-500">Belajar Bersama</span> Siapa Saja.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 lg:text-xl">
              Dtanya adalah platform tanya jawab dan bimbingan belajar interaktif. Dapatkan jawaban dari pakar dan teman sebaya untuk setiap pertanyaanmu.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login" className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-950 transition-all hover:bg-slate-200">
                Join Sekarang <ArrowRight size={20} />
              </Link>
              <button className="rounded-full border border-slate-800 px-8 py-4 text-lg font-medium transition-colors hover:bg-slate-900">
                Lihat Demo
              </button>
            </div>
          </motion.div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 border-t border-slate-800 pt-10 lg:grid-cols-4">
            {[
              { label: 'Total User', value: '10K+' },
              { label: 'Pakar Aktif', value: '500+' },
              { label: 'Pertanyaan', value: '50K+' },
              { label: 'Rating', value: '4.9/5' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">Kenapa Memilih Dtanya?</h2>
            <p className="mx-auto max-w-xl text-slate-400">Kami menyediakan ekosistem belajar yang sehat dan suportif.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Teman Sebaya',
                desc: 'Belajar lebih asik dengan penjelasan dari teman sebaya yang menggunakan bahasa yang lebih mudah dimengerti.',
                icon: Users,
              },
              {
                title: 'Bimbingan Pakar',
                desc: 'Dapatkan verifikasi jawaban dari pakar-pakar berpengalaman untuk memastikan pemahaman yang benar.',
                icon: BookOpen,
              },
              {
                title: 'Interaksi Cepat',
                desc: 'Fitur tanya jawab real-time yang memudahkanmu mendapatkan bantuan saat sedang mengerjakan PR.',
                icon: MessageSquare,
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-3xl border border-slate-800 bg-slate-950 p-8 transition-all hover:border-blue-500/50 hover:bg-slate-900/50">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-500">
                  <feature.icon size={28} />
                </div>
                <h3 className="mb-4 text-2xl font-bold">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl rounded-[3rem] bg-dtanya-gradient p-12 text-center shadow-2xl shadow-blue-500/20">
          <h2 className="mb-6 text-4xl font-bold">Siap Untuk Menjadi Lebih Pintar?</h2>
          <p className="mb-10 text-blue-100 text-lg">Gabung bersama ribuan pengguna lainnya sekarang juga. Gratis!</p>
          <Link to="/login" className="rounded-full bg-white px-10 py-4 font-bold text-blue-600 transition-transform hover:scale-105 active:scale-95">
            Daftar Dtanya
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 font-bold text-xs">D</div>
            <span className="font-bold text-slate-300">Dtanya</span>
          </div>
          <p className="text-sm">© 2026 Dtanya Bimbingan Belajar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

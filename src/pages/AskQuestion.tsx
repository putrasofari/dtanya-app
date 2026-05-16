import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Camera, Send, X, AlertCircle } from 'lucide-react';

export default function AskQuestion() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('pelajaran');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkTokens() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      setTokens(Math.max(0, 3 - (count || 0)));
    }
    checkTokens();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tokens !== null && tokens <= 0) {
        throw new Error('Token bertanya habis! Kamu hanya bisa bertanya 3 kali dalam sehari. Silakan coba lagi besok.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda harus login');

      let imageUrl = null;
      if (image) {
        // Sanitize file name: remove spaces and special characters
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Simplified path

        const { error: uploadError } = await supabase.storage
          .from('questions')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          if (uploadError.message.includes('bucket not found')) {
            throw new Error('Storage bucket "questions" belum dibuat di Supabase. Silakan hubungi admin atau jalankan script SQL.');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('questions')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('questions').insert({
        user_id: user.id,
        title,
        content,
        category,
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal memposting pertanyaan. Mungkin anda sudah mencapai batas harian (3x)?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tanya Sesuatu</h1>
          <p className="text-slate-400">Pastikan pertanyaanmu jelas dan tidak mengandung unsur negatif.</p>
        </div>
        {tokens !== null && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${tokens > 0 ? 'bg-blue-600/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sisa Token Hari Ini: <span className={`text-sm ${tokens > 0 ? 'text-blue-400' : 'text-red-500'}`}>{tokens}/3</span></span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Judul Pertanyaan</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white outline-none focus:border-blue-500"
            placeholder="Apa judul permasalahanmu?"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['pelajaran', 'wawasan', 'random'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-2xl border p-4 text-sm font-bold capitalize transition-all ${
                category === cat 
                  ? 'border-blue-500 bg-blue-600/10 text-blue-500' 
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Penjelasan Detail</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-48 w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white outline-none focus:border-blue-500"
            placeholder="Jelaskan secara detail apa yang ingin kamu tanyakan..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gambar Pendukung (Opsional)</label>
          {!preview ? (
            <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 transition-colors hover:bg-slate-900">
              <div className="text-center">
                <Camera className="mx-auto mb-2 text-slate-500" size={32} />
                <p className="text-sm text-slate-500">Klik untuk upload gambar</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-800">
              <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-slate-950" />
              <button 
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <button
          disabled={loading || (tokens !== null && tokens <= 0)}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-6 font-bold text-white transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/20 disabled:opacity-50 disabled:bg-slate-800"
        >
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <Send size={20} />
              <span>{tokens !== null && tokens <= 0 ? 'Token Habis' : 'Kirim Pertanyaan'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

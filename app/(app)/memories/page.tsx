'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Trash2, X, Upload } from 'lucide-react';

export default function MemoriesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [memories, setMemories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', caption: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [imageData, setImageData] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    const r = await fetch('/api/memories');
    if (r.ok) setMemories(await r.json());
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error('Image must be under 3MB');
    const reader = new FileReader();
    reader.onload = ev => setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Add a title!');
    setSaving(true);
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageData }),
    });
    if (!res.ok) {
      setSaving(false);
      return toast.error('Failed to save memory');
    }
    const m = await res.json();
    setMemories(prev => [m, ...prev]);
    setForm({ title: '', caption: '', date: format(new Date(), 'yyyy-MM-dd') });
    setImageData('');
    setShowForm(false);
    setSaving(false);
    toast.success('Memory saved! 📸');
  }

  async function remove(id: string) {
    await fetch('/api/memories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMemories(m => m.filter(x => x._id !== id));
    toast.success('Deleted');
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="inline-block bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full mb-1 tracking-wider uppercase">Memories</div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Our Gallery 📸</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg active:scale-95 transition-all"
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-4 mb-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-amber-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-all mb-3"
          >
            {imageData ? (
              <img src={imageData} alt="preview" className="w-full h-40 object-cover rounded-lg" />
            ) : (
              <div className="text-gray-400">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Tap to upload photo</p>
                <p className="text-xs mt-1">Max 3MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Memory title *"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all mb-2"
          />
          <textarea
            value={form.caption}
            onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            placeholder="Tell the story..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none mb-2"
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all mb-3"
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Memory 📸'}
          </button>
        </div>
      )}

      {/* Gallery */}
      {memories.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📸</div>
          <p className="font-medium">No memories yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {memories.map((m, i) => (
            <div
              key={m._id}
              onClick={() => setPreview(m)}
              className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all ${i === 0 ? 'col-span-2' : ''}`}
            >
              {m.imageData ? (
                <img src={m.imageData} alt={m.title} className={`w-full object-cover ${i === 0 ? 'h-52' : 'h-36'}`} />
              ) : (
                <div className={`bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center ${i === 0 ? 'h-52' : 'h-36'}`}>
                  <span className="text-4xl">📸</span>
                </div>
              )}
              <div className="p-3">
                <div className="font-bold text-gray-900 text-sm truncate">{m.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(m.date), 'MMM d, yyyy')} · {m.uploadedByName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {preview.imageData && (
              <img src={preview.imageData} alt={preview.title} className="w-full max-h-80 object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{preview.title}</h3>
                <div className="flex gap-2">
                  {preview.uploadedBy === userId && (
                    <button
                      onClick={() => { remove(preview._id); setPreview(null); }}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button onClick={() => setPreview(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                    <X size={18} />
                  </button>
                </div>
              </div>
              {preview.caption && (
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{preview.caption}</p>
              )}
              <p className="text-xs text-gray-400">
                {format(new Date(preview.date), 'MMMM d, yyyy')} · Added by {preview.uploadedByName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

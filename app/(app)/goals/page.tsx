'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';

interface Goal {
  _id: string;
  text: string;
  completed: boolean;
  completedBy: string | null;
  addedBy: string;
  addedByName: string;
  createdAt: string;
}

export default function GoalsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setGoals(json);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchGoals();
    const interval = setInterval(fetchGoals, 5000);
    return () => clearInterval(interval);
  }, [fetchGoals]);

  async function addGoal() {
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() }),
      });
      if (res.ok) {
        const goal = await res.json();
        setGoals(g => [...g, goal]);
        setInput('');
        toast.success('Goal added! 💫');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add goal');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setSubmitting(false);
  }

  async function toggleGoal(goalId: string) {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals(g => g.map(goal => goal._id === goalId ? updated : goal));
      } else {
        toast.error('Could not update goal');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }

  async function deleteGoal(goalId: string) {
    try {
      const res = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (res.ok) {
        setGoals(g => g.filter(goal => goal._id !== goalId));
        toast.success('Goal removed');
      } else {
        toast.error('Could not delete goal');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }

  const pending = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">
          Goals
        </div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Couple Goals 💫</h1>
        <p className="text-gray-500 text-sm mt-1">Your shared bucket list of adventures and dreams</p>
      </div>

      {/* Add goal input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGoal(); }}
            placeholder="Add a new goal together…"
            className="flex-1 text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl px-3 py-2.5 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
          />
          <button
            onClick={addGoal}
            disabled={submitting || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Pending goals */}
      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            To Do · {pending.length}
          </p>
          <div className="space-y-2">
            {pending.map(goal => (
              <div
                key={goal._id}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group"
              >
                <button
                  onClick={() => toggleGoal(goal._id)}
                  className="flex-shrink-0 text-gray-300 hover:text-pink-400 transition-colors"
                >
                  <Circle size={22} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{goal.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Added by {goal.addedByName}</p>
                </div>
                {goal.addedBy === userId && (
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Completed · {completed.length} 🎉
          </p>
          <div className="space-y-2">
            {completed.map(goal => (
              <div
                key={goal._id}
                className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-2xl border border-pink-100 p-4 group"
              >
                <button
                  onClick={() => toggleGoal(goal._id)}
                  className="flex-shrink-0 text-pink-400 hover:text-gray-300 transition-colors"
                >
                  <CheckCircle2 size={22} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 line-through leading-snug">{goal.text}</p>
                  {goal.completedBy && (
                    <p className="text-[10px] text-pink-400 font-bold mt-0.5">
                      Completed by {goal.completedBy} ✓
                    </p>
                  )}
                </div>
                {goal.addedBy === userId && (
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-14 text-gray-300">
          <div className="text-5xl mb-3">💫</div>
          <p className="text-sm font-medium">No goals yet. Add your first dream together!</p>
        </div>
      )}
    </div>
  );
}

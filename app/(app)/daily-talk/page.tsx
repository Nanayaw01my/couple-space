'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DAILY_TOPICS } from '@/lib/dailyTalkTopics';
import { getISOWeek, getISOWeekYear, format } from 'date-fns';

function getWeekKey(date: Date) {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

export default function DailyTalkPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const userName = session?.user?.name as string | undefined;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekKey = getWeekKey(today);
  const topic = DAILY_TOPICS[dayOfWeek];

  // docs keyed by questionIndex: { answers: [{ userId, userName, answer }] }
  const [docs, setDocs] = useState<Record<number, any>>({});
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});
  const [savedFlags, setSavedFlags] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-talk?day=${dayOfWeek}&week=${weekKey}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const map: Record<number, any> = {};
        const localMap: Record<number, string> = {};
        if (Array.isArray(data)) {
          data.forEach(doc => {
            map[doc.questionIndex] = doc;
            const myAnswer = doc.answers?.find((a: any) => a.userId === userId);
            localMap[doc.questionIndex] = myAnswer?.answer || '';
          });
        }
        setDocs(map);
        setLocalAnswers(localMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dayOfWeek, weekKey, userId]);

  const saveAnswer = useCallback(async (questionIndex: number) => {
    const answer = localAnswers[questionIndex] ?? '';
    try {
      const res = await fetch('/api/daily-talk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekKey, dayOfWeek, questionIndex, answer }),
      });
      if (!res.ok) return;
      const doc = await res.json();
      setDocs(prev => ({ ...prev, [questionIndex]: doc }));
      setSavedFlags(prev => ({ ...prev, [questionIndex]: true }));
      setTimeout(() => {
        setSavedFlags(prev => ({ ...prev, [questionIndex]: false }));
      }, 2000);
    } catch {
      // silently ignore
    }
  }, [localAnswers, weekKey, dayOfWeek]);

  const handleChange = (questionIndex: number, value: string) => {
    setLocalAnswers(prev => ({ ...prev, [questionIndex]: value }));
    setSavedFlags(prev => ({ ...prev, [questionIndex]: false }));
  };

  const getMyAnswer = (questionIndex: number) => localAnswers[questionIndex] ?? '';

  const getPartnerAnswer = (questionIndex: number) => {
    const doc = docs[questionIndex];
    if (!doc?.answers) return null;
    const partner = doc.answers.find((a: any) => a.userId !== userId);
    return partner?.answer || null;
  };

  const getPartnerName = (questionIndex: number) => {
    const doc = docs[questionIndex];
    if (!doc?.answers) return 'Partner';
    const partner = doc.answers.find((a: any) => a.userId !== userId);
    return partner?.userName || 'Partner';
  };

  const myAnsweredCount = topic.questions.reduce((count, _, idx) => {
    const doc = docs[idx];
    if (!doc?.answers) return count;
    const myAns = doc.answers.find((a: any) => a.userId === userId);
    return myAns?.answer?.trim() ? count + 1 : count;
  }, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      {/* Header Card */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: topic.color }}>
        <div className="absolute -top-8 -right-8 text-8xl opacity-10 rotate-12 select-none">
          {topic.emoji}
        </div>
        <div className="absolute -bottom-4 -left-4 text-4xl opacity-10 select-none">💬</div>

        <div className="flex items-start gap-3 mb-2">
          <span className="text-4xl">{topic.emoji}</span>
          <div>
            <h1 className="font-playfair text-2xl font-bold leading-tight">{topic.title}</h1>
            <p className="text-white/75 text-sm mt-0.5">{topic.subtitle}</p>
          </div>
        </div>

        <p className="text-white/60 text-xs mt-3">
          {topic.dayName} · {format(today, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="bg-rose-50 border border-rose-200 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-rose-500 font-bold text-sm">{myAnsweredCount}</span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-gray-600 font-medium text-sm">{topic.questions.length} answered by you</span>
        </div>
        {loading && <span className="text-xs text-gray-400 italic">Loading...</span>}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden -mt-2">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${(myAnsweredCount / topic.questions.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {topic.questions.map((question, idx) => {
          const isSaved = savedFlags[idx];
          const myCurrentAnswer = getMyAnswer(idx);
          const partnerAnswer = getPartnerAnswer(idx);
          const partnerName = getPartnerName(idx);

          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-7 h-7 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-gray-900 font-semibold text-sm leading-relaxed">{question}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* My Answer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Your Answer
                    </label>
                    {isSaved && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Saved ✓
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={myCurrentAnswer}
                    onChange={e => handleChange(idx, e.target.value)}
                    placeholder="Write your answer here..."
                    className="w-full text-sm text-gray-800 placeholder-gray-300 bg-rose-50/50 border border-rose-100 rounded-xl px-3 py-2.5 resize-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                  <button
                    onClick={() => saveAnswer(idx)}
                    className="mt-2 px-4 py-1.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-sm"
                  >
                    Save
                  </button>
                </div>

                {/* Partner Answer */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    {partnerName}&apos;s Answer
                  </label>
                  {partnerAnswer && partnerAnswer.trim().length > 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{partnerAnswer}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 italic px-1">Not yet answered...</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Other Days */}
      <div className="pb-4">
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
              <span>Other days</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {DAILY_TOPICS.filter(t => t.dayOfWeek !== dayOfWeek).map(t => (
              <div
                key={t.dayOfWeek}
                className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5"
              >
                <span className="text-lg">{t.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t.dayName}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

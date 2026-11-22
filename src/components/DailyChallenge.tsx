import { useState, useEffect, useRef } from 'react';
import { hasPlayedDailyToday, getLeaderboard } from '../utils/storage';
import {
  getTodayTheme,
  getTodayTask,
  getThemeForDate,
  getTaskForDate,
  getRecentDailyDates,
} from '../utils/dailyThemes';
import {
  getTodayDateStr,
  getYesterdayDateStr,
  getPlacementRank,
  normalizePlacement,
} from '../utils/draft';

export default function DailyChallenge({
  onStart,
  onBack,
}: {
  onStart: (practiceDate?: string) => void;
  onBack: () => void;
}) {
  const [playedToday, setPlayedToday] = useState(false);
  const [practiceDate, setPracticeDate] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<'today' | 'yesterday'>('today');
  const [activeTab, setActiveTab] = useState<'score' | 'power' | 'economy'>('score');

  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: string; task: boolean; power: number; saved: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const pastDropdownRef = useRef<HTMLDivElement | null>(null);

  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();
  const recentDates = getRecentDailyDates(14);

  const isPractice = practiceDate !== null;
  const currentDate = practiceDate ?? (activeDate === 'today' ? today : yesterday);

  const theme = practiceDate ? getThemeForDate(practiceDate) : getTodayTheme();
  const task = practiceDate ? getTaskForDate(practiceDate, theme) : getTodayTask(theme);

  useEffect(() => {
    setPlayedToday(hasPlayedDailyToday());
  }, []);

  useEffect(() => {
    if (!pastOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (pastDropdownRef.current && !pastDropdownRef.current.contains(e.target as Node)) {
        setPastOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [pastOpen]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getLeaderboard(currentDate).then((data) => {
      if (isMounted) {
        setLeaderboard(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (activeTab === 'score') return getPlacementRank(a.score) - getPlacementRank(b.score);
    if (activeTab === 'power') return b.power - a.power;
    if (activeTab === 'economy') return b.saved - a.saved;
    return 0;
  });

  const formattedDate = (practiceDate ?? today).split('-').reverse().join('.');
  const isStartDisabled = !isPractice && playedToday;

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 flex flex-col">
      <button onClick={onBack} className="font-bold mb-4 text-ti9-accent hover:underline self-start">
        ← Back
      </button>

      <div className="relative overflow-hidden bg-gradient-to-b from-ti9-panel via-ti9-panel to-ti9-dark/95 p-5 rounded-2xl border border-ti9-accent/60 shadow-[0_8px_30px_rgba(0,0,0,0.45)] mb-5">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 bg-ti9-accent/15 blur-3xl rounded-full" />

        <div className="relative flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase bg-ti9-teal/15 text-ti9-teal border border-ti9-teal/30">
            <span className="w-1.5 h-1.5 rounded-full bg-ti9-teal animate-pulse" />
            {isPractice ? 'Practice Mode' : 'Daily Challenge'}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-400 bg-ti9-dark/70 px-2.5 py-0.5 rounded-md border border-white/5">
            {formattedDate}
          </span>
        </div>

        <div className="relative text-center my-4">
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-ti9-accent drop-shadow-sm">
            {theme.title}
          </h2>
          <p className="text-sm font-medium text-ti9-teal/90 mt-1.5 max-w-sm mx-auto leading-snug">
            {theme.description || theme.desc}
          </p>
        </div>

        <div className="relative my-4 rounded-xl bg-gradient-to-r from-ti9-accent/15 via-ti9-dark/85 to-ti9-dark/90 border border-ti9-accent/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ti9-accent mb-2">
            <span>🎯</span>
            <span>Extra Task</span>
          </div>

          <div className="text-base font-bold text-white leading-snug mb-2.5">
            {task.desc}
          </div>

          <div className="pt-2 border-t border-ti9-accent/15 flex items-center justify-between text-xs text-slate-300">
            <span className="opacity-75">Reward:</span>
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <span>⭐</span>
              <span>{isPractice ? 'Practice only (no star)' : 'Star on leaderboard'}</span>
            </span>
          </div>
        </div>

        <div className="relative mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-ti9-dark/80 px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Budget:
            </span>
            <span className="text-lg font-mono font-black text-emerald-400 tracking-tight">
              ${theme.budget}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right leading-tight">
            Player ratings are hidden. Price is fixed.
          </div>
        </div>
      </div>

      <div className="flex-1 bg-ti9-panel rounded-xl border border-ti9-accent/20 overflow-hidden flex flex-col">
        <div className="flex border-b border-ti9-accent/20">
          <button
            onClick={() => {
              setPracticeDate(null);
              setActiveDate('today');
            }}
            className={`flex-1 py-3 font-bold text-sm ${
              !isPractice && activeDate === 'today'
                ? 'bg-ti9-accent/10 text-ti9-accent'
                : 'opacity-50'
            }`}
          >
            Today's Leaderboard
          </button>
          <button
            onClick={() => {
              setPracticeDate(null);
              setActiveDate('yesterday');
            }}
            className={`flex-1 py-3 font-bold text-sm ${
              !isPractice && activeDate === 'yesterday'
                ? 'bg-ti9-accent/10 text-ti9-accent'
                : 'opacity-50'
            }`}
          >
            Yesterday's Leaderboard
          </button>
        </div>

        <div className="flex bg-ti9-dark/30 border-b border-ti9-accent/10">
          {(
            [
              { id: 'score', label: 'Main' },
              { id: 'power', label: 'Power' },
              { id: 'economy', label: 'Economy' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'text-ti9-accent border-b-2 border-ti9-accent'
                  : 'text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center p-4 opacity-50 animate-pulse">...</div>
          ) : sortedLeaderboard.length === 0 ? (
            <div className="text-center p-4 opacity-50 text-sm">
              No one has completed the challenge yet.
            </div>
          ) : (
            sortedLeaderboard.map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-ti9-dark/40 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                  <span className="font-bold">{entry.name}</span>
                  {entry.task && <span title="Task completed">⭐</span>}
                </div>
                <span
                  className={`font-bold ${
                    activeTab === 'score' && i === 0 ? 'text-ti9-accent' : 'text-slate-300'
                  }`}
                >
                  {activeTab === 'score' && normalizePlacement(entry.score)}
                  {activeTab === 'power' && `Avg OVR: ${entry.power}`}
                  {activeTab === 'economy' && `Saved: $${entry.saved}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PAST DAILY CHALLENGES (PRACTICE ONLY, NO STATS) */}
      <div className="mt-4 bg-ti9-panel rounded-xl border border-ti9-accent/20 px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Past Challenges
          </div>
          <div className="text-[10px] text-ti9-teal">Practice only · No stats</div>
        </div>

        <div ref={pastDropdownRef} className="relative w-52 shrink-0">
          <button
            type="button"
            onClick={() => setPastOpen((o) => !o)}
            className={`w-full bg-ti9-dark hover:bg-[#171226] border border-ti9-accent/40 hover:border-ti9-accent px-3 py-1.5 text-xs font-extrabold text-ti9-teal flex items-center justify-between gap-2 transition cursor-pointer ${
              pastOpen
                ? 'rounded-t-xl rounded-b-none border-b-white/10'
                : 'rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
            }`}
          >
            <span className="flex-1 text-center truncate">
              {practiceDate
                ? `${practiceDate} · ${getThemeForDate(practiceDate).title}`
                : 'Select past day'}
            </span>
            <svg
              className={`w-3 h-3 text-ti9-accent shrink-0 transition-transform duration-200 ${
                pastOpen ? 'rotate-180' : 'rotate-0'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {pastOpen && (
            <div className="absolute right-0 left-0 top-full z-30 max-h-52 overflow-y-auto bg-[#151024] border border-t-0 border-ti9-accent/45 rounded-b-xl shadow-[0_12px_28px_rgba(0,0,0,0.65)]">
              {practiceDate && (
                <button
                  type="button"
                  onClick={() => {
                    setPracticeDate(null);
                    setPastOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-center text-slate-400 hover:bg-ti9-panel hover:text-white border-b border-white/5 transition"
                >
                  Back to Today
                </button>
              )}

              {recentDates.map((d) => {
                const pastTheme = getThemeForDate(d);
                const active = practiceDate === d;
                return (
                <button

                key={d}
                  type="button"
                  onClick={() => {
                   setPracticeDate(d);
                   setPastOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs font-bold text-left whitespace-nowrap truncate transition flex items-center justify-start ${
                   active
                    ? 'bg-ti9-accent/20 text-ti9-accent font-extrabold'
                    : 'text-slate-200 hover:bg-ti9-panel hover:text-white'
                  }`}
                  >
                  <span className="truncate">
                    {d} · {pastTheme.title}
                  </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onStart(practiceDate ?? undefined)}
          disabled={isStartDisabled}
          className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        >
          {isPractice
            ? `Start Practice (${practiceDate})`
            : playedToday
            ? "You already completed today's challenge"
            : 'Start Draft'}
        </button>
      </div>
    </div>
  );
}
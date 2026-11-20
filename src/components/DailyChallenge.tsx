import { useState, useEffect } from 'react';
import { hasPlayedDailyToday, getLeaderboard } from '../utils/storage';
import { getTodayTheme, getTodayTask } from '../utils/dailyThemes';
import { translations } from '../utils/i18n';

export default function DailyChallenge({ 
  onStart, 
  onBack,
  lang
}: { 
  onStart: () => void; 
  onBack: () => void;
  lang: 'ru' | 'en';
}) {
  const t = translations[lang];
  const [playedToday, setPlayedToday] = useState(false);
  const [activeDate, setActiveDate] = useState<'today' | 'yesterday'>('today');
  const [activeTab, setActiveTab] = useState<'score' | 'power' | 'economy'>('score');
  
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: string; task: boolean; power: number; saved: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const currentDate = activeDate === 'today' ? today : yesterday;

  const theme = getTodayTheme();
  const task = getTodayTask(theme);

  useEffect(() => {
    setPlayedToday(hasPlayedDailyToday());
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    getLeaderboard(currentDate).then(data => {
      if (isMounted) {
        setLeaderboard(data);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [currentDate]);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (activeTab === 'score') {
      const getScoreValue = (s: string) => s.includes('1-') || s.includes('1-е') ? 1 : s.includes('2-') || s.includes('2-е') ? 2 : s.includes('3') ? 3 : 5;
      return getScoreValue(a.score) - getScoreValue(b.score);
    }
    if (activeTab === 'power') return b.power - a.power;
    if (activeTab === 'economy') return b.saved - a.saved;
    return 0;
  });

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 flex flex-col">
      <button onClick={onBack} className="font-bold mb-4 text-ti9-accent hover:underline self-start">← {t.back}</button>
      
      <div className="bg-gradient-to-br from-ti9-panel to-ti9-dark p-6 rounded-xl border border-ti9-accent shadow-lg text-center mb-6">
        <div className="text-ti9-teal font-bold tracking-widest uppercase text-sm mb-1">{t.dailyChallenge}</div>
        <div className="text-xs text-slate-400 mb-4 font-mono">{today.split('-').reverse().join('.')}</div>
        
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">{theme.title[lang]}</h2>
        <div className="text-xs text-ti9-teal mb-6">{theme.description[lang]}</div>
        
        <div className="bg-ti9-dark/50 p-4 rounded-lg mb-4 text-center border border-ti9-accent/20">
          <div className="text-xs text-ti9-accent font-bold mb-1">🎯 {t.dayTask}</div>
          <div className="text-sm">{task.desc[lang]}</div>
          <div className="text-xs text-slate-400 mt-1">Награда: ⭐ {lang === 'ru' ? 'Звезда в рейтинге' : 'Star on leaderboard'}</div>
        </div>

        <div className="text-lg font-bold mb-1">{t.budget}: <span className="text-green-400">$1000</span></div>
        <div className="text-xs opacity-60 mb-4">{t.dailyBudgetHint}</div>
      </div>

      <div className="flex-1 bg-ti9-panel rounded-xl border border-ti9-accent/20 overflow-hidden flex flex-col">
        <div className="flex border-b border-ti9-accent/20">
          <button onClick={() => setActiveDate('today')} className={`flex-1 py-3 font-bold text-sm ${activeDate === 'today' ? 'bg-ti9-accent/10 text-ti9-accent' : 'opacity-50'}`}>{t.today}</button>
          <button onClick={() => setActiveDate('yesterday')} className={`flex-1 py-3 font-bold text-sm ${activeDate === 'yesterday' ? 'bg-ti9-accent/10 text-ti9-accent' : 'opacity-50'}`}>{t.yesterday}</button>
        </div>

        <div className="flex bg-ti9-dark/30 border-b border-ti9-accent/10">
          <button onClick={() => setActiveTab('score')} className={`flex-1 py-2 text-xs font-bold transition ${activeTab === 'score' ? 'text-ti9-accent border-b-2 border-ti9-accent' : 'text-slate-400'}`}>{lang === 'ru' ? 'Основной' : 'Main'}</button>
          <button onClick={() => setActiveTab('power')} className={`flex-1 py-2 text-xs font-bold transition ${activeTab === 'power' ? 'text-ti9-accent border-b-2 border-ti9-accent' : 'text-slate-400'}`}>{lang === 'ru' ? 'Сила команды' : 'Power'}</button>
          <button onClick={() => setActiveTab('economy')} className={`flex-1 py-2 text-xs font-bold transition ${activeTab === 'economy' ? 'text-ti9-accent border-b-2 border-ti9-accent' : 'text-slate-400'}`}>{lang === 'ru' ? 'Экономия' : 'Economy'}</button>
        </div>
        
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center p-4 opacity-50 animate-pulse">...</div>
          ) : sortedLeaderboard.length === 0 ? (
            <div className="text-center p-4 opacity-50 text-sm">{lang === 'ru' ? 'Пока никто не прошел испытание.' : 'No one has completed the challenge yet.'}</div>
          ) : (
            sortedLeaderboard.map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-ti9-dark/40 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                  <span className="font-bold">{entry.name}</span>
                  {entry.task && <span title="Task completed">⭐</span>}
                </div>
                <span className={`font-bold ${activeTab === 'score' && i === 0 ? 'text-ti9-accent' : 'text-slate-300'}`}>
                  {activeTab === 'score' && entry.score}
                  {activeTab === 'power' && `Avg OVR: ${entry.power}`}
                  {activeTab === 'economy' && `Saved: $${entry.saved}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <button 
          onClick={onStart} 
          disabled={playedToday}
          className="w-full bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        >
          {playedToday ? t.alreadyPlayed : t.startDraft}
        </button>
      </div>
    </div>
  );
}
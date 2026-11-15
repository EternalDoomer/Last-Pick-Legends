import { useState, useEffect } from 'react';
import { hasPlayedDailyToday, getLeaderboard } from '../utils/storage';
import { getTodayTheme } from '../utils/dailyThemes';
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
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday'>('today');
  
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: string; task: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const currentDate = activeTab === 'today' ? today : yesterday;

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

  const theme = getTodayTheme();

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 flex flex-col">
      <button onClick={onBack} className="mb-4 text-ti9-accent hover:underline self-start">← {t.back}</button>
      
      <div className="bg-gradient-to-br from-ti9-panel to-ti9-dark p-6 rounded-xl border border-ti9-accent shadow-lg text-center mb-6">
        
        {/* 1. Заголовок */}
        <div className="text-ti9-teal font-bold tracking-widest uppercase text-sm mb-1">
          {t.dailyChallenge}
        </div>
        
        {/* 2. Дата (формат ДД.ММ.ГГГГ, приглушенная) */}
        <div className="text-xs text-slate-400 mb-4 font-mono">
          {today.split('-').reverse().join('.')}
        </div>
        
        {/* 3. Тема (яркая, крупная) */}
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
          {theme.title[lang]}
        </h2>
        
        {/* Описание темы */}
        <div className="text-xs text-ti9-teal mb-6">{theme.description[lang]}</div>
        
        {/* Блок с заданием */}
        <div className="bg-ti9-dark/50 p-4 rounded-lg mb-4 text-left border border-ti9-accent/20">
          <div className="text-xs text-ti9-accent font-bold mb-1">🎯 {t.dayTask}</div>
          <div className="text-sm">{t.dailyTaskWin}</div>
          <div className="text-xs text-slate-400 mt-1">{t.reward}</div>
        </div>

        {/* Бюджет */}
        <div className="text-lg font-bold mb-1">
          {t.budget}: <span className="text-green-400">$1000</span>
        </div>
        <div className="text-xs opacity-60 mb-4">{t.dailyBudgetHint}</div>
      </div>

      <div className="flex-1 bg-ti9-panel rounded-xl border border-ti9-accent/20 overflow-hidden flex flex-col">
        <div className="flex border-b border-ti9-accent/20">
          <button 
            onClick={() => setActiveTab('today')} 
            className={`flex-1 py-3 font-bold text-sm ${activeTab === 'today' ? 'bg-ti9-accent/10 text-ti9-accent' : 'opacity-50'}`}
          >
            {t.today}
          </button>
          <button 
            onClick={() => setActiveTab('yesterday')} 
            className={`flex-1 py-3 font-bold text-sm ${activeTab === 'yesterday' ? 'bg-ti9-accent/10 text-ti9-accent' : 'opacity-50'}`}
          >
            {t.yesterday}
          </button>
        </div>
        
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center p-4 opacity-50 animate-pulse">Загрузка рейтинга...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center p-4 opacity-50 text-sm">
              {lang === 'ru' ? 'Пока никто не прошел испытание.' : 'No one has completed the challenge yet.'}
            </div>
          ) : (
            leaderboard.map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-ti9-dark/40 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                  <span className="font-bold">{entry.name}</span>
                  {entry.task && <span title={t.taskCompleted}>👁️</span>}
                </div>
                <span className={`font-bold ${entry.score.includes('1-е') ? 'text-ti9-accent' : 'opacity-70'}`}>
                  {entry.score}
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
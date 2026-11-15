import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DraftScreen from './components/DraftScreen';
import ResultScreen from './components/ResultScreen';
import Profile from './components/Profile';
import Database from './components/Database';
import FreeMode from './components/FreeMode';
import DailyChallenge from './components/DailyChallenge';
import type { TournamentResult } from './types';
import { saveDailyResult } from './utils/storage';
import { translations } from './utils/i18n';

type Screen = 'home' | 'draft_normal' | 'draft_memory' | 'draft_daily' | 'draft_free' | 'result' | 'profile' | 'database' | 'daily_setup' | 'free_setup';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  
  // 🔥 Инициализируем язык из localStorage. Если там пусто, ставим 'ru'
  const [lang, setLang] = useState<'ru' | 'en'>(() => {
    const savedLang = localStorage.getItem('lpl_lang');
    return (savedLang === 'en' || savedLang === 'ru') ? savedLang : 'ru';
  });

  const [matchSpeed, setMatchSpeed] = useState<'normal' | 'fast' | 'super'>('normal');
  const [result, setResult] = useState<TournamentResult | null>(null);
  const [freePool, setFreePool] = useState<{ team: string; year: number }[] | undefined>();

  const t = translations[lang];

  // 🔥 При каждом изменении языка сохраняем его в localStorage и меняем HTML-тег
  useEffect(() => {
    localStorage.setItem('lpl_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const handleRestart = () => {
    setResult(null);
    setFreePool(undefined);
    setScreen('home');
  };

  const handleFinishMatch = (r: TournamentResult) => {
    setResult(r);
    if (screen === 'draft_daily') {
      saveDailyResult(r.placement, r.champion);
    }
    setScreen('result');
  };

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light font-sans max-w-lg mx-auto shadow-2xl relative">
      
      {screen === 'home' && (
        <HomeScreen 
          onNavigate={(s) => setScreen(s as Screen)} 
          lang={lang} 
          setLang={setLang} 
        />
      )}

      {(screen === 'draft_normal' || screen === 'draft_memory' || screen === 'draft_daily' || screen === 'draft_free') && (
        <div className="p-4">
          <button onClick={handleRestart} className="mb-4 text-ti9-accent hover:underline">← {t.home}</button>
          
          {screen === 'draft_daily' && (
            <div className="mb-4 text-center text-sm text-ti9-teal font-bold">
              🎯 {lang === 'ru' ? 'Задание: Выиграть турнир!' : 'Task: Win the tournament!'}
            </div>
          )}

          <DraftScreen 
            mode={
              screen === 'draft_memory' ? 'memory' : 
              screen === 'draft_daily' ? 'daily' : 
              screen === 'draft_free' ? 'free' : 'normal'
            }
            lang={lang}
            speed={matchSpeed}
            setSpeed={setMatchSpeed}
            customPool={screen === 'draft_free' ? freePool : undefined}
            budget={screen === 'draft_daily' ? 1000 : undefined}
            onFinish={handleFinishMatch} 
          />
        </div>
      )}

      {screen === 'result' && result && (
        <div className="p-4">
          <ResultScreen 
            result={result} 
            onRestart={handleRestart} 
            speed={matchSpeed}
            lang={lang}
          />
        </div>
      )}

      {screen === 'profile' && <Profile onBack={handleRestart} lang={lang} />}
      
      {screen === 'database' && <Database onBack={handleRestart} lang={lang} />}

      {screen === 'daily_setup' && (
        <DailyChallenge 
          onBack={handleRestart} 
          onStart={() => setScreen('draft_daily')} 
          lang={lang}
        />
      )}

      {screen === 'free_setup' && (
        <FreeMode 
          onBack={handleRestart} 
          onStart={(pool) => { 
            setFreePool(pool); 
            setScreen('draft_free'); 
          }} 
          lang={lang}
        />
      )}
      
    </div>
  );
}
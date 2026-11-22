import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DraftScreen from './components/DraftScreen';
import ResultScreen from './components/ResultScreen';
import Profile from './components/Profile';
import Database from './components/Database';
import FreeMode from './components/FreeMode';
import DailyChallenge from './components/DailyChallenge';
import type { TournamentResult, GameMode, MatchSpeed, TeamOption, Roster } from './types';
import { saveDailyResult, recordRosterDrafted } from './utils/storage';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getTodayTheme, getTodayTask, getThemeForDate } from './utils/dailyThemes';

type Screen =
  | 'home'
  | 'draft_normal'
  | 'draft_memory'
  | 'draft_daily'
  | 'draft_free'
  | 'result'
  | 'profile'
  | 'database'
  | 'daily_setup'
  | 'free_setup';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [matchSpeed, setMatchSpeed] = useState<MatchSpeed>('normal');
  const [result, setResult] = useState<TournamentResult | null>(null);
  const [lastMeta, setLastMeta] = useState<{ avg: number; saved: number }>({ avg: 0, saved: 0 });
  const [freePool, setFreePool] = useState<TeamOption[] | undefined>();
  const [dailyPracticeDate, setDailyPracticeDate] = useState<string | undefined>();
  const [resultMode, setResultMode] = useState<GameMode>('normal');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.lang = 'en';
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleRestart = () => {
    setResult(null);
    setFreePool(undefined);
    setDailyPracticeDate(undefined);
    setScreen('home');
  };

  const handleFinishMatch = (
    r: TournamentResult,
    avg: number,
    saved: number,
    draftedRoster?: Roster
  ) => {
    setResult(r);
    setLastMeta({ avg, saved });

    const currentMode = screen.replace('draft_', '') as GameMode;
    const isPracticeRun = screen === 'draft_daily' && Boolean(dailyPracticeDate);

    if (currentMode !== 'free' && !isPracticeRun) {
      recordRosterDrafted(avg);
    }

    if (screen === 'draft_daily' && !isPracticeRun) {
      const theme = getTodayTheme();
      const task = getTodayTask(theme);
      const taskCompleted = task.check(r, avg, saved, theme.budget, draftedRoster);
      saveDailyResult(r.placement, taskCompleted, avg, saved, theme.title);
    }

    setResultMode(isPracticeRun ? 'free' : currentMode);
    setScreen('result');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-ti9-dark text-ti9-light flex items-center justify-center font-bold text-lg animate-pulse">
        Loading profile...
      </div>
    );
  }

  const isDraftScreen =
    screen === 'draft_normal' ||
    screen === 'draft_memory' ||
    screen === 'draft_daily' ||
    screen === 'draft_free';

  const activeDailyBudget =
    screen === 'draft_daily'
      ? (dailyPracticeDate ? getThemeForDate(dailyPracticeDate) : getTodayTheme()).budget
      : undefined;

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light font-sans max-w-lg mx-auto shadow-2xl relative">
      {screen === 'home' && <HomeScreen onNavigate={(s) => setScreen(s as Screen)} />}

      {isDraftScreen && (
        <div className="p-4">
          <button
            onClick={handleRestart}
            className="font-bold mb-4 text-ti9-accent hover:underline"
          >
            ← Back
          </button>

          <DraftScreen
            mode={screen.replace('draft_', '') as GameMode}
            speed={matchSpeed}
            setSpeed={setMatchSpeed}
            customPool={screen === 'draft_free' ? freePool : undefined}
            budget={activeDailyBudget}
            dailyDate={screen === 'draft_daily' ? dailyPracticeDate : undefined}
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
            mode={resultMode}
            avgRating={lastMeta.avg}
            savedBudget={lastMeta.saved}
          />
        </div>
      )}

      {screen === 'profile' && <Profile onBack={handleRestart} />}

      {screen === 'database' && <Database onBack={handleRestart} />}

      {screen === 'daily_setup' && (
        <DailyChallenge
          onBack={handleRestart}
          onStart={(practiceDate) => {
            setDailyPracticeDate(practiceDate);
            setScreen('draft_daily');
          }}
        />
      )}

      {screen === 'free_setup' && (
        <FreeMode
          onBack={handleRestart}
          onStart={(pool) => {
            setFreePool(pool);
            setScreen('draft_free');
          }}
        />
      )}
    </div>
  );
}
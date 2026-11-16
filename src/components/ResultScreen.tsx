import { useEffect, useState } from 'react';
import type { TournamentResult } from '../types';
import { trackMatch } from '../utils/storage';
import { translations } from '../utils/i18n';

export default function ResultScreen({ result, onRestart, speed, lang, mode }: {
  result: TournamentResult;
  onRestart: () => void;
  speed: 'normal' | 'fast' | 'super';
  lang: 'ru' | 'en';
  mode: 'normal' | 'memory' | 'daily' | 'free';
}) {
  const t = translations[lang];
  const [matchIdx, setMatchIdx] = useState(0);
  const [mapCount, setMapCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) {
      if (mode !== 'free') {
        trackMatch(result.champion, mode);
      }
    }
  }, [isFinished, result.champion, mode]);

  useEffect(() => {
    if (isFinished) return;
    if (matchIdx >= result.matches.length) {
      setIsFinished(true);
      return;
    }

    const currentMatch = result.matches[matchIdx];
    const delay = speed === 'super' ? 150 : speed === 'fast' ? 600 : 1500;

    const timer = setTimeout(() => {
      if (mapCount < currentMatch.maps.length) {
        setMapCount(prev => prev + 1);
      } else {
        if (matchIdx === result.matches.length - 1) {
          setIsFinished(true);
        } else {
          setMatchIdx(prev => prev + 1);
          setMapCount(0);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [matchIdx, mapCount, isFinished, result.matches, speed]);

  const getScore = (match: typeof result.matches[0], currentMapIdx: number) => {
    const playedMaps = match.maps.slice(0, currentMapIdx);
    const myScore = playedMaps.filter(m => m.won).length;
    const oppScore = playedMaps.filter(m => !m.won).length;
    return { myScore, oppScore };
  };

  const handleSkip = () => {
    if (result.matches.length === 0) {
      setIsFinished(true);
      return;
    }
    setMatchIdx(result.matches.length - 1);
    setMapCount(result.matches[result.matches.length - 1].maps.length);
    setIsFinished(true);
  };

  // СЛОВАРИ ДЛЯ ПЕРЕВОДА СТАДИЙ И МЕСТ
  const roundTranslations: Record<string, { ru: string, en: string }> = {
    'Верхняя сетка: Четвертьфинал': { ru: 'Верхняя сетка: Четвертьфинал', en: 'Upper Bracket: Quarterfinal' },
    'Верхняя сетка: Полуфинал': { ru: 'Верхняя сетка: Полуфинал', en: 'Upper Bracket: Semifinal' },
    'Верхняя сетка: Финал': { ru: 'Верхняя сетка: Финал', en: 'Upper Bracket: Final' },
    'Нижняя сетка: Раунд 1': { ru: 'Нижняя сетка: Раунд 1', en: 'Lower Bracket: Round 1' },
    'Нижняя сетка: Раунд 2': { ru: 'Нижняя сетка: Раунд 2', en: 'Lower Bracket: Round 2' },
    'Нижняя сетка: Финал': { ru: 'Нижняя сетка: Финал', en: 'Lower Bracket: Final' },
    'Гранд-финал': { ru: 'Гранд-финал', en: 'Grand Final' },
  };

  const placementTranslations: Record<string, { ru: string, en: string }> = {
    'Чемпион': { ru: 'Чемпион', en: 'Champion' },
    'Финалист': { ru: 'Финалист', en: 'Finalist' },
    'Топ-3': { ru: 'Топ-3', en: 'Top 3' },
    'Топ-4': { ru: 'Топ-4', en: 'Top 4' },
    'Топ-6': { ru: 'Топ-6', en: 'Top 6' },
    'Топ-8': { ru: 'Топ-8', en: 'Top 8' },
  };

  const titleTranslations: Record<string, { ru: string, en: string }> = {
    'Aegis Guardian': { ru: 'Страж Аегиса', en: 'Aegis Guardian' },
    'Grand Finalist': { ru: 'Гранд-финалист', en: 'Grand Finalist' },
    'Bronze': { ru: 'Бронзовый призер', en: 'Bronze' },
    'Contender': { ru: 'Претендент', en: 'Contender' },
    'Survivor': { ru: 'Выживший', en: 'Survivor' },
    'Challenger': { ru: 'Бросающий вызов', en: 'Challenger' },
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-6 text-center transition-colors duration-500 relative ${isFinished && result.champion ? 'bg-ti9-accent text-ti9-dark' : 'bg-ti9-panel'}`}>
        
        {/* 🔥 БЕЙДЖ ТАКТИКИ */}
        <div className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
          isFinished && result.champion ? 'bg-black/20 text-black/70' : 'bg-ti9-dark text-ti9-accent border border-ti9-accent/30'
        }`}>
          {result.tactic === 'early' ? '⚔️ EARLY' : result.tactic === 'late' ? '🛡️ LATE' : '⚖️ MID'}
        </div>

        <div className="text-3xl md:text-4xl font-bold mb-2">
          {isFinished ? (placementTranslations[result.placement]?.[lang] || result.placement) : t.tournamentInProgress}
        </div>
        <div className="text-base md:text-lg opacity-90 font-bold">
          {isFinished ? (titleTranslations[result.title]?.[lang] || result.title) : t.simulation}
        </div>
      </div>

      <div className="space-y-4">
        {result.matches.map((m, index) => {
          if (index > matchIdx) return null;

          const isCurrent = index === matchIdx;
          const showMaps = isCurrent ? mapCount : m.maps.length;
          const { myScore, oppScore } = getScore(m, showMaps);
          const matchEnded = isCurrent ? mapCount === m.maps.length : true;
          const playedMaps = m.maps.slice(0, showMaps);

          const bracketColor = m.bracket === 'upper' ? 'border-blue-500/50' : m.bracket === 'lower' ? 'border-orange-500/50' : 'border-ti9-accent';

          return (
            <div 
              key={index} 
              className={`p-3 md:p-4 rounded transition-all duration-300 border-2 ${
                matchEnded 
                  ? m.won ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'
                  : `bg-ti9-panel ${bracketColor}`
              }`}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base md:text-lg flex flex-wrap items-center gap-2 text-ti9-light">
                    <span className="break-words">
                      {roundTranslations[m.round]?.[lang] || m.round}
                    </span>
                    <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded shrink-0 ${
                      m.bracket === 'upper' ? 'bg-blue-600/50 text-blue-200' : 
                      m.bracket === 'lower' ? 'bg-orange-600/50 text-orange-200' : 
                      'bg-ti9-accent text-ti9-dark'
                    }`}>
                      {m.bracket === 'upper' ? t.upper : m.bracket === 'lower' ? t.lower : t.grandFinal}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm opacity-70 truncate">{m.opponent} <span className="text-[10px] opacity-50">({lang === 'ru' ? 'Ср. сила' : 'Avg OVR'}: {m.opponentAvgRating})</span></div>
                  
                  {!matchEnded && isCurrent && (
                    <div className="text-xs text-ti9-teal mt-1 animate-pulse">{t.playingMap} {mapCount + 1}...</div>
                  )}
                  {matchEnded && !m.won && index !== result.matches.length - 1 && m.bracket === 'upper' && (
                    <div className="text-xs text-orange-400 mt-1 font-bold">{t.dropToLower}</div>
                  )}
                </div>

                <div className={`shrink-0 whitespace-nowrap text-xl md:text-2xl font-bold ${
                  matchEnded ? m.won ? 'text-green-400' : 'text-red-400' : 'text-ti9-accent'
                }`}>
                  {myScore} : {oppScore}
                </div>
              </div>

              <div className="space-y-1 mt-3">
                {playedMaps.map((map, i) => {
                  const isPositiveEvent = map.shift && map.shift > 0;
                  const isNegativeEvent = map.shift && map.shift < 0;
                  const showEvent = (map.won && isPositiveEvent) || (!map.won && isNegativeEvent);
                  
                  return (
                    <div key={i} className="text-xs flex items-start gap-2">
                      <span className={`font-mono font-bold min-w-[50px] md:min-w-[60px] ${map.won ? 'text-green-500' : 'text-red-500'}`}>
                        {lang === 'ru' ? 'Карта' : 'Map'} {i + 1}:
                      </span>
                      {showEvent && map.event ? (
                        <div className="flex flex-col flex-1 min-w-0">
                          {/* 🔥 ДОБАВЛЕНА ЦВЕТОВАЯ ИНДИКАЦИЯ СОБЫТИЙ */}
                          <span className={`break-words ${isPositiveEvent ? 'text-green-400' : 'text-red-400'}`}>
                            ⚡ {map.event}
                          </span>
                          {map.caster && <span className="text-ti9-teal italic mt-0.5 break-words">🎙️ {map.caster}</span>}
                        </div>
                      ) : (
                        <span className="opacity-50 italic flex-1">{t.quietGame}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!isFinished && (
          <button
            onClick={handleSkip}
            className="flex-1 bg-ti9-panel hover:bg-slate-700 rounded-lg py-3 font-bold border border-ti9-accent/30 transition"
          >
            {t.skip}
          </button>
        )}
        
        <button
          onClick={onRestart}
          disabled={!isFinished}
          className="flex-1 bg-ti9-accent text-ti9-dark hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg py-3 font-bold transition"
        >
          {isFinished ? t.playAgain : t.tournamentInProgress}
        </button>
      </div>
    </div>
  );
}
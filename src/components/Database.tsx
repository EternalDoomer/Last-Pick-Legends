import { useState, useMemo } from 'react';
import rawPlayers from '../data/players.json';
import type { Player } from '../types';

type ViewMode = 'menu' | 'years' | 'teams' | 'year-detail' | 'team-detail' | 'modes';

export default function Database({ onBack, lang }: { onBack: () => void; lang: 'ru' | 'en' }) {
  const [view, setView] = useState<ViewMode>('menu');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const players = rawPlayers as Player[];

  const years = useMemo(() => Array.from(new Set(players.map(p => p.year))).sort((a, b) => a - b), [players]);
  const teams = useMemo(() => Array.from(new Set(players.map(p => p.team))).sort(), [players]);

  const t = {
    ru: {
      knowledgeBase: 'База знаний',
      selectTournament: 'Выберите турнир',
      selectTeam: 'Выберите команду',
      rosters: 'Составы',
      byYears: 'По годам (TI)',
      exploreRosters: 'Изучить составы конкретного турнира',
      byTeams: 'По командам',
      teamHistory: 'История ростеров организаций',
      gameModes: 'Режимы игры',
      gameModesDesc: 'Изучить правила, тактики и механики',
      back: 'Назад',
      pos: 'ПОЗ',
      modes: [
        { title: 'Обычная игра', desc: 'Классический драфт. Все рейтинги игроков видны. Дается 3 реролла (попытки сменить выпавшую команду). Идеально для первого знакомства и тестов.' },
        { title: 'Игра по памяти', desc: 'Хардкорный режим. Рейтинги скрыты, вы видите только позиции и ники. Дается всего 1 реролл. Проверьте, насколько хорошо вы помните легендарные составы.' },
        { title: 'Свободный драфт', desc: 'Вы сами выбираете пул команд, из которых будут выпадать игроки. Отличный способ собрать состав своей любимой организации или эпохи.' },
        { title: 'Ежедневное испытание', desc: 'Одинаковые условия для всех. Тема дня, фиксированный бюджет и скрытые рейтинги. Успейте пройти вызов, выполнить задание и попасть в таблицу лидеров.' },
        { title: '⚔️ Early Game (Ранняя игра)', desc: 'Акцент на позиции 4 и 5. Агрессивные саппорты, ранние драки и захват карты. В этой тактике слабые керри будут не так заметны, но сильные саппорты дадут огромное преимущество.' },
        { title: '⚖️ Mid Game (Середина)', desc: 'Сбалансированный подход. Игра строится вокруг мидера (поз. 2) и оффлейнера (поз. 3), которые задают темп. Все роли важны одинаково.' },
        { title: '🛡️ Late Game (Поздняя игра)', desc: 'Ставка на керри (поз. 1) и мидера (поз. 2). Вам нужны сильные кор-игроки, чтобы пережить раннее давление и выиграть игру на поздних стадиях. Саппорты здесь играют второстепенную роль.' }
      ]
    },
    en: {
      knowledgeBase: 'Database',
      selectTournament: 'Select tournament',
      selectTeam: 'Select team',
      rosters: 'Rosters',
      byYears: 'By years (TI)',
      exploreRosters: 'Explore rosters of a specific tournament',
      byTeams: 'By teams',
      teamHistory: 'Organization roster history',
      gameModes: 'Game Modes',
      gameModesDesc: 'Learn rules, tactics and mechanics',
      back: 'Back',
      pos: 'POS',
      modes: [
        { title: 'Normal Game', desc: 'Classic draft. All player ratings are visible. You get 3 rerolls. Perfect for your first experience.' },
        { title: 'Memory Game', desc: 'Hardcore mode. Ratings are hidden, you only see positions and nicknames. Only 1 reroll. Test how well you remember legendary rosters.' },
        { title: 'Free Draft', desc: 'You choose the pool of teams. A great way to assemble your favorite organization or era.' },
        { title: 'Daily Challenge', desc: 'Equal conditions for everyone. Daily theme, fixed budget, and hidden ratings. Complete the task and climb the leaderboard.' },
        { title: '⚔️ Early Game', desc: 'Focus on pos 4 and 5. Aggressive supports, early fights and map control. Strong supports give a huge advantage.' },
        { title: '⚖️ Mid Game', desc: 'Balanced approach. The game revolves around mid (pos 2) and offlane (pos 3) setting the tempo. All roles matter equally.' },
        { title: '🛡️ Late Game', desc: 'Focus on carry (pos 1) and mid (pos 2). You need strong cores to survive early pressure and win late. Supports play a secondary role here.' }
      ]
    }
  }[lang];

  // --- ФУНКЦИИ РЕНДЕРА ---

  const renderMenu = () => (
    <div className="space-y-4 mt-8">
      <button 
        onClick={() => setView('years')}
        className="w-full bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-6 rounded-xl border border-ti9-accent/30 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-bold text-lg">{t.byYears}</div>
          <div className="text-sm opacity-70">{t.exploreRosters}</div>
        </div>
        <div className="text-2xl">→</div>
      </button>

      <button 
        onClick={() => setView('teams')}
        className="w-full bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-6 rounded-xl border border-ti9-accent/30 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="text-2xl mb-1">🛡️</div>
          <div className="font-bold text-lg">{t.byTeams}</div>
          <div className="text-sm opacity-70">{t.teamHistory}</div>
        </div>
        <div className="text-2xl">→</div>
      </button>

      {/* 🔥 НОВАЯ КНОПКА РЕЖИМОВ */}
      <button 
        onClick={() => setView('modes')}
        className="w-full bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-6 rounded-xl border border-ti9-accent/30 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="text-2xl mb-1">🎮</div>
          <div className="font-bold text-lg">{t.gameModes}</div>
          <div className="text-sm opacity-70">{t.gameModesDesc}</div>
        </div>
        <div className="text-2xl">→</div>
      </button>
    </div>
  );

  const renderModes = () => (
    <div className="space-y-4 mt-4">
      {t.modes.map((mode, idx) => (
        <div key={idx} className="bg-ti9-panel rounded-xl p-4 border border-ti9-accent/20">
          <h3 className="font-bold text-ti9-accent mb-2 text-lg">{mode.title}</h3>
          <p className="text-sm opacity-80 leading-relaxed">{mode.desc}</p>
        </div>
      ))}
    </div>
  );

  const renderYears = () => (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {years.map(year => (
        <button
          key={year}
          onClick={() => { setSelectedYear(year); setView('year-detail'); }}
          className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-lg border border-ti9-accent/20 text-center font-bold"
        >
          TI{year === 2011 ? '1' : year - 2010}
          <span className="block text-xs font-normal opacity-50 mt-1">{year}</span>
        </button>
      ))}
    </div>
  );

  const renderTeams = () => (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {teams.map(team => (
        <button
          key={team}
          onClick={() => { setSelectedTeam(team); setView('team-detail'); }}
          className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-3 rounded-lg border border-ti9-accent/20 text-sm font-bold truncate"
        >
          {team}
        </button>
      ))}
    </div>
  );

  const renderYearDetail = () => {
    const yearPlayers = players.filter(p => p.year === selectedYear);
    const grouped = yearPlayers.reduce((acc, p) => {
      if (!acc[p.team]) acc[p.team] = [];
      acc[p.team].push(p);
      return acc;
    }, {} as Record<string, Player[]>);

    return (
      <div className="space-y-6 mt-4">
        {Object.entries(grouped).map(([team, roster]) => (
          <div key={team} className="bg-ti9-panel rounded-xl p-4 border border-ti9-accent/20">
            <h3 className="font-bold text-ti9-accent mb-3 text-lg">{team}</h3>
            <div className="space-y-2">
              {roster.sort((a,b) => a.positions[0] - b.positions[0]).map(p => (
                <div key={p.id} className="flex justify-between items-center bg-ti9-dark p-2 rounded border border-ti9-accent/10 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ti9-teal min-w-[50px]">{t.pos} {p.positions.join(',')}</span>
                    <span className="font-bold">{p.nickname}</span>
                  </div>
                  <span className="font-bold text-ti9-accent">{p.rating}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTeamDetail = () => {
    const teamPlayers = players.filter(p => p.team === selectedTeam);
    const grouped = teamPlayers.reduce((acc, p) => {
      if (!acc[p.year]) acc[p.year] = [];
      acc[p.year].push(p);
      return acc;
    }, {} as Record<number, Player[]>);

    return (
      <div className="space-y-6 mt-4">
        {Object.entries(grouped).sort((a,b) => Number(a[0]) - Number(b[0])).map(([year, roster]) => (
          <div key={year} className="bg-ti9-panel rounded-xl p-4 border border-ti9-accent/20">
            <h3 className="font-bold text-ti9-accent mb-3 text-lg">TI{Number(year) === 2011 ? '1' : Number(year) - 2010} ({year})</h3>
            <div className="space-y-2">
              {roster.sort((a,b) => a.positions[0] - b.positions[0]).map(p => (
                <div key={p.id} className="flex justify-between items-center bg-ti9-dark p-2 rounded border border-ti9-accent/10 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ti9-teal min-w-[50px]">{t.pos} {p.positions.join(',')}</span>
                    <span className="font-bold">{p.nickname}</span>
                  </div>
                  <span className="font-bold text-ti9-accent">{p.rating}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleBack = () => {
    if (view === 'menu') onBack();
    else if (view === 'year-detail') setView('years');
    else if (view === 'team-detail') setView('teams');
    else setView('menu');
  };

  return (
    <div className="min-h-screen bg-ti9-dark text-ti9-light p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="mr-4 text-ti9-accent hover:underline font-bold">
          ← {t.back}
        </button>
        <h2 className="text-xl font-bold">
          {view === 'menu' && t.knowledgeBase}
          {view === 'years' && t.selectTournament}
          {view === 'teams' && t.selectTeam}
          {view === 'year-detail' && `TI${selectedYear === 2011 ? '1' : (selectedYear || 0) - 2010} ${t.rosters}`}
          {view === 'team-detail' && selectedTeam}
          {view === 'modes' && t.gameModes}
        </h2>
      </div>

      {view === 'menu' && renderMenu()}
      {view === 'years' && renderYears()}
      {view === 'teams' && renderTeams()}
      {view === 'year-detail' && renderYearDetail()}
      {view === 'team-detail' && renderTeamDetail()}
      {view === 'modes' && renderModes()}
    </div>
  );
}
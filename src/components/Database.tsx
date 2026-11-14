import React, { useState, useMemo } from 'react';
import rawPlayers from '../data/players.json';
import type { Player } from '../types';
import { translations } from '../utils/i18n';

type ViewMode = 'menu' | 'years' | 'teams' | 'year-detail' | 'team-detail';

export default function Database({ onBack, lang }: { onBack: () => void; lang: 'ru' | 'en' }) {
  const t = translations[lang];
  const [view, setView] = useState<ViewMode>('menu');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const players = rawPlayers as Player[];

  const years = useMemo(() => Array.from(new Set(players.map(p => p.year))).sort((a, b) => a - b), [players]);
  const teams = useMemo(() => Array.from(new Set(players.map(p => p.team))).sort(), [players]);

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
        </h2>
      </div>

      {view === 'menu' && renderMenu()}
      {view === 'years' && renderYears()}
      {view === 'teams' && renderTeams()}
      {view === 'year-detail' && renderYearDetail()}
      {view === 'team-detail' && renderTeamDetail()}
    </div>
  );
}
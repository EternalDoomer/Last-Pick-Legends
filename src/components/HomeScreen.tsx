import { translations } from '../utils/i18n';

export default function HomeScreen({ 
  onNavigate, 
  lang, 
  setLang 
}: { 
  onNavigate: (screen: string) => void;
  lang: 'ru' | 'en';
  setLang: (l: 'ru' | 'en') => void;
}) {
  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-screen bg-ti9-dark text-ti9-light pb-10">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-3xl font-bold text-ti9-accent tracking-wider">Last Pick Legends</h1>
        
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'ru' | 'en')}
          className="bg-ti9-panel px-2 py-1.5 rounded border border-ti9-accent/50 text-sm text-white outline-none cursor-pointer hover:border-ti9-accent transition"
        >
          <option value="ru">RU</option>
          <option value="en">ENG</option>
        </select>
      </div>

      <div className="text-center px-4 mb-6">
        <p className="font-vibes text-ti9-teal text-xl md:text-2xl tracking-wide opacity-80 drop-shadow-md">
          {lang === 'ru' 
            ? 'Соберите легендарный состав из игроков всех The International и приведите его к Аегису.' 
            : 'Draft a legendary roster from all The Internationals and lead them to the Aegis.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        {/* 🔥 Обычная игра */}
        <button onClick={() => onNavigate('draft_normal')} className="group bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="mb-2 text-ti9-accent group-hover:text-ti9-dark transition">
            <svg style={{ width: '28px', height: '28px' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="M5 7h14" />
              <path d="M5 7l-2.5 6h5L5 7z" />
              <path d="M19 7l-2.5 6h5L19 7z" />
              <path d="M9 21h6" />
            </svg>
          </div>
          <div className="font-bold text-lg">{t.normalMode}</div>
        </button>

        {/* 🔥 По памяти */}
        <button onClick={() => onNavigate('draft_memory')} className="group bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="mb-2 text-ti9-accent group-hover:text-ti9-dark transition">
            <svg style={{ width: '28px', height: '28px' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
            </svg>
          </div>
          <div className="font-bold text-lg">{t.memoryMode}</div>
        </button>
        
        {/* 🔥 Свободный драфт */}
        <button onClick={() => onNavigate('free_setup')} className="group bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="mb-2 text-ti9-accent group-hover:text-ti9-dark transition">
            <svg style={{ width: '28px', height: '28px' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="font-bold text-lg">{t.freeMode}</div>
        </button>

        {/* 🔥 Испытание дня */}
        <button onClick={() => onNavigate('daily_setup')} className="group bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left relative">
          <div className="mb-2 text-ti9-accent group-hover:text-ti9-dark transition">
            <svg style={{ width: '28px', height: '28px' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div className="font-bold text-lg">{t.dailyMode}</div>
          <div className="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">NEW</div>
        </button>
      </div>

      {/* КВАДРАТНАЯ КАРТА */}
      <div className="px-4 mb-8 flex justify-center">
        <div className="w-full max-w-[340px] aspect-square bg-[#181326] rounded-2xl border border-purple-400/15 relative overflow-hidden shadow-[0_12px_28px_rgba(7,4,15,0.55)] flex items-center justify-center select-none">
          
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 14% 86%, rgba(16, 185, 129, 0.11) 0%, transparent 46%),
                radial-gradient(circle at 86% 14%, rgba(244, 63, 94, 0.11) 0%, transparent 46%),
                radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 65%)
              `
            }}
          />

          <div 
            className="absolute inset-0 opacity-[0.045] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #e9d5ff 1px, transparent 1px), linear-gradient(to bottom, #e9d5ff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.10" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10" />
              </linearGradient>
            </defs>

            <polygon points="22,68 42,68 22,48" fill="#c4b5fd" opacity="0.025" />
            <polygon points="78,32 58,32 78,52" fill="#c4b5fd" opacity="0.025" />
            <circle cx="33" cy="28" r="9" fill="#34d399" opacity="0.025" />
            <circle cx="67" cy="72" r="9" fill="#fb7185" opacity="0.025" />

            <path 
              d="M -5 5 C 25 20, 35 45, 50 50 C 65 55, 75 80, 105 95" 
              fill="none" 
              stroke="url(#riverGrad)" 
              strokeWidth="6.5" 
              strokeLinecap="round"
            />

            <circle cx="34" cy="33" r="3.4" fill="#181326" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.45" />
            <circle cx="34" cy="33" r="1.1" fill="#7dd3fc" opacity="0.4" />

            <g stroke="#e9d5ff" strokeOpacity="0.045" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12 88 L 12 18 Q 12 12 18 12 L 88 12" />
              <path d="M 14 86 L 86 14" />
              <path d="M 12 88 L 82 88 Q 88 88 88 82 L 88 12" />
            </g>

            <g stroke="#cbd5e1" strokeOpacity="0.22" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12 88 L 12 18 Q 12 12 18 12 L 88 12" />
              <path d="M 14 86 L 86 14" />
              <path d="M 12 88 L 82 88 Q 88 88 88 82 L 88 12" />
            </g>
          </svg>

          <div className="absolute bottom-2.5 left-2.5 w-11 h-11 rounded-full bg-[#122620]/90 border border-emerald-400/40 flex flex-col items-center justify-center">
            <div className="w-3 h-3 rotate-45 bg-emerald-400/15 border border-emerald-400/80 mb-0.5" />
            <span className="text-[6.5px] tracking-wider font-extrabold text-emerald-300/90">RADIANT</span>
          </div>

          <div className="absolute top-2.5 right-2.5 w-11 h-11 rounded-full bg-[#29131c]/90 border border-rose-400/40 flex flex-col items-center justify-center">
            <div className="w-3 h-3 rotate-45 bg-rose-400/15 border border-rose-400/80 mb-0.5" />
            <span className="text-[6.5px] tracking-wider font-extrabold text-rose-300/90">DIRE</span>
          </div>

          {[
            { pos: 1, style: 'bottom-[11%] left-[45%]' },
            { pos: 2, style: 'bottom-[36%] left-[36%]' },
            { pos: 3, style: 'top-[14%] left-[14%]' },
            { pos: 4, style: 'bottom-[54%] left-[11%]' },
            { pos: 5, style: 'bottom-[11%] left-[23%]' },
          ].map((p) => (
            <div
              key={`rad-${p.pos}`}
              title={`Radiant Pos ${p.pos}`}
              className={`absolute ${p.style} -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-slate-950 ring-2 ring-[#181326] shadow-md flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-transform duration-200 hover:scale-125 hover:z-10`}
            >
              {p.pos}
            </div>
          ))}

          {[
            { pos: 1, style: 'top-[11%] right-[45%]' },
            { pos: 2, style: 'top-[36%] right-[36%]' },
            { pos: 3, style: 'bottom-[14%] right-[14%]' },
            { pos: 4, style: 'top-[54%] right-[11%]' },
            { pos: 5, style: 'top-[11%] right-[23%]' },
          ].map((p) => (
            <div
              key={`dire-${p.pos}`}
              title={`Dire Pos ${p.pos}`}
              className={`absolute ${p.style} translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-red-700 text-white ring-2 ring-[#181326] shadow-md flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-transform duration-200 hover:scale-125 hover:z-10`}
            >
              {p.pos}
            </div>
          ))}
        </div>
      </div>
      
      {/* 3 ЯЧЕЙКИ ПОД КАРТОЙ */}
      <div className="grid grid-cols-3 gap-2 px-4 text-center mb-8">
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">520</div>
          <div className="text-xs opacity-70">{t.players}</div>
        </div>
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">104</div>
          <div className="text-xs opacity-70">{t.teams}</div>
        </div>
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">1,420</div>
          <div className="text-xs opacity-70">{t.stacks}</div>
        </div>
      </div>

      {/* КНОПКИ ПРОФИЛЯ И БАЗЫ ДАННЫХ */}
      <div className="mt-auto px-4 flex gap-2">
        <button onClick={() => onNavigate('profile')} className="text-lg flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-teal/30 hover:bg-ti9-teal/10 transition flex items-center justify-center gap-2">
          <svg style={{ width: '20px', height: '20px' }} width="20" height="20" className="text-ti9-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{t.profile}</span>
        </button>

        <button onClick={() => onNavigate('database')} className="text-lg flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-accent/30 hover:bg-ti9-accent/10 transition flex items-center justify-center gap-2">
          <svg style={{ width: '20px', height: '20px' }} width="20" height="20" className="text-ti9-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h8" />
          </svg>
          <span>{t.database}</span>
        </button>
      </div>

      <div className="text-center text-xs opacity-70 mt-6 px-4">
        {t.footer}
      </div>
    </div>
  );
}
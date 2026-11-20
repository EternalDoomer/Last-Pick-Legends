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
        <p className="text-ti9-teal text-xl opacity-80">
          {lang === 'ru' 
            ? 'Соберите легендарный состав из игроков всех The International и приведите его к Аегису.' 
            : 'Draft a legendary roster from all The Internationals and lead them to the Aegis.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        <button onClick={() => onNavigate('draft_normal')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">⚖️</div>
          <div className="font-bold text-lg">{t.normalMode}</div>
        </button>
        <button onClick={() => onNavigate('draft_memory')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">🧠</div>
          <div className="font-bold text-lg">{t.memoryMode}</div>
        </button>
        
        <button onClick={() => onNavigate('free_setup')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">🛠️</div>
          <div className="font-bold text-lg">{t.freeMode}</div>
        </button>

        <button onClick={() => onNavigate('daily_setup')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left relative">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold text-lg">{t.dailyMode}</div>
          <div className="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">NEW</div>
        </button>
      </div>

      {/* КВАДРАТНАЯ КАРТА */}
      <div className="px-4 mb-8 flex justify-center">
        <div className="w-full max-w-[320px] aspect-square bg-[#1a241c] rounded-xl border border-ti9-accent/20 relative overflow-hidden shadow-inner flex items-center justify-center">
          
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Река: из левого верхнего (0,0) в правый нижний (100,100) */}
            <path d="M 0 0 Q 40 60 100 100" fill="none" stroke="#3b82f6" strokeWidth="6" opacity="0.3" />
            
            {/* Верхняя линия (Top Lane): вверх по левому краю, затем вправо по верхнему */}
            <path d="M 10 90 L 10 10 L 90 10" fill="none" stroke="#6b7280" strokeWidth="3" />
            
            {/* Средняя линия (Mid Lane): по диагонали */}
            <path d="M 15 85 L 85 15" fill="none" stroke="#6b7280" strokeWidth="3" />
            
            {/* Нижняя линия (Bot Lane): вправо по нижнему краю, затем вверх по правому */}
            <path d="M 10 90 L 90 90 L 90 10" fill="none" stroke="#6b7280" strokeWidth="3" />
          </svg>

          {/* Базы */}
          <div className="absolute bottom-2 left-2 w-11 h-11 rounded-full bg-green-900/50 border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] flex items-center justify-center">
            <span className="text-[8px] font-bold text-green-300">RADIANT</span>
          </div>
          <div className="absolute top-2 right-2 w-11 h-11 rounded-full bg-red-900/50 border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center">
            <span className="text-[8px] font-bold text-red-300">DIRE</span>
          </div>

          {/* ИГРОКИ RADIANT (Зеленые, слева-снизу) */}
          <div className="absolute bottom-[15%] left-[45%] w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 1">1</div>
          <div className="absolute bottom-[35%] left-[35%] w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 2">2</div>
          <div className="absolute top-[15%] left-[15%] w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 3">3</div>
          <div className="absolute bottom-[55%] left-[15%] w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 4">4</div>
          <div className="absolute bottom-[10%] left-[20%] w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 5">5</div>

          {/* ИГРОКИ DIRE (Красные, справа-сверху) */}
          <div className="absolute top-[15%] right-[45%] w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 1">1</div>
          <div className="absolute top-[35%] right-[35%] w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 2">2</div>
          <div className="absolute bottom-[15%] right-[15%] w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 3">3</div>
          <div className="absolute top-[55%] right-[15%] w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 4">4</div>
          <div className="absolute top-[10%] right-[20%] w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg" title="Pos 5">5</div>
        </div>
      </div>

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
        <button onClick={() => onNavigate('profile')} className="text-lg flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-teal/30 hover:bg-ti9-teal/10 transition">👤 {t.profile}</button>
        <button onClick={() => onNavigate('database')} className="text-lg flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-accent/30 hover:bg-ti9-accent/10 transition">📚 {t.database}</button>
      </div>

      <div className="text-center text-xs opacity-70 mt-6 px-4">
        {t.footer}
      </div>
    </div>
  );
}
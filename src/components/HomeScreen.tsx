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
      {/* Шапка */}
      <div className="flex justify-between items-center p-4">
        <h1 className="text-3xl font-bold text-ti9-accent tracking-wider">Last Pick Legends</h1>
        
        {/* Выпадающий список языков */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'ru' | 'en')}
          className="bg-ti9-panel px-2 py-1.5 rounded border border-ti9-accent/50 text-sm text-white outline-none cursor-pointer hover:border-ti9-accent transition"
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="text-center px-4 mb-6">
        <p className="text-sm opacity-80">
          {lang === 'ru' 
            ? 'Соберите легендарный состав из игроков всех The International и приведите его к Аегису.' 
            : 'Draft a legendary roster from all The Internationals and lead them to the Aegis.'}
        </p>
      </div>

      {/* Кнопки режимов */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        <button onClick={() => onNavigate('draft_normal')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">⚖️</div>
          <div className="font-bold">{t.normalMode}</div>
        </button>
        <button onClick={() => onNavigate('draft_memory')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">🧠</div>
          <div className="font-bold">{t.memoryMode}</div>
        </button>
        
        {/* Новая кнопка Free Mode */}
        <button onClick={() => onNavigate('free_setup')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left">
          <div className="text-2xl mb-2">🛠️</div>
          <div className="font-bold">{lang === 'ru' ? 'Свободный драфт' : 'Free Draft'}</div>
        </button>

        {/* Кнопка Daily Challenge (исправлен onNavigate) */}
        <button onClick={() => onNavigate('daily_setup')} className="bg-ti9-panel hover:bg-ti9-accent hover:text-ti9-dark transition p-4 rounded-xl border border-ti9-accent/30 text-left relative">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold">{t.dailyMode}</div>
          <div className="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">NEW</div>
        </button>
      </div>

      {/* Схематичная карта */}
      <div className="px-4 mb-8">
        <div className="w-full h-32 bg-ti9-panel rounded-xl border border-ti9-accent/20 relative overflow-hidden flex items-center justify-center">
          {/* Абстрактная карта (замена Доты) */}
          <div className="absolute w-20 h-20 bg-green-900/40 rounded-full blur-xl top-2 left-4"></div>
          <div className="absolute w-20 h-20 bg-red-900/40 rounded-full blur-xl bottom-2 right-4"></div>
          <div className="absolute w-full h-1 bg-blue-500/20 rotate-45 transform origin-center"></div>
          <span className="relative z-10 text-sm font-bold text-white/50 tracking-widest">THE BATTLEFIELD</span>
        </div>
      </div>

      {/* Статистика сообщества */}
      <div className="grid grid-cols-3 gap-2 px-4 text-center mb-8">
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">520</div>
          <div className="text-xs opacity-70">{lang === 'ru' ? 'Игроков' : 'Players'}</div>
        </div>
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">104</div>
          <div className="text-xs opacity-70">{lang === 'ru' ? 'Команд' : 'Teams'}</div>
        </div>
        <div className="bg-ti9-panel p-3 rounded-lg border border-ti9-accent/10">
          <div className="text-ti9-teal font-bold text-lg">1,420</div>
          <div className="text-xs opacity-70">{lang === 'ru' ? 'Стаков собрано' : 'Stacks drafted'}</div>
        </div>
      </div>

      {/* Нижнее меню */}
      <div className="mt-auto px-4 flex gap-2">
        <button onClick={() => onNavigate('profile')} className="flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-teal/30 hover:bg-ti9-teal/10 transition">👤 {t.profile}</button>
        <button onClick={() => onNavigate('database')} className="flex-1 bg-ti9-panel py-3 rounded-lg font-bold border border-ti9-accent/30 hover:bg-ti9-accent/10 transition">📚 {t.database}</button>
      </div>

      {/* Подвал */}
      <div className="text-center text-xs opacity-50 mt-6 px-4">
        {t.footer}
      </div>
    </div>
  );
}
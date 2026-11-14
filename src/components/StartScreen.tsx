export default function StartScreen({ onSelectMode }: { onSelectMode: (mode: 'normal' | 'memory') => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-amber-400">Выберите режим</h2>
        <p className="text-slate-400">Как вы хотите собрать свою команду мечты?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <button
          onClick={() => onSelectMode('normal')}
          className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-amber-500 rounded-xl p-6 text-left transition-all group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚖️</div>
          <h3 className="text-xl font-bold text-white mb-2">Обычная игра</h3>
          <p className="text-sm text-slate-400">
            Все рейтинги игроков видны. Доступно 3 реролла команды. Идеально для первого знакомства с игрой.
          </p>
        </button>

        <button
          onClick={() => onSelectMode('memory')}
          className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-purple-500 rounded-xl p-6 text-left transition-all group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
          <h3 className="text-xl font-bold text-white mb-2">Игра по памяти</h3>
          <p className="text-sm text-slate-400">
            Рейтинги скрыты (отображаются как «?»). Доступен только 1 реролл. Проверьте, насколько хорошо вы помните составы TI.
          </p>
        </button>
      </div>
    </div>
  );
}
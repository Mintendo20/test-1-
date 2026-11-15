import React, { useEffect, useState } from 'react';
import { Clock, FolderPlus, Pause, Play, Plus, Shield, Sparkles, Square } from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import {
  compute24hDistribution,
  computeProjectProfitability,
  formatDurationHms,
  formatMinutesHuman,
  getElapsedTimerMs,
} from '../domain/timeEngine';
import { formatMoney } from '../domain/financeMath';

export function TimeTrackerView() {
  const {
    state,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    addManualTimeEntry,
    addTimeCategory,
    setDigitalHygieneMode,
  } = useLifeOS();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedCatId, setSelectedCatId] = useState(() => state.timeCategories[0]?.id ?? 'cat_work');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [timerNote, setTimerNote] = useState('');

  // Manual entry state
  const [manualMins, setManualMins] = useState('45');
  const [manualCatId, setManualCatId] = useState(() => state.timeCategories[1]?.id ?? state.timeCategories[0]?.id ?? 'cat_learn');
  const [manualProjId, setManualProjId] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Custom category state
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatIsRest, setNewCatIsRest] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<'today' | 'all'>('today');

  useEffect(() => {
    if (state.activeTimer.status !== 'running') return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.activeTimer.status]);

  const elapsedMs = getElapsedTimerMs(state.activeTimer, nowMs);
  const todayIso = new Date().toISOString().slice(0, 10);
  const dist24h = compute24hDistribution(
    state.timeEntries,
    state.timeCategories,
    periodFilter === 'today' ? todayIso : undefined,
  );
  const profitability = computeProjectProfitability(state.projects, state.timeEntries);

  const handleStartTimer = () => {
    startTimer({
      categoryId: selectedCatId,
      projectId: selectedProjectId || null,
      note: timerNote.trim() || 'Робоча сесія',
    });
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(manualMins);
    if (!Number.isFinite(mins) || mins <= 0) return;
    addManualTimeEntry({
      categoryId: manualCatId,
      projectId: manualProjId || null,
      minutes: mins,
      date: manualDate,
      note: manualNote.trim() || 'Додано заднім числом',
    });
    setManualNote('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addTimeCategory(newCatName.trim(), newCatParent || null, '#0D9488', newCatIsRest);
    setNewCatName('');
    setShowCatForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Час та продуктивність
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Повний облік 24 годин, стійкий таймер і прибутковість проєктів за годину
          </p>
        </div>

        {/* Focus / Relax Mode quick toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('normal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              state.digitalHygiene.mode === 'normal'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Звичайний
          </button>
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('focus', 45)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg ${
              state.digitalHygiene.mode === 'focus'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Focus Mode
          </button>
          <button
            type="button"
            onClick={() => setDigitalHygieneMode('relax')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg ${
              state.digitalHygiene.mode === 'relax'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Relax Mode
          </button>
        </div>
      </div>

      {/* Timer Control Card + Manual Retroactive Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Активний таймер</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Стан зберігається локально
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
            <div
              data-testid="time-page-timer-display"
              className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50"
            >
              {formatDurationHms(elapsedMs)}
            </div>

            <div className="flex items-center gap-2">
              {state.activeTimer.status === 'idle' && (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold min-h-[44px]"
                >
                  <Play className="w-4 h-4" />
                  Запустити
                </button>
              )}
              {state.activeTimer.status === 'running' && (
                <>
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold min-h-[44px]"
                  >
                    <Pause className="w-4 h-4" />
                    Пауза
                  </button>
                  <button
                    type="button"
                    onClick={finishTimer}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold min-h-[44px]"
                  >
                    <Square className="w-4 h-4" />
                    Завершити
                  </button>
                </>
              )}
              {state.activeTimer.status === 'paused' && (
                <>
                  <button
                    type="button"
                    onClick={resumeTimer}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold min-h-[44px]"
                  >
                    <Play className="w-4 h-4" />
                    Продовжити
                  </button>
                  <button
                    type="button"
                    onClick={finishTimer}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold min-h-[44px]"
                  >
                    <Square className="w-4 h-4" />
                    Завершити
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tm-cat" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Категорія / підкатегорія
              </label>
              <select
                id="tm-cat"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                disabled={state.activeTimer.status !== 'idle'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                {state.timeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `↳ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tm-proj" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Прив’язка до проєкту
              </label>
              <select
                id="tm-proj"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={state.activeTimer.status !== 'idle'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">Без проєкту</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tm-note" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Коментар сесії
              </label>
              <input
                id="tm-note"
                type="text"
                value={timerNote}
                onChange={(e) => setTimerNote(e.target.value)}
                disabled={state.activeTimer.status !== 'idle'}
                placeholder="Над чим працюєте?"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </section>

        {/* Manual / Retroactive Time Entry */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Додати час заднім числом
            </h3>
            <button
              type="button"
              onClick={() => setShowCatForm((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Нова категорія
            </button>
          </div>

          {showCatForm && (
            <form
              onSubmit={handleCreateCategory}
              className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5"
            >
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Назва категорії (напр., YouTube монтаж)"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <select
                value={newCatParent}
                onChange={(e) => setNewCatParent(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <option value="">Коренева категорія</option>
                {state.timeCategories
                  .filter((c) => !c.parentId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Підкатегорія для: {c.name}
                    </option>
                  ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newCatIsRest}
                  onChange={(e) => setNewCatIsRest(e.target.checked)}
                />
                Категорія відпочинку або сну (не знижує індекс)
              </label>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
              >
                Створити категорію
              </button>
            </form>
          )}

          <form onSubmit={handleManualAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="man-cat" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Категорія
                </label>
                <select
                  id="man-cat"
                  value={manualCatId}
                  onChange={(e) => setManualCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {state.timeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="man-mins" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Тривалість (хв)
                </label>
                <input
                  id="man-mins"
                  type="number"
                  min="1"
                  required
                  value={manualMins}
                  onChange={(e) => setManualMins(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="man-date" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Дата
                </label>
                <input
                  id="man-date"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label htmlFor="man-proj" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Проєкт
                </label>
                <select
                  id="man-proj"
                  value={manualProjId}
                  onChange={(e) => setManualProjId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Без проєкту</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="man-note" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Опис
              </label>
              <input
                id="man-note"
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Що саме виконувалось?"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Зберегти запис часу
            </button>
          </form>
        </section>
      </div>

      {/* 24-Hour Distribution + Project Hourly Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Розподіл 24 годин
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Обліковано: {formatMinutesHuman(dist24h.totalTrackedMinutes)} · Необліковано: {formatMinutesHuman(dist24h.untrackedMinutes)}
              </p>
            </div>
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-2.5 py-1 text-xs rounded-md ${
                  periodFilter === 'today' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-500'
                }`}
              >
                Сьогодні
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-md ${
                  periodFilter === 'all' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-500'
                }`}
              >
                Увесь час
              </button>
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {dist24h.items.map((item) => (
              <div
                key={item.categoryId}
                title={`${item.name}: ${formatMinutesHuman(item.minutes)}`}
                style={{ width: `${Math.max(2, item.percentageOfDay)}%`, backgroundColor: item.color }}
              />
            ))}
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {dist24h.items.map((item) => (
              <li key={item.categoryId} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                  {item.isRestOrSleep && (
                    <span className="text-xs text-slate-400">· відновлення</span>
                  )}
                </div>
                <span className="font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                  {formatMinutesHuman(item.minutes)} ({item.percentageOfDay}%)
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Profitability per hour */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Зв’язок часу та фінансів
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Окремий розрахунок за фактично отриманою оплатою та обсягом виконаної роботи
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 font-medium">Проєкт</th>
                  <th className="py-2 font-medium text-right">Годин</th>
                  <th className="py-2 font-medium text-right">Отримано/год</th>
                  <th className="py-2 font-medium text-right">Зароблено/год</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {profitability.map((row) => (
                  <tr key={row.projectId}>
                    <td className="py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{row.projectName}</div>
                      <div className="text-slate-500">{row.client}</div>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {row.trackedHours} год
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-teal-600 dark:text-teal-400 font-semibold">
                      {formatMoney(row.hourlyReceivedMinor, row.currency, state.currencies)}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoney(row.hourlyEarnedMinor, row.currency, state.currencies)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Time Entries */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Останні записи часу
            </h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {state.timeEntries.slice(0, 6).map((e) => {
                const cat = state.timeCategories.find((c) => c.id === e.categoryId);
                return (
                  <li key={e.id} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {cat?.name ?? 'Категорія'}
                      </span>
                      <span className="text-slate-500"> · {e.note}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                      {formatMinutesHuman(Math.round(e.durationMs / 60000))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  Play,
  Plus,
  Sparkles,
  Square,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import {
  calculateDevelopmentIndex,
  calculateGoalProgressPct,
  calculateLevelFromXp,
} from '../domain/kaizenEngine';
import {
  calculatePeriodCashflowMinor,
  calculateTotalNetWorthMinor,
  formatMoney,
} from '../domain/financeMath';
import { formatDurationHms, getElapsedTimerMs } from '../domain/timeEngine';
import { generateLocalInsights } from '../domain/localAiCoach';
import { KAIZEN_DIRECTIONS, type KaizenDirectionId, type PriorityLevel } from '../domain/types';

interface DashboardViewProps {
  onNavigateTab: (tab: 'home' | 'goals' | 'time' | 'finance' | 'profile') => void;
  onOpenAiCoach: () => void;
  onOpenLifeWorld: () => void;
}

export function DashboardView({
  onNavigateTab,
  onOpenAiCoach,
  onOpenLifeWorld,
}: DashboardViewProps) {
  const {
    state,
    completeTask,
    reopenTask,
    addTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resolveAiProposal,
  } = useLifeOS();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDir, setQuickTaskDir] = useState<KaizenDirectionId>('finance_career');
  const [quickTaskPriority, setQuickTaskPriority] = useState<PriorityLevel>('medium');
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);

  useEffect(() => {
    if (state.activeTimer.status !== 'running') return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.activeTimer.status]);

  const devIndex = calculateDevelopmentIndex(state);
  const netWorthMinor = calculateTotalNetWorthMinor(
    state.accounts,
    state.transactions,
    state.settings.baseCurrency,
    state.exchangeRates,
  );
  const cashflow = calculatePeriodCashflowMinor(state.transactions);
  const levelInfo = calculateLevelFromXp(state.character.xp);
  const localInsights = generateLocalInsights(state);

  const today = new Date().toISOString().slice(0, 10);
  const pendingTasks = state.tasks.filter((t) => t.status !== 'completed');
  const completedTasks = state.tasks.filter((t) => t.status === 'completed');
  const activeGoals = state.goals.filter((g) => g.status === 'active').slice(0, 3);
  const elapsedMs = getElapsedTimerMs(state.activeTimer, nowMs);

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      description: '',
      direction: quickTaskDir,
      priority: quickTaskPriority,
      estimatedMinutes: 30,
      scheduledDate: today,
    });
    setQuickTaskTitle('');
    setShowQuickTaskForm(false);
  };

  const priorityLabel = (p: PriorityLevel) =>
    p === 'high' ? 'Високий' : p === 'medium' ? 'Середній' : 'Низький';

  return (
    <div className="space-y-6">
      {/* Top Hero Row: Integral Development Index + Quick Actions + Active Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Development Index Card */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Інтегральний прогрес Kaizen
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 text-balance">
                Вітаємо, {state.settings.userName}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Індекс розвитку поєднує результати цілей, важливі дії, регулярність та баланс без штрафів за відпочинок.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                {devIndex.overallScore}
                <span className="text-base font-normal text-slate-400">/100</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Індекс розвитку</p>
            </div>
          </div>

          {/* 6 Kaizen Directions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            {devIndex.directionScores.map((ds) => (
              <div key={ds.direction} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {ds.shortTitle}
                  </span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
                    {ds.score}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${ds.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Active Timer + Life World + Quick Finance */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Timer Widget */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Таймер фокусу та обліку часу</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('time')}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0"
              >
                Усі категорії
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div
                  data-testid="dashboard-timer-display"
                  className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50"
                >
                  {formatDurationHms(elapsedMs)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {state.activeTimer.status === 'idle'
                    ? 'Готовий до запуску · Проєкт або завдання'
                    : state.activeTimer.note || 'Активна сесія'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {state.activeTimer.status === 'idle' && (
                  <button
                    type="button"
                    onClick={() =>
                      startTimer({
                        categoryId: state.timeCategories[0]?.id ?? 'cat_work',
                        taskId: pendingTasks[0]?.id ?? null,
                        note: pendingTasks[0]?.title ?? 'Фокусна робота',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap min-h-[44px]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Старт
                  </button>
                )}
                {state.activeTimer.status === 'running' && (
                  <>
                    <button
                      type="button"
                      onClick={pauseTimer}
                      aria-label="Пауза таймера"
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={finishTimer}
                      aria-label="Завершити таймер"
                      className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Завершити
                    </button>
                  </>
                )}
                {state.activeTimer.status === 'paused' && (
                  <>
                    <button
                      type="button"
                      onClick={resumeTimer}
                      className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Далі
                    </button>
                    <button
                      type="button"
                      onClick={finishTimer}
                      className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Зберегти
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Compact Finance & Island Snapshot Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <button
              type="button"
              onClick={() => onNavigateTab('finance')}
              className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-teal-500/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Загальний баланс</span>
                <Wallet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 whitespace-nowrap">
                  {formatMoney(netWorthMinor, state.settings.baseCurrency, state.currencies)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums whitespace-nowrap truncate">
                  Результат: {cashflow.netMinor >= 0 ? '+' : ''}
                  {formatMoney(cashflow.netMinor, state.settings.baseCurrency, state.currencies)}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenLifeWorld}
              className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-teal-500/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Ігровий світ · Рівень {levelInfo.level}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Острів {state.character.name}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                  {state.character.xp} XP · {state.gameCurrency.coins} монет · {state.gameCurrency.crystals} крист.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split: Today's Tasks + Goals & AI Coach Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks & Priorities */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Завдання на сьогодні
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingTasks.length} в роботі · {completedTasks.length} виконано
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickTaskForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 whitespace-nowrap min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Додати завдання
            </button>
          </div>

          {showQuickTaskForm && (
            <form
              onSubmit={handleCreateQuickTask}
              className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div>
                <label htmlFor="dash-task-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Назва дії
                </label>
                <input
                  id="dash-task-title"
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Наприклад: Підготувати презентацію для клієнта"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dash-task-dir" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Напрямок Kaizen
                  </label>
                  <select
                    id="dash-task-dir"
                    value={quickTaskDir}
                    onChange={(e) => setQuickTaskDir(e.target.value as KaizenDirectionId)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {KAIZEN_DIRECTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dash-task-prio" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Пріоритет
                  </label>
                  <select
                    id="dash-task-prio"
                    value={quickTaskPriority}
                    onChange={(e) => setQuickTaskPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="high">Високий</option>
                    <option value="medium">Середній</option>
                    <option value="low">Низький</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickTaskForm(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
                >
                  Зберегти завдання
                </button>
              </div>
            </form>
          )}

          {state.tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Список завдань порожній. Додайте першу дію для сьогоднішнього прогресу.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingTasks.map((task) => {
                const dirTitle = KAIZEN_DIRECTIONS.find((d) => d.id === task.direction)?.shortTitle ?? '';
                return (
                  <li key={task.id} className="py-3.5 flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => completeTask(task.id)}
                      aria-label={`Виконати завдання ${task.title}`}
                      className="mt-0.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0 min-w-[24px] min-h-[24px]"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span
                          className={
                            task.priority === 'high'
                              ? 'font-semibold text-amber-700 dark:text-amber-400'
                              : ''
                          }
                        >
                          Пріоритет: {priorityLabel(task.priority)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{dirTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.estimatedMinutes} хв</span>
                      </div>
                    </div>
                  </li>
                );
              })}

              {completedTasks.slice(0, 3).map((task) => (
                <li key={task.id} className="py-3 flex items-start gap-3 opacity-70">
                  <button
                    type="button"
                    onClick={() => reopenTask(task.id)}
                    aria-label={`Повернути завдання ${task.title}`}
                    className="mt-0.5 text-teal-600 dark:text-teal-400 shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-through">
                      {task.title}
                    </p>
                    {task.resultNote && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        Результат: {task.resultNote}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right Column: Goal Progress + AI Coach Insights */}
        <div className="lg:col-span-5 space-y-5">
          {/* AI Coach Recommendations */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Рекомендації AI-коуча
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenAiCoach}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Відкрити AI-коуча
              </button>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              {localInsights.insights.map((ins, i) => (
                <li key={i} className="leading-relaxed">
                  {ins}
                </li>
              ))}
            </ul>

            {state.aiProposals.filter((p) => p.status === 'pending').slice(0, 1).map((prop) => (
              <div
                key={prop.id}
                className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Пропозиція: {prop.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{prop.reason}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => resolveAiProposal(prop.id, true)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
                  >
                    {prop.requiresConfirmation ? 'Підтвердити зміну' : 'Застосувати'}
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveAiProposal(prop.id, false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Active Goals Snapshot */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Прогрес ключових цілей
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Усі цілі
              </button>
            </div>
            <div className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="py-5 text-center space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Поки що немає активних цілей. Створіть першу ціль Kaizen, щоб бачити прогрес.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('goals')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Створити першу ціль
                  </button>
                </div>
              ) : (
                activeGoals.map((goal) => {
                  const pct = calculateGoalProgressPct(goal);
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {goal.title}
                        </span>
                        <span className="font-mono tabular-nums text-xs font-semibold text-teal-600 dark:text-teal-400 shrink-0">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 dark:bg-teal-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        <span>
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        <span>до {goal.deadline}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

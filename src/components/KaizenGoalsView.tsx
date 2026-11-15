import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import {
  calculateGoalProgressPct,
  generateWeeklyKaizenReview,
} from '../domain/kaizenEngine';
import { formatMoney } from '../domain/financeMath';
import {
  KAIZEN_DIRECTIONS,
  type GoalHorizon,
  type KaizenDirectionId,
  type PriorityLevel,
} from '../domain/types';

export function KaizenGoalsView() {
  const {
    state,
    addGoal,
    updateGoalProgress,
    toggleGoalMilestone,
    deleteGoal,
    addTask,
    completeTask,
    reopenTask,
    moveTaskOrder,
    deleteTask,
  } = useLifeOS();

  const [subTab, setSubTab] = useState<'goals' | 'planner' | 'review'>('goals');
  const [dirFilter, setDirFilter] = useState<KaizenDirectionId | 'all'>('all');

  // New Goal Form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gDir, setGDir] = useState<KaizenDirectionId>('finance_career');
  const [gHorizon, setGHorizon] = useState<GoalHorizon>('weekly');
  const [gPriority, setGPriority] = useState<PriorityLevel>('high');
  const [gTarget, setGTarget] = useState('100');
  const [gUnit, setGUnit] = useState('%');
  const [gDeadline, setGDeadline] = useState('2026-12-31');
  const [gParentId, setGParentId] = useState<string>('');

  // Task completion with result note
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [resultNoteInput, setResultNoteInput] = useState('');

  // New Task Form
  const [tTitle, setTTitle] = useState('');
  const [tGoalId, setTGoalId] = useState<string>('');
  const [tDir, setTDir] = useState<KaizenDirectionId>('finance_career');
  const [tPriority, setTPriority] = useState<PriorityLevel>('medium');
  const [tMins, setTMins] = useState('45');

  const filteredGoals = state.goals.filter(
    (g) => dirFilter === 'all' || g.direction === dirFilter,
  );

  const weeklyReview = generateWeeklyKaizenReview(state);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim()) return;
    addGoal({
      title: gTitle.trim(),
      description: gDesc.trim(),
      direction: gDir,
      horizon: gHorizon,
      priority: gPriority,
      deadline: gDeadline,
      targetValue: Number(gTarget) || 100,
      unit: gUnit.trim() || '%',
      parentGoalId: gParentId || null,
    });
    setGTitle('');
    setGDesc('');
    setShowGoalForm(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    addTask({
      title: tTitle.trim(),
      description: '',
      direction: tDir,
      goalId: tGoalId || null,
      priority: tPriority,
      estimatedMinutes: Math.max(5, Number(tMins) || 30),
      scheduledDate: new Date().toISOString().slice(0, 10),
    });
    setTTitle('');
  };

  const horizonLabel = (h: GoalHorizon) =>
    h === 'long' ? 'Довгострокова' : h === 'medium' ? 'Середньострокова' : 'Тижнева';

  return (
    <div className="space-y-6">
      {/* Header + Segmented View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Kaizen: Цілі та планування
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Довгострокова ціль → Середньострокова → Тижнева → Щоденна дія → Реальний результат
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setSubTab('goals')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              subTab === 'goals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Ієрархія цілей
          </button>
          <button
            type="button"
            onClick={() => setSubTab('planner')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              subTab === 'planner'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Денний план
          </button>
          <button
            type="button"
            onClick={() => setSubTab('review')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              subTab === 'review'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Kaizen Review
          </button>
        </div>
      </div>

      {subTab === 'goals' && (
        <div className="space-y-5">
          {/* Direction Filter + Create Goal Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDirFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  dirFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                Усі напрямки
              </button>
              {KAIZEN_DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirFilter(d.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dirFilter === d.id
                      ? 'bg-teal-600 text-white border-transparent'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {d.shortTitle}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowGoalForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold whitespace-nowrap min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Нова ціль
            </button>
          </div>

          {showGoalForm && (
            <form
              onSubmit={handleAddGoal}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Створити ціль Kaizen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="goal-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Назва цілі
                  </label>
                  <input
                    id="goal-title"
                    type="text"
                    required
                    value={gTitle}
                    onChange={(e) => setGTitle(e.target.value)}
                    placeholder="Наприклад: Запустити власний цифровий продукт"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="goal-parent" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Батьківська ціль (необов’язково)
                  </label>
                  <select
                    id="goal-parent"
                    value={gParentId}
                    onChange={(e) => setGParentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Без прив’язки (коренева ціль)</option>
                    {state.goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="goal-dir" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Напрямок
                  </label>
                  <select
                    id="goal-dir"
                    value={gDir}
                    onChange={(e) => setGDir(e.target.value as KaizenDirectionId)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {KAIZEN_DIRECTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="goal-horizon" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Горизонт
                    </label>
                    <select
                      id="goal-horizon"
                      value={gHorizon}
                      onChange={(e) => setGHorizon(e.target.value as GoalHorizon)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="long">Довгострокова</option>
                      <option value="medium">Середньострокова</option>
                      <option value="weekly">Тижнева</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="goal-prio" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Пріоритет
                    </label>
                    <select
                      id="goal-prio"
                      value={gPriority}
                      onChange={(e) => setGPriority(e.target.value as PriorityLevel)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="high">Високий</option>
                      <option value="medium">Середній</option>
                      <option value="low">Низький</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="goal-target" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Цільове знач.
                    </label>
                    <input
                      id="goal-target"
                      type="number"
                      min="1"
                      value={gTarget}
                      onChange={(e) => setGTarget(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-unit" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Одиниця
                    </label>
                    <input
                      id="goal-unit"
                      type="text"
                      value={gUnit}
                      onChange={(e) => setGUnit(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-deadline" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Дедлайн
                    </label>
                    <input
                      id="goal-deadline"
                      type="date"
                      value={gDeadline}
                      onChange={(e) => setGDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="goal-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Опис і критерій вимірювання
                  </label>
                  <input
                    id="goal-desc"
                    type="text"
                    value={gDesc}
                    onChange={(e) => setGDesc(e.target.value)}
                    placeholder="Чому це важливо та який результат очікується"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
                >
                  Створити ціль
                </button>
              </div>
            </form>
          )}

          {/* Goals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const pct = calculateGoalProgressPct(goal);
              const dirTitle = KAIZEN_DIRECTIONS.find((d) => d.id === goal.direction)?.shortTitle ?? '';
              const parentGoal = goal.parentGoalId
                ? state.goals.find((p) => p.id === goal.parentGoalId)
                : null;
              return (
                <article
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{horizonLabel(goal.horizon)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{dirTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span>Дедлайн {goal.deadline}</span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50 mt-1">
                          {goal.title}
                        </h4>
                        {parentGoal && (
                          <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                            Підціль для: {parentGoal.title}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id)}
                        aria-label={`Видалити ціль ${goal.title}`}
                        className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {goal.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}

                    {goal.milestones.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {goal.milestones.map((ms) => (
                          <li key={ms.id}>
                            <button
                              type="button"
                              onClick={() => toggleGoalMilestone(goal.id, ms.id)}
                              className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-600"
                            >
                              {ms.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className={ms.completed ? 'line-through opacity-65' : ''}>
                                {ms.title}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-600 dark:text-slate-400">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Оновити прогрес:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateGoalProgress(
                              goal.id,
                              Math.min(
                                goal.targetValue,
                                Number((goal.currentValue + Math.max(1, Math.round(goal.targetValue * 0.1))).toFixed(1)),
                              ),
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          +10% кроку
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Гнучка послідовність завдань на день
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              Змінюйте порядок протягом дня без жорсткого погодинного примусу та фіксуйте реальний результат.
            </p>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.tasks.map((task, idx) => {
                const linkedGoal = task.goalId ? state.goals.find((g) => g.id === task.goalId) : null;
                return (
                  <li key={task.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (task.status === 'completed') reopenTask(task.id);
                            else {
                              setCompletingTaskId(task.id);
                              setResultNoteInput('');
                            }
                          }}
                          aria-label={
                            task.status === 'completed'
                              ? `Відновити ${task.title}`
                              : `Завершити ${task.title}`
                          }
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-teal-600"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              task.status === 'completed'
                                ? 'line-through text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{task.priority === 'high' ? 'Високий' : task.priority === 'medium' ? 'Середній' : 'Низький'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">План {task.estimatedMinutes} хв / Факт {task.actualMinutes} хв</span>
                            {linkedGoal && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-teal-600 dark:text-teal-400 truncate max-w-[220px]">
                                  {linkedGoal.title}
                                </span>
                              </>
                            )}
                          </div>
                          {task.resultNote && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                              Результат: {task.resultNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveTaskOrder(task.id, -1)}
                          aria-label={`Підняти ${task.title}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === state.tasks.length - 1}
                          onClick={() => moveTaskOrder(task.id, 1)}
                          aria-label={`Опустити ${task.title}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          aria-label={`Видалити завдання ${task.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {completingTaskId === task.id && (
                      <div className="ml-8 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={resultNoteInput}
                          onChange={(e) => setResultNoteInput(e.target.value)}
                          placeholder="Який реальний результат досягнуто? (необов’язково)"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              completeTask(task.id, resultNoteInput);
                              setCompletingTaskId(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                          >
                            Підтвердити (+XP)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletingTaskId(null)}
                            className="px-2.5 py-1.5 text-xs text-slate-500"
                          >
                            Скасувати
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Add Task Form */}
          <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 h-fit">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-3">
              Нова щоденна дія
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label htmlFor="plan-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Завдання
                </label>
                <input
                  id="plan-title"
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="Наприклад: Завершити модуль тестування"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="plan-goal" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Пов’язана ціль
                </label>
                <select
                  id="plan-goal"
                  value={tGoalId}
                  onChange={(e) => setTGoalId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Без цілі</option>
                  {state.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="plan-dir" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Напрямок
                </label>
                <select
                  id="plan-dir"
                  value={tDir}
                  onChange={(e) => setTDir(e.target.value as KaizenDirectionId)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {KAIZEN_DIRECTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plan-prio" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Пріоритет
                  </label>
                  <select
                    id="plan-prio"
                    value={tPriority}
                    onChange={(e) => setTPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="high">Високий</option>
                    <option value="medium">Середній</option>
                    <option value="low">Низький</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-mins" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Хвилин
                  </label>
                  <input
                    id="plan-mins"
                    type="number"
                    min="5"
                    value={tMins}
                    onChange={(e) => setTMins(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold min-h-[44px]"
              >
                Додати до плану
              </button>
            </form>
          </section>
        </div>
      )}

      {subTab === 'review' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Щотижневий Kaizen Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Системний звіт досягнень, перешкод, часу та фінансових результатів
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Виконано завдань</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {weeklyReview.completedTasksCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Незавершено</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {weeklyReview.unfinishedTasksCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Зафіксовано годин</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {weeklyReview.trackedHours} год
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Чистий фін. результат</p>
              <p className="text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1">
                {formatMoney(weeklyReview.financialNetMinor, state.settings.baseCurrency, state.currencies)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Головні досягнення тижня
              </h4>
              {weeklyReview.topWins.length === 0 ? (
                <p className="text-xs text-slate-500">Завершіть завдання з результатом, щоб сформувати список перемог.</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {weeklyReview.topWins.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Перешкоди та фокус на наступний тиждень
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                {weeklyReview.biggestObstacles.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
                {weeklyReview.recommendations.map((r, i) => (
                  <li key={`rec_${i}`} className="text-teal-700 dark:text-teal-400 font-medium">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

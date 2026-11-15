import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  Account,
  AIInteraction,
  AIMemoryItem,
  AIProposal,
  BodyMetric,
  Budget,
  CalendarEvent,
  CharacterState,
  Debt,
  ExchangeRate,
  Goal,
  IslandObject,
  KaizenDirectionId,
  LearningCourse,
  LifeHistoryEntry,
  LifeOSState,
  PriorityLevel,
  Project,
  SavingsGoal,
  SocialContact,
  SocialEvent,
  Task,
  ThemeMode,
  TimeCategory,
  TimeEntry,
  Transaction,
  UserSettings,
  Workout,
} from '../domain/types';
import { createCleanUserState, type CleanUserSetupOptions } from '../domain/seedData';
import {
  applyDebtPayment,
  findExchangeRate,
} from '../domain/financeMath';
import {
  calculateLevelFromXp,
  computeTaskCompletionRewards,
} from '../domain/kaizenEngine';
import { getElapsedTimerMs } from '../domain/timeEngine';
import { buildMinimalAiContext } from '../domain/localAiCoach';

const STORAGE_KEY = 'personal_life_os_db_v1';

function loadInitialState(): LifeOSState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LifeOSState;
      if (parsed && parsed.version === 1 && parsed.settings) {
        return {
          ...parsed,
          settings: {
            ...parsed.settings,
            onboardingCompleted: parsed.settings.onboardingCompleted ?? true,
          },
        };
      }
    }
  } catch {
    // ignore corrupted local storage and fall back to clean state
  }
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  return createCleanUserState({
    userName: autostart ? 'Користувач' : '',
    onboardingCompleted: autostart,
  });
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

interface LifeOSContextValue {
  state: LifeOSState;
  setTheme: (theme: ThemeMode) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  addGoal: (input: {
    title: string;
    description: string;
    direction: KaizenDirectionId;
    horizon: Goal['horizon'];
    priority: PriorityLevel;
    deadline: string;
    targetValue: number;
    unit: string;
    parentGoalId?: string | null;
  }) => void;
  updateGoalProgress: (goalId: string, currentValue: number) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;
  deleteGoal: (goalId: string) => void;
  addTask: (input: {
    title: string;
    description: string;
    direction: KaizenDirectionId;
    goalId?: string | null;
    priority: PriorityLevel;
    estimatedMinutes: number;
    scheduledDate: string;
  }) => void;
  completeTask: (taskId: string, resultNote?: string, difficultyNote?: string) => void;
  reopenTask: (taskId: string) => void;
  moveTaskOrder: (taskId: string, delta: -1 | 1) => void;
  deleteTask: (taskId: string) => void;
  startTimer: (input: { categoryId: string; taskId?: string | null; projectId?: string | null; note: string }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => void;
  addManualTimeEntry: (input: {
    categoryId: string;
    note: string;
    minutes: number;
    date: string;
    projectId?: string | null;
    taskId?: string | null;
  }) => void;
  addTimeCategory: (name: string, parentId: string | null, color: string, isRestOrSleep: boolean) => void;
  addAccount: (input: { name: string; type: Account['type']; currency: string; initialBalanceMinor: number }) => void;
  addTransaction: (input: {
    type: Transaction['type'];
    amountMinor: number;
    currency: string;
    accountId: string;
    toAccountId?: string | null;
    category: string;
    sourceOrPayee?: string;
    projectId?: string | null;
    date: string;
    comment: string;
  }) => void;
  addExchangeRate: (fromCurrency: string, toCurrency: string, rate: number, effectiveDate: string) => void;
  addProject: (input: { name: string; client: string; currency: string; totalValueMinor: number }) => void;
  recordProjectPayment: (projectId: string, amountMinor: number, accountId: string, note: string, date: string) => void;
  updateProjectCompletion: (projectId: string, completionPct: number) => void;
  addDebt: (input: {
    title: string;
    type: Debt['type'];
    principalMinor: number;
    currency: string;
    interestRateAnnual: number;
    dueDate: string;
    monthlyPaymentMinor: number;
  }) => void;
  payDebt: (debtId: string, amountMinor: number, isEarlyRepayment: boolean, note: string) => void;
  addSavingsGoal: (input: {
    title: string;
    mode: 'simple' | 'fund';
    targetMinor: number;
    currency: string;
    deadline: string;
    regularContributionMinor: number;
  }) => void;
  contributeSavings: (savingsId: string, amountMinor: number, note: string) => void;
  addOrUpdateBudget: (category: string, limitMinor: number) => void;
  addWorkout: (input: Omit<Workout, 'id'>) => void;
  addBodyMetric: (input: Omit<BodyMetric, 'id'>) => void;
  completeLearningTopic: (courseId: string, topicId: string, quizScore: number) => void;
  addCourse: (title: string, subject: string, deadline: string, topicTitles: string[]) => void;
  addSocialContact: (input: Omit<SocialContact, 'id'>) => void;
  addSocialEvent: (input: Omit<SocialEvent, 'id'>) => void;
  addCalendarEvent: (input: Omit<CalendarEvent, 'id'>) => void;
  setDigitalHygieneMode: (mode: 'normal' | 'focus' | 'relax', focusMinutes?: number) => void;
  toggleDistractingApp: (appName: string) => void;
  addDigitalApp: (appName: string, category: 'productive' | 'neutral' | 'distracting', dailyLimitMinutes: number) => void;
  sendAiMessage: (module: 'coach' | 'tutor' | 'social' | 'finance', prompt: string) => Promise<void>;
  addAiMemory: (category: AIMemoryItem['category'], summary: string) => void;
  updateAiMemory: (id: string, summary: string) => void;
  deleteAiMemory: (id: string) => void;
  resolveAiProposal: (proposalId: string, accept: boolean) => void;
  unlockAndPlaceIslandObject: (objectId: string, gridX: number, gridY: number) => boolean;
  moveIslandObject: (objectId: string, gridX: number, gridY: number) => void;
  unlockTerritory: (territoryId: string) => boolean;
  updateCharacterAppearance: (patch: Partial<Pick<CharacterState, 'name' | 'skinTone' | 'hairStyle' | 'hairColor' | 'outfit' | 'outfitColor'>>) => void;
  restoreFullState: (newState: LifeOSState) => void;
  completeOnboarding: (options: CleanUserSetupOptions) => void;
  recordBackupEvent: (encrypted: boolean, sha256: string, sizeBytes: number) => void;
  deleteCategoryData: (category: 'tasks' | 'finances' | 'time' | 'ai' | 'history' | 'all') => void;
}

const LifeOSContext = createContext<LifeOSContextValue | null>(null);

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LifeOSState>(() => loadInitialState());

  // Persist every change Local-First into localStorage once onboarding is completed
  useEffect(() => {
    if (state.settings.onboardingCompleted === false) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage quota warning ignored safely
    }
  }, [state]);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      if (dark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    if (state.settings.theme === 'dark') {
      apply(true);
    } else if (state.settings.theme === 'light') {
      apply(false);
    } else {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mql.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [state.settings.theme]);

  const appendHistory = (
    prev: LifeOSState,
    category: LifeHistoryEntry['category'],
    title: string,
    detail: string,
  ): LifeHistoryEntry[] => {
    if (!prev.settings.historyRetention[category]) return prev.lifeHistory;
    const entry: LifeHistoryEntry = {
      id: uid('lh'),
      category,
      title,
      detail,
      timestamp: new Date().toISOString(),
    };
    return [entry, ...prev.lifeHistory].slice(0, 300);
  };

  const awardXpAndCurrency = (
    prev: LifeOSState,
    xpDelta: number,
    coinsDelta: number,
    crystalsDelta: number,
    statKey: keyof CharacterState['stats'],
    statDelta: number,
  ): Pick<LifeOSState, 'character' | 'gameCurrency'> => {
    const newXp = prev.character.xp + xpDelta;
    const lvlInfo = calculateLevelFromXp(newXp);
    return {
      character: {
        ...prev.character,
        xp: newXp,
        level: lvlInfo.level,
        stats: {
          ...prev.character.stats,
          [statKey]: Math.min(100, prev.character.stats[statKey] + statDelta),
        },
      },
      gameCurrency: {
        coins: prev.gameCurrency.coins + coinsDelta,
        crystals: prev.gameCurrency.crystals + crystalsDelta,
      },
    };
  };

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const addGoal = useCallback(
    (input: {
      title: string;
      description: string;
      direction: KaizenDirectionId;
      horizon: Goal['horizon'];
      priority: PriorityLevel;
      deadline: string;
      targetValue: number;
      unit: string;
      parentGoalId?: string | null;
    }) => {
      const now = new Date().toISOString();
      const newGoal: Goal = {
        id: uid('g'),
        parentGoalId: input.parentGoalId ?? null,
        title: input.title,
        description: input.description,
        direction: input.direction,
        horizon: input.horizon,
        priority: input.priority,
        createdAt: now,
        updatedAt: now,
        deadline: input.deadline,
        initialValue: 0,
        targetValue: Math.max(1, input.targetValue),
        currentValue: 0,
        unit: input.unit || '%',
        status: 'active',
        milestones: [],
      };
      setState((prev) => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
        lifeHistory: appendHistory(prev, 'goals', 'Створено нову ціль', newGoal.title),
      }));
    },
    [],
  );

  const updateGoalProgress = useCallback((goalId: string, currentValue: number) => {
    setState((prev) => {
      const goals = prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const clamped = Math.max(0, currentValue);
        const completed = clamped >= g.targetValue;
        return {
          ...g,
          currentValue: clamped,
          status: completed ? ('completed' as const) : ('active' as const),
          updatedAt: new Date().toISOString(),
        };
      });
      const target = goals.find((g) => g.id === goalId);
      const reward =
        target?.status === 'completed'
          ? awardXpAndCurrency(prev, 60, 40, 1, 'career', 3)
          : { character: prev.character, gameCurrency: prev.gameCurrency };
      return {
        ...prev,
        ...reward,
        goals,
        lifeHistory: target
          ? appendHistory(prev, 'goals', 'Оновлено прогрес цілі', `${target.title}: ${target.currentValue}/${target.targetValue} ${target.unit}`)
          : prev.lifeHistory,
      };
    });
  }, []);

  const toggleGoalMilestone = useCallback((goalId: string, milestoneId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m,
              ),
              updatedAt: new Date().toISOString(),
            }
          : g,
      ),
    }));
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  }, []);

  const addTask = useCallback(
    (input: {
      title: string;
      description: string;
      direction: KaizenDirectionId;
      goalId?: string | null;
      priority: PriorityLevel;
      estimatedMinutes: number;
      scheduledDate: string;
    }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const newTask: Task = {
          id: uid('t'),
          goalId: input.goalId ?? null,
          direction: input.direction,
          title: input.title,
          description: input.description,
          priority: input.priority,
          estimatedMinutes: input.estimatedMinutes,
          actualMinutes: 0,
          scheduledDate: input.scheduledDate,
          deadline: input.scheduledDate,
          status: 'pending',
          orderIndex: prev.tasks.length,
          createdAt: now,
          updatedAt: now,
        };
        const calEvent: CalendarEvent = {
          id: uid('ce'),
          title: newTask.title,
          category: 'task',
          date: newTask.scheduledDate,
          startTime: '10:00',
          endTime: '11:00',
          linkedTaskId: newTask.id,
          linkedGoalId: newTask.goalId,
        };
        return {
          ...prev,
          tasks: [newTask, ...prev.tasks],
          calendarEvents: [calEvent, ...prev.calendarEvents],
          lifeHistory: appendHistory(prev, 'tasks', 'Додано завдання', newTask.title),
        };
      });
    },
    [],
  );

  const completeTask = useCallback((taskId: string, resultNote?: string, difficultyNote?: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || task.status === 'completed') return prev;
      const updatedTask: Task = {
        ...task,
        status: 'completed',
        resultNote: resultNote?.trim() || task.resultNote || 'Виконано',
        difficultyNote: difficultyNote?.trim() || task.difficultyNote,
        updatedAt: new Date().toISOString(),
      };
      const reward = computeTaskCompletionRewards(updatedTask, prev.character.stats);
      const gameUpdates = awardXpAndCurrency(
        prev,
        reward.xpDelta,
        reward.coinsDelta,
        reward.crystalsDelta,
        reward.statKey,
        reward.statDelta,
      );
      return {
        ...prev,
        ...gameUpdates,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        lifeHistory: appendHistory(
          prev,
          'tasks',
          'Виконано завдання (+' + reward.xpDelta + ' XP)',
          `${updatedTask.title}${updatedTask.resultNote ? ' · ' + updatedTask.resultNote : ''}`,
        ),
      };
    });
  }, []);

  const reopenTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'pending', updatedAt: new Date().toISOString() } : t,
      ),
    }));
  }, []);

  const moveTaskOrder = useCallback((taskId: string, delta: -1 | 1) => {
    setState((prev) => {
      const idx = prev.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return prev;
      const targetIdx = idx + delta;
      if (targetIdx < 0 || targetIdx >= prev.tasks.length) return prev;
      const copy = [...prev.tasks];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return {
        ...prev,
        tasks: copy.map((t, i) => ({ ...t, orderIndex: i })),
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      calendarEvents: prev.calendarEvents.filter((ce) => ce.linkedTaskId !== taskId),
    }));
  }, []);

  const startTimer = useCallback(
    (input: { categoryId: string; taskId?: string | null; projectId?: string | null; note: string }) => {
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        activeTimer: {
          id: uid('tm'),
          categoryId: input.categoryId,
          taskId: input.taskId ?? null,
          projectId: input.projectId ?? null,
          note: input.note,
          status: 'running',
          startedAtMs: now,
          lastResumedAtMs: now,
          accumulatedMs: 0,
        },
      }));
    },
    [],
  );

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      if (prev.activeTimer.status !== 'running') return prev;
      const elapsed = getElapsedTimerMs(prev.activeTimer, now);
      return {
        ...prev,
        activeTimer: {
          ...prev.activeTimer,
          status: 'paused',
          accumulatedMs: elapsed,
          lastResumedAtMs: null,
        },
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      if (prev.activeTimer.status !== 'paused') return prev;
      return {
        ...prev,
        activeTimer: {
          ...prev.activeTimer,
          status: 'running',
          lastResumedAtMs: now,
        },
      };
    });
  }, []);

  const finishTimer = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      if (prev.activeTimer.status === 'idle') return prev;
      const durationMs = Math.max(60000, getElapsedTimerMs(prev.activeTimer, now));
      const startIso = new Date(prev.activeTimer.startedAtMs ?? now - durationMs).toISOString();
      const endIso = new Date(now).toISOString();
      const newEntry: TimeEntry = {
        id: uid('te'),
        categoryId: prev.activeTimer.categoryId,
        taskId: prev.activeTimer.taskId ?? null,
        projectId: prev.activeTimer.projectId ?? null,
        note: prev.activeTimer.note || 'Сесія за таймером',
        startTime: startIso,
        endTime: endIso,
        durationMs,
        isBillable: Boolean(prev.activeTimer.projectId),
      };
      const addedMins = Math.round(durationMs / 60000);
      const tasks = prev.activeTimer.taskId
        ? prev.tasks.map((t) =>
            t.id === prev.activeTimer.taskId ? { ...t, actualMinutes: t.actualMinutes + addedMins } : t,
          )
        : prev.tasks;
      const cat = prev.timeCategories.find((c) => c.id === newEntry.categoryId);
      const isRest = Boolean(cat?.isRestOrSleep);
      const gameUpdates = isRest
        ? awardXpAndCurrency(prev, 10, 5, 0, 'balance', 1)
        : { character: prev.character, gameCurrency: prev.gameCurrency };

      return {
        ...prev,
        ...gameUpdates,
        tasks,
        timeEntries: [newEntry, ...prev.timeEntries],
        activeTimer: {
          ...prev.activeTimer,
          status: 'idle',
          startedAtMs: null,
          lastResumedAtMs: null,
          accumulatedMs: 0,
        },
        lifeHistory: appendHistory(
          prev,
          'time',
          `Зафіксовано час (${addedMins} хв)`,
          `${cat?.name ?? 'Активність'}: ${newEntry.note}`,
        ),
      };
    });
  }, []);

  const addManualTimeEntry = useCallback(
    (input: {
      categoryId: string;
      note: string;
      minutes: number;
      date: string;
      projectId?: string | null;
      taskId?: string | null;
    }) => {
      const durationMs = Math.max(1, input.minutes) * 60000;
      const startIso = `${input.date}T12:00:00.000Z`;
      const endIso = new Date(new Date(startIso).getTime() + durationMs).toISOString();
      setState((prev) => {
        const entry: TimeEntry = {
          id: uid('te'),
          categoryId: input.categoryId,
          note: input.note || 'Ручний запис часу',
          startTime: startIso,
          endTime: endIso,
          durationMs,
          projectId: input.projectId ?? null,
          taskId: input.taskId ?? null,
          isBillable: Boolean(input.projectId),
        };
        const cat = prev.timeCategories.find((c) => c.id === input.categoryId);
        return {
          ...prev,
          timeEntries: [entry, ...prev.timeEntries],
          lifeHistory: appendHistory(
            prev,
            'time',
            `Додано запис часу (${input.minutes} хв)`,
            `${cat?.name ?? 'Категорія'}: ${entry.note}`,
          ),
        };
      });
    },
    [],
  );

  const addTimeCategory = useCallback(
    (name: string, parentId: string | null, color: string, isRestOrSleep: boolean) => {
      setState((prev) => {
        const cat: TimeCategory = {
          id: uid('cat'),
          parentId,
          name,
          color,
          isRestOrSleep,
          isCustom: true,
        };
        return {
          ...prev,
          timeCategories: [...prev.timeCategories, cat],
        };
      });
    },
    [],
  );

  const addAccount = useCallback(
    (input: { name: string; type: Account['type']; currency: string; initialBalanceMinor: number }) => {
      setState((prev) => ({
        ...prev,
        accounts: [
          ...prev.accounts,
          {
            id: uid('acc'),
            name: input.name,
            type: input.type,
            currency: input.currency,
            initialBalanceMinor: input.initialBalanceMinor,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [],
  );

  const addTransaction = useCallback(
    (input: {
      type: Transaction['type'];
      amountMinor: number;
      currency: string;
      accountId: string;
      toAccountId?: string | null;
      category: string;
      sourceOrPayee?: string;
      projectId?: string | null;
      date: string;
      comment: string;
    }) => {
      setState((prev) => {
        const rate = findExchangeRate(
          input.currency,
          prev.settings.baseCurrency,
          prev.exchangeRates,
          input.date,
        );
        const tx: Transaction = {
          id: uid('tx'),
          type: input.type,
          amountMinor: input.amountMinor,
          currency: input.currency,
          exchangeRateApplied: rate,
          accountId: input.accountId,
          toAccountId: input.toAccountId ?? null,
          category: input.category,
          sourceOrPayee: input.sourceOrPayee,
          projectId: input.projectId ?? null,
          date: input.date,
          comment: input.comment,
          createdAt: new Date().toISOString(),
        };
        const label =
          input.type === 'income' ? 'Дохід' : input.type === 'expense' ? 'Витрата' : 'Переказ між рахунками';
        return {
          ...prev,
          transactions: [tx, ...prev.transactions],
          lifeHistory: appendHistory(
            prev,
            'finances',
            label,
            `${(input.amountMinor / 100).toFixed(2)} ${input.currency} · ${input.category}`,
          ),
        };
      });
    },
    [],
  );

  const addExchangeRate = useCallback(
    (fromCurrency: string, toCurrency: string, rate: number, effectiveDate: string) => {
      setState((prev) => {
        const newRate: ExchangeRate = {
          id: uid('er'),
          fromCurrency,
          toCurrency,
          rate,
          effectiveDate,
        };
        return {
          ...prev,
          exchangeRates: [newRate, ...prev.exchangeRates],
        };
      });
    },
    [],
  );

  const addProject = useCallback(
    (input: { name: string; client: string; currency: string; totalValueMinor: number }) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        projects: [
          {
            id: uid('proj'),
            name: input.name,
            client: input.client,
            currency: input.currency,
            totalValueMinor: input.totalValueMinor,
            completionPct: 0,
            accruedMinor: 0,
            status: 'active',
            payments: [],
            createdAt: now,
            updatedAt: now,
          },
          ...prev.projects,
        ],
      }));
    },
    [],
  );

  const recordProjectPayment = useCallback(
    (projectId: string, amountMinor: number, accountId: string, note: string, date: string) => {
      setState((prev) => {
        const project = prev.projects.find((p) => p.id === projectId);
        if (!project || amountMinor <= 0) return prev;
        const rate = findExchangeRate(
          project.currency,
          prev.settings.baseCurrency,
          prev.exchangeRates,
          date,
        );
        const payment = { id: uid('pp'), amountMinor, date, accountId, note };
        const tx: Transaction = {
          id: uid('tx'),
          type: 'income',
          amountMinor,
          currency: project.currency,
          exchangeRateApplied: rate,
          accountId,
          category: 'Проєкти',
          sourceOrPayee: `${project.name} (${project.client})`,
          projectId,
          date,
          comment: note || 'Часткова виплата за проєктом',
          createdAt: new Date().toISOString(),
        };
        const gameUpdates = awardXpAndCurrency(prev, 25, 20, 0, 'career', 2);
        return {
          ...prev,
          ...gameUpdates,
          projects: prev.projects.map((p) =>
            p.id === projectId
              ? { ...p, payments: [payment, ...p.payments], updatedAt: new Date().toISOString() }
              : p,
          ),
          transactions: [tx, ...prev.transactions],
          lifeHistory: appendHistory(
            prev,
            'finances',
            'Оплата за проєктом',
            `${project.name}: +${(amountMinor / 100).toFixed(2)} ${project.currency}`,
          ),
        };
      });
    },
    [],
  );

  const updateProjectCompletion = useCallback((projectId: string, completionPct: number) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const clamped = Math.max(0, Math.min(100, completionPct));
        const accruedMinor = Math.round((p.totalValueMinor * clamped) / 100);
        return {
          ...p,
          completionPct: clamped,
          accruedMinor,
          status: clamped === 100 ? 'completed' : 'active',
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const addDebt = useCallback(
    (input: {
      title: string;
      type: Debt['type'];
      principalMinor: number;
      currency: string;
      interestRateAnnual: number;
      dueDate: string;
      monthlyPaymentMinor: number;
    }) => {
      setState((prev) => ({
        ...prev,
        debts: [
          {
            id: uid('debt'),
            title: input.title,
            type: input.type,
            principalMinor: input.principalMinor,
            remainingMinor: input.principalMinor,
            currency: input.currency,
            interestRateAnnual: input.interestRateAnnual,
            createdDate: new Date().toISOString().slice(0, 10),
            dueDate: input.dueDate,
            monthlyPaymentMinor: input.monthlyPaymentMinor,
            payments: [],
          },
          ...prev.debts,
        ],
      }));
    },
    [],
  );

  const payDebt = useCallback((debtId: string, amountMinor: number, isEarlyRepayment: boolean, note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const debt = prev.debts.find((d) => d.id === debtId);
      if (!debt || amountMinor <= 0) return prev;
      const updated = applyDebtPayment(debt, amountMinor, today, isEarlyRepayment, note);
      return {
        ...prev,
        debts: prev.debts.map((d) => (d.id === debtId ? updated : d)),
        lifeHistory: appendHistory(
          prev,
          'finances',
          isEarlyRepayment ? 'Дострокове погашення боргу' : 'Платіж за боргом',
          `${debt.title}: ${(amountMinor / 100).toFixed(2)} ${debt.currency}`,
        ),
      };
    });
  }, []);

  const addSavingsGoal = useCallback(
    (input: {
      title: string;
      mode: 'simple' | 'fund';
      targetMinor: number;
      currency: string;
      deadline: string;
      regularContributionMinor: number;
    }) => {
      setState((prev) => ({
        ...prev,
        savingsGoals: [
          ...prev.savingsGoals,
          {
            id: uid('sav'),
            title: input.title,
            mode: input.mode,
            targetMinor: input.targetMinor,
            currentMinor: 0,
            currency: input.currency,
            deadline: input.deadline,
            regularContributionMinor: input.regularContributionMinor,
            transactions: [],
          },
        ],
      }));
    },
    [],
  );

  const contributeSavings = useCallback((savingsId: string, amountMinor: number, note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((s) =>
        s.id === savingsId
          ? {
              ...s,
              currentMinor: s.currentMinor + amountMinor,
              transactions: [{ id: uid('st'), amountMinor, date: today, note }, ...s.transactions],
            }
          : s,
      ),
      lifeHistory: appendHistory(
        prev,
        'finances',
        'Поповнення накопичення',
        `+${(amountMinor / 100).toFixed(2)} (${note || 'Внесок'})`,
      ),
    }));
  }, []);

  const addOrUpdateBudget = useCallback((category: string, limitMinor: number) => {
    const month = new Date().toISOString().slice(0, 7);
    setState((prev) => {
      const existing = prev.budgets.find((b) => b.category === category && b.month === month);
      if (existing) {
        return {
          ...prev,
          budgets: prev.budgets.map((b) => (b.id === existing.id ? { ...b, limitMinor } : b)),
        };
      }
      const newBudget: Budget = {
        id: uid('b'),
        category,
        limitMinor,
        currency: prev.settings.baseCurrency,
        month,
      };
      return { ...prev, budgets: [...prev.budgets, newBudget] };
    });
  }, []);

  const addWorkout = useCallback((input: Omit<Workout, 'id'>) => {
    setState((prev) => {
      const workout: Workout = { ...input, id: uid('w') };
      const gameUpdates = awardXpAndCurrency(prev, 35, 20, 0, 'physical', 3);
      return {
        ...prev,
        ...gameUpdates,
        workouts: [workout, ...prev.workouts],
        lifeHistory: appendHistory(
          prev,
          'health',
          'Додано тренування (+35 XP)',
          `${workout.title} · ${workout.durationMinutes} хв`,
        ),
      };
    });
  }, []);

  const addBodyMetric = useCallback((input: Omit<BodyMetric, 'id'>) => {
    setState((prev) => ({
      ...prev,
      bodyMetrics: [...prev.bodyMetrics, { ...input, id: uid('bm') }],
    }));
  }, []);

  const completeLearningTopic = useCallback((courseId: string, topicId: string, quizScore: number) => {
    setState((prev) => {
      const gameUpdates = awardXpAndCurrency(prev, 40, 25, 1, 'intellect', 3);
      return {
        ...prev,
        ...gameUpdates,
        courses: prev.courses.map((c) =>
          c.id === courseId
            ? {
                ...c,
                hoursSpent: c.hoursSpent + 0.5,
                topics: c.topics.map((t) =>
                  t.id === topicId
                    ? { ...t, completed: true, masteryPct: Math.max(85, quizScore), quizScore, practiceDone: true }
                    : t,
                ),
              }
            : c,
        ),
        lifeHistory: appendHistory(
          prev,
          'learning',
          'Засвоєно навчальну тему (+40 XP)',
          `Результат перевірки: ${quizScore}%`,
        ),
      };
    });
  }, []);

  const addCourse = useCallback((title: string, subject: string, deadline: string, topicTitles: string[]) => {
    setState((prev) => {
      const course: LearningCourse = {
        id: uid('c'),
        title,
        subject,
        deadline,
        hoursSpent: 0,
        topics: topicTitles.map((tt) => ({
          id: uid('lt'),
          title: tt,
          masteryPct: 0,
          completed: false,
          practiceDone: false,
        })),
      };
      return { ...prev, courses: [course, ...prev.courses] };
    });
  }, []);

  const addSocialContact = useCallback((input: Omit<SocialContact, 'id'>) => {
    setState((prev) => ({
      ...prev,
      contacts: [{ ...input, id: uid('con') }, ...prev.contacts],
    }));
  }, []);

  const addSocialEvent = useCallback((input: Omit<SocialEvent, 'id'>) => {
    setState((prev) => {
      const gameUpdates = awardXpAndCurrency(prev, 30, 15, 0, 'social', 3);
      return {
        ...prev,
        ...gameUpdates,
        socialEvents: [{ ...input, id: uid('se') }, ...prev.socialEvents],
        lifeHistory: appendHistory(prev, 'social', 'Соціальна подія (+30 XP)', input.title),
      };
    });
  }, []);

  const addCalendarEvent = useCallback((input: Omit<CalendarEvent, 'id'>) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: [{ ...input, id: uid('ce') }, ...prev.calendarEvents],
    }));
  }, []);

  const setDigitalHygieneMode = useCallback((mode: 'normal' | 'focus' | 'relax', focusMinutes = 45) => {
    setState((prev) => {
      const focusEndTimestamp = mode === 'focus' ? Date.now() + focusMinutes * 60000 : null;
      const gameUpdates =
        mode === 'relax'
          ? awardXpAndCurrency(prev, 10, 5, 0, 'balance', 1)
          : mode === 'focus'
            ? awardXpAndCurrency(prev, 15, 10, 0, 'discipline', 1)
            : { character: prev.character, gameCurrency: prev.gameCurrency };
      return {
        ...prev,
        ...gameUpdates,
        digitalHygiene: {
          ...prev.digitalHygiene,
          mode,
          focusEndTimestamp,
        },
      };
    });
  }, []);

  const toggleDistractingApp = useCallback((appName: string) => {
    setState((prev) => {
      const exists = prev.digitalHygiene.focusSelectedApps.includes(appName);
      return {
        ...prev,
        digitalHygiene: {
          ...prev.digitalHygiene,
          focusSelectedApps: exists
            ? prev.digitalHygiene.focusSelectedApps.filter((a) => a !== appName)
            : [...prev.digitalHygiene.focusSelectedApps, appName],
        },
      };
    });
  }, []);

  const addDigitalApp = useCallback(
    (appName: string, category: 'productive' | 'neutral' | 'distracting', dailyLimitMinutes: number) => {
      setState((prev) => ({
        ...prev,
        digitalHygiene: {
          ...prev.digitalHygiene,
          apps: [
            ...prev.digitalHygiene.apps,
            {
              id: uid('da'),
              appName,
              category,
              minutesToday: 0,
              dailyLimitMinutes: Math.max(5, dailyLimitMinutes),
            },
          ],
          focusSelectedApps:
            category === 'distracting'
              ? [...prev.digitalHygiene.focusSelectedApps, appName]
              : prev.digitalHygiene.focusSelectedApps,
        },
      }));
    },
    [],
  );

  const sendAiMessage = useCallback(
    async (module: 'coach' | 'tutor' | 'social' | 'finance', prompt: string) => {
      const userMsg: AIInteraction = {
        id: uid('aim'),
        role: 'user',
        module,
        content: prompt,
        timestamp: new Date().toISOString(),
        source: 'local',
      };

      setState((prev) => ({
        ...prev,
        aiInteractions: [...prev.aiInteractions, userMsg],
      }));

      let replyText = '';
      let source: 'local' | 'gemini' = 'local';

      const canCallExternal =
        state.settings.aiExternalEnabled &&
        state.settings.aiRequestsUsedToday < state.settings.aiDailyRequestLimit;

      if (canCallExternal) {
        try {
          const context = buildMinimalAiContext(state, module);
          const resp = await fetch('/api/ai/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module, prompt, context }),
          });
          if (resp.ok) {
            const data = (await resp.json()) as { reply?: string };
            if (data.reply) {
              replyText = data.reply;
              source = 'gemini';
            }
          }
        } catch {
          // Offline or API unavailable -> fall back seamlessly to local deterministic coach
        }
      }

      if (!replyText) {
        const pendingHigh = state.tasks.filter((t) => t.status !== 'completed' && t.priority === 'high');
        if (module === 'tutor') {
          replyText =
            `Локальний AI-репетитор: розбийте тему на 20-хвилинний блок теорії та 15-хвилинну практику. ` +
            `Перевірте себе 3 питаннями: 1) Яка головна ідея? 2) Де вона застосовується? 3) Яке обмеження має рішення?`;
        } else if (module === 'social') {
          replyText =
            `Локальний AI-тренер комунікації: перед важливою розмовою сформулюйте 1 мету зустрічі та 2 відкриті запитання. ` +
            `Фокусуйтеся на інтересі до співрозмовника — спокійний темп мовлення одразу додає впевненості.`;
        } else {
          replyText =
            pendingHigh.length > 0
              ? `Локальний аналіз Kaizen: у вас ${pendingHigh.length} високопріоритетних завдань. Почніть із «${pendingHigh[0].title}» (${pendingHigh[0].estimatedMinutes} хв), після чого зафіксуйте короткий результат і зробіть перерву.`
              : `Локальний аналіз Kaizen: ключові пріоритети на сьогодні в порядку. Гарний час для спокійного навчання або відновлення!`;
        }
      }

      const assistantMsg: AIInteraction = {
        id: uid('aim'),
        role: 'assistant',
        module,
        content: replyText,
        timestamp: new Date().toISOString(),
        source,
      };

      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          aiRequestsUsedToday:
            source === 'gemini' ? prev.settings.aiRequestsUsedToday + 1 : prev.settings.aiRequestsUsedToday,
        },
        aiInteractions: [...prev.aiInteractions, assistantMsg],
        lifeHistory: appendHistory(prev, 'ai', `Консультація AI (${module})`, replyText.slice(0, 120)),
      }));
    },
    [state],
  );

  const addAiMemory = useCallback((category: AIMemoryItem['category'], summary: string) => {
    setState((prev) => ({
      ...prev,
      aiMemory: [
        { id: uid('mem'), category, summary, createdAt: new Date().toISOString(), editable: true },
        ...prev.aiMemory,
      ],
    }));
  }, []);

  const updateAiMemory = useCallback((id: string, summary: string) => {
    setState((prev) => ({
      ...prev,
      aiMemory: prev.aiMemory.map((m) => (m.id === id ? { ...m, summary } : m)),
    }));
  }, []);

  const deleteAiMemory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      aiMemory: prev.aiMemory.filter((m) => m.id !== id),
    }));
  }, []);

  const resolveAiProposal = useCallback((proposalId: string, accept: boolean) => {
    setState((prev) => {
      const prop = prev.aiProposals.find((p) => p.id === proposalId);
      if (!prop || prop.status !== 'pending') return prev;
      let nextSettings = prev.settings;
      let nextTasks = prev.tasks;
      if (accept) {
        if (prop.actionType === 'change_weights' && prop.payload) {
          const dir = prop.payload.direction as KaizenDirectionId;
          const weight = Number(prop.payload.weight) || 1.2;
          nextSettings = {
            ...prev.settings,
            directionWeights: { ...prev.settings.directionWeights, [dir]: weight },
          };
        } else if (prop.actionType === 'reorder_tasks') {
          const rank = { high: 0, medium: 1, low: 2 };
          nextTasks = [...prev.tasks]
            .sort((a, b) => rank[a.priority] - rank[b.priority])
            .map((t, i) => ({ ...t, orderIndex: i }));
        }
      }
      return {
        ...prev,
        settings: nextSettings,
        tasks: nextTasks,
        aiProposals: prev.aiProposals.map((p) =>
          p.id === proposalId ? { ...p, status: accept ? 'accepted' : 'rejected' } : p,
        ),
        lifeHistory: appendHistory(
          prev,
          'ai',
          accept ? 'Прийнято рекомендацію AI' : 'Відхилено рекомендацію AI',
          prop.title,
        ),
      };
    });
  }, []);

  const unlockAndPlaceIslandObject = useCallback((objectId: string, gridX: number, gridY: number): boolean => {
    let success = false;
    setState((prev) => {
      const obj = prev.islandObjects.find((o) => o.id === objectId);
      if (!obj) return prev;
      if (obj.unlocked) {
        success = true;
        return {
          ...prev,
          islandObjects: prev.islandObjects.map((o) => (o.id === objectId ? { ...o, gridX, gridY } : o)),
        };
      }
      if (
        prev.gameCurrency.coins < obj.costCoins ||
        prev.gameCurrency.crystals < obj.costCrystals
      ) {
        success = false;
        return prev;
      }
      success = true;
      return {
        ...prev,
        gameCurrency: {
          coins: prev.gameCurrency.coins - obj.costCoins,
          crystals: prev.gameCurrency.crystals - obj.costCrystals,
        },
        islandObjects: prev.islandObjects.map((o) =>
          o.id === objectId ? { ...o, unlocked: true, gridX, gridY } : o,
        ),
        lifeHistory: appendHistory(prev, 'game', 'Розміщено об’єкт на острові', obj.name),
      };
    });
    return success;
  }, []);

  const moveIslandObject = useCallback((objectId: string, gridX: number, gridY: number) => {
    setState((prev) => ({
      ...prev,
      islandObjects: prev.islandObjects.map((o: IslandObject) =>
        o.id === objectId ? { ...o, gridX, gridY } : o,
      ),
    }));
  }, []);

  const unlockTerritory = useCallback((territoryId: string): boolean => {
    let ok = false;
    setState((prev) => {
      const ter = prev.islandTerritories.find((t) => t.id === territoryId);
      if (!ter || ter.unlocked) return prev;
      if (
        prev.gameCurrency.coins < ter.costCoins ||
        prev.gameCurrency.crystals < ter.costCrystals
      ) {
        return prev;
      }
      ok = true;
      return {
        ...prev,
        gameCurrency: {
          coins: prev.gameCurrency.coins - ter.costCoins,
          crystals: prev.gameCurrency.crystals - ter.costCrystals,
        },
        islandTerritories: prev.islandTerritories.map((t) =>
          t.id === territoryId ? { ...t, unlocked: true } : t,
        ),
        lifeHistory: appendHistory(prev, 'game', 'Відкрито нову територію острова', ter.name),
      };
    });
    return ok;
  }, []);

  const updateCharacterAppearance = useCallback(
    (patch: Partial<Pick<CharacterState, 'name' | 'skinTone' | 'hairStyle' | 'hairColor' | 'outfit' | 'outfitColor'>>) => {
      setState((prev) => ({
        ...prev,
        character: { ...prev.character, ...patch },
      }));
    },
    [],
  );

  const restoreFullState = useCallback((newState: LifeOSState) => {
    setState({
      ...newState,
      settings: {
        ...newState.settings,
        onboardingCompleted: true,
      },
    });
  }, []);

  const completeOnboarding = useCallback((options: CleanUserSetupOptions) => {
    const clean = createCleanUserState({ ...options, onboardingCompleted: true });
    setState(clean);
  }, []);

  const recordBackupEvent = useCallback((encrypted: boolean, sha256: string, sizeBytes: number) => {
    setState((prev) => ({
      ...prev,
      backupHistory: [
        {
          id: uid('bk'),
          createdAt: new Date().toISOString(),
          encrypted,
          sha256,
          sizeBytes,
          destination: 'local_file',
        },
        ...prev.backupHistory,
      ],
    }));
  }, []);

  const deleteCategoryData = useCallback((category: 'tasks' | 'finances' | 'time' | 'ai' | 'history' | 'all') => {
    if (category === 'all') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      const fresh = createCleanUserState({ userName: '', onboardingCompleted: false });
      setState(fresh);
      return;
    }
    setState((prev) => {
      if (category === 'tasks') return { ...prev, tasks: [] };
      if (category === 'finances') return { ...prev, transactions: [], debts: [], projects: [] };
      if (category === 'time') return { ...prev, timeEntries: [] };
      if (category === 'ai') return { ...prev, aiMemory: [], aiInteractions: [] };
      if (category === 'history') return { ...prev, lifeHistory: [] };
      return prev;
    });
  }, []);

  return (
    <LifeOSContext.Provider
      value={{
        state,
        setTheme,
        updateSettings,
        addGoal,
        updateGoalProgress,
        toggleGoalMilestone,
        deleteGoal,
        addTask,
        completeTask,
        reopenTask,
        moveTaskOrder,
        deleteTask,
        startTimer,
        pauseTimer,
        resumeTimer,
        finishTimer,
        addManualTimeEntry,
        addTimeCategory,
        addAccount,
        addTransaction,
        addExchangeRate,
        addProject,
        recordProjectPayment,
        updateProjectCompletion,
        addDebt,
        payDebt,
        addSavingsGoal,
        contributeSavings,
        addOrUpdateBudget,
        addWorkout,
        addBodyMetric,
        completeLearningTopic,
        addCourse,
        addSocialContact,
        addSocialEvent,
        addCalendarEvent,
        setDigitalHygieneMode,
        toggleDistractingApp,
        addDigitalApp,
        sendAiMessage,
        addAiMemory,
        updateAiMemory,
        deleteAiMemory,
        resolveAiProposal,
        unlockAndPlaceIslandObject,
        moveIslandObject,
        unlockTerritory,
        updateCharacterAppearance,
        restoreFullState,
        completeOnboarding,
        recordBackupEvent,
        deleteCategoryData,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const ctx = useContext(LifeOSContext);
  if (!ctx) throw new Error('useLifeOS must be used within LifeOSProvider');
  return ctx;
}

import {
  KAIZEN_DIRECTIONS,
  type CharacterStats,
  type Goal,
  type KaizenDirectionId,
  type LifeOSState,
  type Task,
} from './types';
import { calculatePeriodCashflowMinor } from './financeMath';

export interface DirectionScore {
  direction: KaizenDirectionId;
  title: string;
  shortTitle: string;
  score: number; // 0..100
  weight: number;
  completedGoals: number;
  activeGoals: number;
}

export interface DevelopmentIndexResult {
  overallScore: number; // 0..100
  goalResultsScore: number;
  importantTasksScore: number;
  regularityScore: number;
  achievementsScore: number;
  momentumScore: number;
  directionScores: DirectionScore[];
}

export function calculateGoalProgressPct(goal: Goal): number {
  if (goal.status === 'completed') return 100;
  if (goal.targetValue > goal.initialValue) {
    const ratio = (goal.currentValue - goal.initialValue) / (goal.targetValue - goal.initialValue);
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }
  if (goal.milestones.length > 0) {
    const done = goal.milestones.filter((m) => m.completed).length;
    return Math.round((done / goal.milestones.length) * 100);
  }
  return 0;
}

/**
 * Computes per-direction Kaizen scores (0-100) using measurable goal progress,
 * priority-weighted tasks, workouts/learning/social events, and balance.
 * Rest & sleep never penalize the score (§6.2).
 */
export function calculateDirectionScores(state: LifeOSState): DirectionScore[] {
  const weights = state.settings.directionWeights;

  return KAIZEN_DIRECTIONS.map((dir) => {
    const dirGoals = state.goals.filter((g) => g.direction === dir.id);
    const dirTasks = state.tasks.filter((t) => t.direction === dir.id);

    const avgGoalProgress =
      dirGoals.length > 0
        ? dirGoals.reduce((sum, g) => sum + calculateGoalProgressPct(g), 0) / dirGoals.length
        : 0;

    const priorityWeight = (p: Task['priority']) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
    const totalTaskWeight = dirTasks.reduce((s, t) => s + priorityWeight(t.priority), 0);
    const completedTaskWeight = dirTasks
      .filter((t) => t.status === 'completed')
      .reduce((s, t) => s + priorityWeight(t.priority), 0);
    const taskQualityScore =
      totalTaskWeight > 0 ? (completedTaskWeight / totalTaskWeight) * 100 : 0;

    let domainBonus = 0;
    if (dir.id === 'health_fitness') {
      domainBonus = Math.min(20, state.workouts.length * 4);
    } else if (dir.id === 'learning_intellect') {
      const masteredTopics = state.courses.flatMap((c) => c.topics).filter((t) => t.completed).length;
      domainBonus = Math.min(20, masteredTopics * 4);
    } else if (dir.id === 'social_life') {
      domainBonus = Math.min(20, state.socialEvents.length * 5);
    } else if (dir.id === 'rest_balance') {
      // Rest entries boost balance score positively!
      const restMinutes = state.timeEntries
        .filter((e) => {
          const cat = state.timeCategories.find((c) => c.id === e.categoryId);
          return cat?.isRestOrSleep;
        })
        .reduce((s, e) => s + e.durationMs / 60000, 0);
      domainBonus = restMinutes >= 60 ? 20 : Math.round((restMinutes / 60) * 20);
    } else if (dir.id === 'discipline_habits') {
      const underLimit = state.digitalHygiene.apps.filter(
        (a) => a.category === 'distracting' && a.minutesToday <= a.dailyLimitMinutes,
      ).length;
      domainBonus = Math.min(20, underLimit * 7);
    } else if (dir.id === 'finance_career') {
      const achievedSavings = state.savingsGoals.filter((s) => s.currentMinor > 0).length;
      domainBonus = Math.min(20, achievedSavings * 5 + state.projects.length * 3);
    }

    const raw = Math.round(avgGoalProgress * 0.45 + taskQualityScore * 0.35 + domainBonus);
    const score = Math.max(0, Math.min(100, raw));

    return {
      direction: dir.id,
      title: dir.title,
      shortTitle: dir.shortTitle,
      score,
      weight: weights[dir.id] ?? 1,
      completedGoals: dirGoals.filter((g) => g.status === 'completed').length,
      activeGoals: dirGoals.filter((g) => g.status === 'active').length,
    };
  });
}

/**
 * Integral Development Index (§6.1):
 * - Goal results (30%)
 * - Priority-weighted important tasks (25%)
 * - Regularity across modules (20%)
 * - Real achievements (15%)
 * - Temporal momentum / direction weighted balance (10%)
 */
export function calculateDevelopmentIndex(state: LifeOSState): DevelopmentIndexResult {
  const directionScores = calculateDirectionScores(state);

  // 1. Goal results (avg goal completion weighted by goal priority)
  const goalWeight = (p: Goal['priority']) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
  const totalGoalW = state.goals.reduce((s, g) => s + goalWeight(g.priority), 0);
  const goalResultsScore =
    totalGoalW > 0
      ? Math.round(
          state.goals.reduce((s, g) => s + calculateGoalProgressPct(g) * goalWeight(g.priority), 0) /
            totalGoalW,
        )
      : 0;

  // 2. Important tasks (high & medium priority focus, not naive count/total)
  const importantTasks = state.tasks.filter((t) => t.priority === 'high' || t.priority === 'medium');
  const doneImportant = importantTasks.filter((t) => t.status === 'completed');
  const importantTasksScore =
    importantTasks.length > 0 ? Math.round((doneImportant.length / importantTasks.length) * 100) : 0;

  // 3. Regularity (distinct days with logged activity across tasks, workouts, time)
  const activeDates = new Set<string>();
  state.tasks.filter((t) => t.status === 'completed').forEach((t) => activeDates.add(t.scheduledDate));
  state.workouts.forEach((w) => activeDates.add(w.date));
  state.timeEntries.forEach((e) => activeDates.add(e.startTime.slice(0, 10)));
  const regularityScore = Math.min(100, Math.round((activeDates.size / 7) * 100));

  // 4. Real achievements
  const unlockedCount = state.achievements.filter((a) => a.unlocked).length;
  const achievementsScore =
    state.achievements.length > 0 && unlockedCount > 0
      ? Math.min(100, Math.round((unlockedCount / state.achievements.length) * 100 + 25))
      : 0;

  // 5. Weighted direction score (respects user-confirmed direction weights)
  let weightedSum = 0;
  let totalWeights = 0;
  for (const ds of directionScores) {
    if (state.settings.activeDirections.includes(ds.direction)) {
      weightedSum += ds.score * ds.weight;
      totalWeights += ds.weight;
    }
  }
  const momentumScore = totalWeights > 0 ? Math.round(weightedSum / totalWeights) : 0;

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        goalResultsScore * 0.3 +
          importantTasksScore * 0.25 +
          regularityScore * 0.2 +
          achievementsScore * 0.15 +
          momentumScore * 0.1,
      ),
    ),
  );

  return {
    overallScore,
    goalResultsScore,
    importantTasksScore,
    regularityScore,
    achievementsScore,
    momentumScore,
    directionScores,
  };
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  let level = 1;
  let threshold = 150;
  let remaining = Math.max(0, xp);
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = Math.round(threshold * 1.25);
  }
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: threshold,
    progressPct: Math.min(100, Math.round((remaining / threshold) * 100)),
  };
}

export function computeTaskCompletionRewards(
  task: Task,
  stats: CharacterStats,
): {
  xpDelta: number;
  coinsDelta: number;
  crystalsDelta: number;
  statKey: keyof CharacterStats;
  statDelta: number;
} {
  const baseXp = task.priority === 'high' ? 45 : task.priority === 'medium' ? 28 : 16;
  const hasResultBonus = task.resultNote && task.resultNote.trim().length > 3 ? 12 : 0;
  const dirMeta = KAIZEN_DIRECTIONS.find((d) => d.id === task.direction);
  const statKey = dirMeta?.characterStatKey ?? 'discipline';

  // Anti-burnout balance modifier (§15.5): balanced character gets +15% XP, overworking without balance gets no extra bonus
  const balanceBonus = stats.balance >= 50 ? 1.15 : 1.0;
  const xpDelta = Math.round((baseXp + hasResultBonus) * balanceBonus);
  const coinsDelta = task.priority === 'high' ? 25 : task.priority === 'medium' ? 15 : 8;
  const crystalsDelta = task.priority === 'high' && hasResultBonus > 0 ? 1 : 0;
  const statDelta = task.priority === 'high' ? 3 : 2;

  return { xpDelta, coinsDelta, crystalsDelta, statKey, statDelta };
}

export interface WeeklyKaizenReview {
  completedTasksCount: number;
  unfinishedTasksCount: number;
  completedGoalsCount: number;
  topWins: string[];
  biggestObstacles: string[];
  trackedHours: number;
  financialNetMinor: number;
  directionScores: DirectionScore[];
  recommendations: string[];
}

export function generateWeeklyKaizenReview(state: LifeOSState): WeeklyKaizenReview {
  const completedTasks = state.tasks.filter((t) => t.status === 'completed');
  const unfinishedTasks = state.tasks.filter((t) => t.status !== 'completed');
  const completedGoals = state.goals.filter((g) => g.status === 'completed');

  const topWins = completedTasks
    .filter((t) => t.priority === 'high' || Boolean(t.resultNote))
    .slice(0, 4)
    .map((t) => (t.resultNote ? `${t.title} — ${t.resultNote}` : t.title));

  const biggestObstacles = unfinishedTasks
    .filter((t) => Boolean(t.difficultyNote) || t.priority === 'high')
    .slice(0, 3)
    .map((t) => (t.difficultyNote ? `${t.title}: ${t.difficultyNote}` : `Не завершено: ${t.title}`));

  const trackedHours =
    Math.round((state.timeEntries.reduce((s, e) => s + e.durationMs, 0) / 3600000) * 10) / 10;
  const cashflow = calculatePeriodCashflowMinor(state.transactions);
  const directionScores = calculateDirectionScores(state);

  const lowestDir = [...directionScores].sort((a, b) => a.score - b.score)[0];
  const recommendations: string[] = [];
  if (lowestDir) {
    recommendations.push(
      `Підтягніть напрямок «${lowestDir.title}» (поточний індекс ${lowestDir.score}/100) — заплануйте 1 невелику дію на завтра.`,
    );
  }
  if (unfinishedTasks.filter((t) => t.priority === 'high').length > 2) {
    recommendations.push(
      'Виявлено понад 2 незавершені пріоритетні завдання. Перенесіть 1–2 менш критичні задачі, щоб уникнути перевантаження.',
    );
  } else {
    recommendations.push(
      'Зберігайте поточний ритм Kaizen: фіксуйте реальний результат після кожної ключової задачі.',
    );
  }

  return {
    completedTasksCount: completedTasks.length,
    unfinishedTasksCount: unfinishedTasks.length,
    completedGoalsCount: completedGoals.length,
    topWins,
    biggestObstacles,
    trackedHours,
    financialNetMinor: cashflow.netMinor,
    directionScores,
    recommendations,
  };
}

import type { AIProposal, LifeOSState } from './types';
import { calculateDevelopmentIndex } from './kaizenEngine';
import { calculatePeriodCashflowMinor, formatMoney } from './financeMath';

/**
 * Builds a minimal, privacy-filtered context snapshot before calling external AI (§14.6 & §18.2).
 * Never leaks private notes, contacts, or full financial ledger unless explicitly permitted.
 */
export function buildMinimalAiContext(state: LifeOSState, module: 'coach' | 'tutor' | 'social' | 'finance'): string {
  const scopes = state.settings.aiPermittedScopes;
  const parts: string[] = [];
  const devIndex = calculateDevelopmentIndex(state);

  parts.push(`Користувач: ${state.settings.userName}. Загальний індекс розвитку: ${devIndex.overallScore}/100.`);

  if (scopes.goals) {
    const activeGoals = state.goals
      .filter((g) => g.status === 'active')
      .slice(0, 5)
      .map((g) => `- ${g.title} (${g.currentValue}/${g.targetValue} ${g.unit}, пріоритет: ${g.priority}, дедлайн: ${g.deadline})`);
    if (activeGoals.length > 0) {
      parts.push(`Активні цілі:\n${activeGoals.join('\n')}`);
    }
  }

  if (scopes.tasks) {
    const pendingTasks = state.tasks
      .filter((t) => t.status !== 'completed')
      .slice(0, 6)
      .map((t) => `- [${t.priority}] ${t.title} (${t.estimatedMinutes} хв)`);
    if (pendingTasks.length > 0) {
      parts.push(`Завдання в роботі:\n${pendingTasks.join('\n')}`);
    }
  }

  if (scopes.financesSummary && (module === 'coach' || module === 'finance')) {
    const cashflow = calculatePeriodCashflowMinor(state.transactions);
    parts.push(
      `Фінансовий підсумок (без приватних деталей): доходи ${formatMoney(cashflow.incomeMinor, state.settings.baseCurrency, state.currencies)}, витрати ${formatMoney(cashflow.expenseMinor, state.settings.baseCurrency, state.currencies)}.`,
    );
  }

  if (scopes.learning && module === 'tutor') {
    const courses = state.courses
      .map((c) => `${c.title}: ${c.topics.filter((t) => !t.completed).map((t) => t.title).join(', ')}`)
      .join('; ');
    parts.push(`Курси навчання: ${courses}`);
  }

  if (scopes.socialContacts && module === 'social') {
    parts.push(`Кількість запланованих соціальних подій: ${state.socialEvents.length}.`);
  }

  if (state.aiMemory.length > 0) {
    const memories = state.aiMemory.slice(0, 5).map((m) => `* ${m.summary}`).join('\n');
    parts.push(`Ключові факти пам'яті AI:\n${memories}`);
  }

  return parts.join('\n\n');
}

/**
 * Local offline AI analytics engine (§14.6): detects plan deviations, budget risks,
 * rest deficits, and generates actionable proposals without external API dependency.
 */
export function generateLocalInsights(state: LifeOSState): {
  summary: string;
  insights: string[];
  proposals: AIProposal[];
} {
  const devIndex = calculateDevelopmentIndex(state);
  const insights: string[] = [];
  const proposals: AIProposal[] = [];

  const overdueHighTasks = state.tasks.filter(
    (t) => t.status !== 'completed' && t.priority === 'high',
  );
  if (overdueHighTasks.length >= 3) {
    insights.push(
      `У фокусі ${overdueHighTasks.length} високопріоритетних завдань. Рекомендується виконати "${overdueHighTasks[0].title}" першим.`,
    );
    proposals.push({
      id: 'prop_reorder_focus',
      title: 'Оптимізувати черговість денного плану',
      reason: 'Винесення найважливішого завдання першим знижує ризик відкладання.',
      actionType: 'reorder_tasks',
      requiresConfirmation: false,
      status: 'pending',
    });
  }

  // Budget overrun check
  const currentMonth = new Date().toISOString().slice(0, 7);
  for (const budget of state.budgets.filter((b) => b.month === currentMonth)) {
    const spent = state.transactions
      .filter((tx) => tx.type === 'expense' && tx.category === budget.category && tx.date.startsWith(currentMonth))
      .reduce((s, tx) => s + tx.amountMinor, 0);
    if (budget.limitMinor > 0 && spent / budget.limitMinor >= 0.85) {
      const pct = Math.round((spent / budget.limitMinor) * 100);
      insights.push(`Бюджет категорії «${budget.category}» використано на ${pct}%. Варто стримати імпульсивні витрати.`);
    }
  }

  // Rest & digital hygiene check
  const distractingMinutes = state.digitalHygiene.apps
    .filter((a) => a.category === 'distracting')
    .reduce((s, a) => s + a.minutesToday, 0);
  if (distractingMinutes > 90) {
    insights.push(
      `Сьогодні у відволікаючих застосунках проведено ${distractingMinutes} хв. Спробуйте увімкнути Focus Mode на 45 хв.`,
    );
  }

  if (insights.length === 0) {
    if (state.goals.length === 0 && state.tasks.length === 0 && state.transactions.length === 0) {
      insights.push(
        'Ваш особистий простір готовий. Додайте першу ціль Kaizen, запишіть дію на сьогодні або створіть фінансовий рахунок — система адаптується під ваші реальні дані.',
      );
    } else {
      insights.push(
        `Ваш індекс розвитку становить ${devIndex.overallScore}/100. Ритм тижня збалансований — продовжуйте крок за кроком.`,
      );
    }
  }

  return {
    summary: `Локальний аналіз завершено. Індекс Kaizen: ${devIndex.overallScore}/100.`,
    insights,
    proposals,
  };
}

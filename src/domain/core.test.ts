import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDebtPayment,
  calculateAccountBalanceMinor,
  calculatePeriodCashflowMinor,
  calculateProjectMetrics,
  convertMinorAmount,
  findExchangeRate,
  formatMoney,
  toMinorUnits,
} from './financeMath';
import {
  calculateDevelopmentIndex,
  calculateLevelFromXp,
  computeTaskCompletionRewards,
} from './kaizenEngine';
import { compute24hDistribution, getElapsedTimerMs } from './timeEngine';
import { buildMinimalAiContext } from './localAiCoach';
import { createCleanUserState, createInitialSeedState } from './seedData';

test('financeMath: exact minor-unit conversion avoids floating point drift', () => {
  assert.equal(toMinorUnits('19.99'), 1999);
  assert.equal(toMinorUnits('0.1') + toMinorUnits('0.2'), 30);
  assert.equal(formatMoney(123456, 'UAH', [{ code: 'UAH', symbol: '₴', name: 'Гривня', decimals: 2 }]), '1 234.56 ₴');
});

test('financeMath: internal transfers do NOT count as income or expense', () => {
  const state = createInitialSeedState();
  const cashflow = calculatePeriodCashflowMinor(state.transactions);
  // Seed has 42000 income, 14500 + 6850 + 1850 = 23200 expense, and 10000 transfer
  assert.equal(cashflow.incomeMinor, 4200000);
  assert.equal(cashflow.expenseMinor, 2320000);
  assert.equal(cashflow.netMinor, 1880000);

  // Check balances: acc_card had 32500 + 42000 - 14500 - 6850 - 10000 = 43150 UAH
  const card = state.accounts.find((a) => a.id === 'acc_card')!;
  assert.equal(calculateAccountBalanceMinor(card, state.transactions), 4315000);
  // acc_sav had 85000 + 10000 = 95000 UAH
  const sav = state.accounts.find((a) => a.id === 'acc_sav')!;
  assert.equal(calculateAccountBalanceMinor(sav, state.transactions), 9500000);
});

test('financeMath: project separates earned, accrued, received, and pending + hourly rate', () => {
  const state = createInitialSeedState();
  const nordic = state.projects.find((p) => p.id === 'proj_nordic')!;
  const metrics = calculateProjectMetrics(nordic, state.timeEntries);
  assert.equal(metrics.earnedByWorkMinor, 5460000); // 65% of 84000
  assert.equal(metrics.receivedMinor, 4200000); // only 42000 paid
  assert.equal(metrics.pendingMinor, 4200000);
  assert.equal(metrics.trackedMinutes, 150); // 2.5 hours
  assert.equal(metrics.effectiveHourlyReceivedMinor, 1680000); // 42000 / 2.5 = 16800 UAH/hr
});

test('financeMath: historical currency rate lookup & partial debt repayment', () => {
  const state = createInitialSeedState();
  const rate = findExchangeRate('USD', 'UAH', state.exchangeRates, '2026-11-15');
  assert.equal(rate, 41.4);
  assert.equal(convertMinorAmount(10000, rate), 414000); // 100 USD = 4140 UAH

  const debt = state.debts[0];
  const updated = applyDebtPayment(debt, 500000, '2026-11-15', true, 'Дострокове часткове');
  assert.equal(updated.remainingMinor, 1900000);
  assert.equal(updated.payments.length, 2);
});

test('kaizenEngine: rest never reduces development index & XP rewards respect balance', () => {
  const state = createInitialSeedState();
  const baseIdx = calculateDevelopmentIndex(state);
  assert.ok(baseIdx.overallScore > 0 && baseIdx.overallScore <= 100);

  // Adding a rest entry must NOT decrease overallScore
  const withMoreRest = {
    ...state,
    timeEntries: [
      ...state.timeEntries,
      {
        id: 'te_rest_extra',
        categoryId: 'cat_rest',
        note: 'Відпочинок на природі',
        startTime: '2026-11-15T16:00:00.000Z',
        endTime: '2026-11-15T17:30:00.000Z',
        durationMs: 90 * 60000,
      },
    ],
  };
  const restIdx = calculateDevelopmentIndex(withMoreRest);
  assert.ok(restIdx.overallScore >= baseIdx.overallScore);

  const lvl = calculateLevelFromXp(420);
  assert.equal(lvl.level, 3);
  const reward = computeTaskCompletionRewards(state.tasks[0], state.character.stats);
  assert.ok(reward.xpDelta > 0 && reward.coinsDelta > 0);
});

test('timeEngine: persistent timestamp timer survives reload without intervals', () => {
  const timer = {
    id: 't1',
    categoryId: 'cat_work',
    note: '',
    status: 'running' as const,
    startedAtMs: 1000,
    lastResumedAtMs: 5000,
    accumulatedMs: 10000,
  };
  assert.equal(getElapsedTimerMs(timer, 15000), 20000);
  const paused = { ...timer, status: 'paused' as const, lastResumedAtMs: null, accumulatedMs: 20000 };
  assert.equal(getElapsedTimerMs(paused, 99999), 20000);

  const state = createInitialSeedState();
  const dist = compute24hDistribution(state.timeEntries, state.timeCategories);
  assert.ok(dist.totalTrackedMinutes > 0);
});

test('localAiCoach: minimal context respects privacy permissions', () => {
  const state = createInitialSeedState();
  // By default socialContacts & privateNotes are false
  const ctx = buildMinimalAiContext(state, 'coach');
  assert.ok(ctx.includes('Активні цілі'));
  assert.ok(!ctx.includes('Ірина Коваль'));
});

test('cleanUserState: zero demo records, clean 0 baseline score, optional starter account', () => {
  const empty = createCleanUserState({ userName: 'Марія', baseCurrency: 'EUR' });
  assert.equal(empty.settings.userName, 'Марія');
  assert.equal(empty.settings.baseCurrency, 'EUR');
  assert.equal(empty.goals.length, 0);
  assert.equal(empty.tasks.length, 0);
  assert.equal(empty.transactions.length, 0);
  assert.equal(empty.accounts.length, 0);
  assert.equal(empty.workouts.length, 0);
  assert.equal(empty.courses.length, 0);
  assert.equal(empty.contacts.length, 0);
  assert.equal(empty.aiInteractions.length, 0);
  assert.equal(empty.lifeHistory.length, 0);
  assert.equal(empty.digitalHygiene.apps.length, 0);
  assert.equal(empty.character.xp, 0);
  assert.equal(empty.character.level, 1);
  assert.equal(empty.gameCurrency.coins, 0);

  const idx = calculateDevelopmentIndex(empty);
  assert.equal(idx.overallScore, 0);

  const withAcc = createCleanUserState({
    userName: 'Марія',
    baseCurrency: 'UAH',
    initialAccountName: 'Основна картка',
    initialBalanceMinor: 1500000,
    onboardingCompleted: true,
  });
  assert.equal(withAcc.accounts.length, 1);
  assert.equal(withAcc.accounts[0].name, 'Основна картка');
  assert.equal(withAcc.accounts[0].initialBalanceMinor, 1500000);
});

import type {
  Account,
  Currency,
  Debt,
  DebtPayment,
  ExchangeRate,
  Project,
  SavingsGoal,
  TimeEntry,
  Transaction,
} from './types';

/**
 * Converts a decimal currency value (string or number) into exact integer minor units
 * (e.g., kopiykas / cents) using string-safe scaling to avoid floating point drift.
 */
export function toMinorUnits(value: string | number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return Math.round((value + Number.EPSILON) * factor);
  }
  const normalized = value.trim().replace(',', '.').replace(/\s+/g, '');
  if (!normalized || isNaN(Number(normalized))) return 0;
  const negative = normalized.startsWith('-');
  const absStr = negative ? normalized.slice(1) : normalized;
  const [intPart = '0', fracPart = ''] = absStr.split('.');
  const paddedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const nextDigit = fracPart.length > decimals ? parseInt(fracPart[decimals], 10) : 0;
  let minor = parseInt(intPart || '0', 10) * factor + parseInt(paddedFrac || '0', 10);
  if (nextDigit >= 5) minor += 1;
  return negative ? -minor : minor;
}

export function fromMinorUnits(minor: number, decimals = 2): number {
  return minor / Math.pow(10, decimals);
}

export function formatMoney(
  minor: number,
  currencyCode: string,
  currencies: Currency[] = [],
): string {
  const meta = currencies.find((c) => c.code === currencyCode);
  const decimals = meta?.decimals ?? 2;
  const symbol = meta?.symbol ?? currencyCode;
  const sign = minor < 0 ? '-' : '';
  const absMinor = Math.abs(Math.round(minor));
  const factor = Math.pow(10, decimals);
  const whole = Math.floor(absMinor / factor);
  const frac = absMinor % factor;
  const wholeFormatted = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (decimals === 0) {
    return `${sign}${wholeFormatted} ${symbol}`;
  }
  const fracFormatted = frac.toString().padStart(decimals, '0');
  return `${sign}${wholeFormatted}.${fracFormatted} ${symbol}`;
}

/**
 * Looks up the latest exchange rate effective on or before `atDate` (YYYY-MM-DD).
 * Falls back to inverse rate if only reverse pair exists, or 1 if same currency.
 */
export function findExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[],
  atDate?: string,
): number {
  if (fromCurrency === toCurrency) return 1;

  const filterDate = (r: ExchangeRate) => !atDate || r.effectiveDate <= atDate;
  const direct = rates
    .filter((r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency && filterDate(r))
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  if (direct.length > 0) return direct[0].rate;

  const inverse = rates
    .filter((r) => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency && filterDate(r))
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  if (inverse.length > 0 && inverse[0].rate > 0) return 1 / inverse[0].rate;

  return 1;
}

export function convertMinorAmount(
  amountMinor: number,
  rate: number,
  fromDecimals = 2,
  toDecimals = 2,
): number {
  const scaleDiff = Math.pow(10, toDecimals - fromDecimals);
  return Math.round(amountMinor * rate * scaleDiff);
}

/**
 * Computes exact account balance in account's native currency minor units.
 * Transfers between own accounts adjust source (-) and destination (+).
 */
export function calculateAccountBalanceMinor(
  account: Account,
  transactions: Transaction[],
): number {
  let balance = account.initialBalanceMinor;
  for (const tx of transactions) {
    if (tx.type === 'income' && tx.accountId === account.id) {
      balance += tx.amountMinor;
    } else if (tx.type === 'expense' && tx.accountId === account.id) {
      balance -= tx.amountMinor;
    } else if (tx.type === 'transfer') {
      if (tx.accountId === account.id) {
        balance -= tx.amountMinor;
      }
      if (tx.toAccountId === account.id) {
        balance += tx.amountMinor;
      }
    }
  }
  return balance;
}

export function calculateTotalNetWorthMinor(
  accounts: Account[],
  transactions: Transaction[],
  baseCurrency: string,
  rates: ExchangeRate[],
): number {
  let total = 0;
  for (const acc of accounts) {
    const nativeBalance = calculateAccountBalanceMinor(acc, transactions);
    const rate = findExchangeRate(acc.currency, baseCurrency, rates);
    total += convertMinorAmount(nativeBalance, rate);
  }
  return total;
}

/**
 * Calculates Income, Expenses, and Net Result in base currency for a period.
 * Strictly EXCLUDES internal transfers between user's own accounts (§7.2).
 */
export function calculatePeriodCashflowMinor(
  transactions: Transaction[],
  periodStartIso?: string,
  periodEndIso?: string,
): { incomeMinor: number; expenseMinor: number; netMinor: number } {
  let incomeMinor = 0;
  let expenseMinor = 0;
  for (const tx of transactions) {
    if (tx.type === 'transfer') continue; // Never count internal transfers as income or expense!
    if (periodStartIso && tx.date < periodStartIso) continue;
    if (periodEndIso && tx.date > periodEndIso) continue;

    const baseMinor = Math.round(tx.amountMinor * tx.exchangeRateApplied);
    if (tx.type === 'income') {
      incomeMinor += baseMinor;
    } else if (tx.type === 'expense') {
      expenseMinor += baseMinor;
    }
  }
  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
}

export interface ProjectFinancialMetrics {
  earnedByWorkMinor: number;
  accruedMinor: number;
  receivedMinor: number;
  pendingMinor: number;
  trackedMinutes: number;
  effectiveHourlyReceivedMinor: number;
  effectiveHourlyEarnedMinor: number;
}

/**
 * Separates Earned (by work %), Accrued (invoiced), Received (paid), and Pending (§7.4).
 * Never treats unreceived project total as received income!
 */
export function calculateProjectMetrics(
  project: Project,
  timeEntries: TimeEntry[],
): ProjectFinancialMetrics {
  const earnedByWorkMinor = Math.round((project.totalValueMinor * project.completionPct) / 100);
  const receivedMinor = project.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const pendingMinor = Math.max(0, project.totalValueMinor - receivedMinor);
  const trackedMs = timeEntries
    .filter((e) => e.projectId === project.id)
    .reduce((sum, e) => sum + e.durationMs, 0);
  const trackedMinutes = Math.round(trackedMs / 60000);
  const trackedHours = trackedMs / 3600000;

  const effectiveHourlyReceivedMinor =
    trackedHours > 0 ? Math.round(receivedMinor / trackedHours) : 0;
  const effectiveHourlyEarnedMinor =
    trackedHours > 0 ? Math.round(earnedByWorkMinor / trackedHours) : 0;

  return {
    earnedByWorkMinor,
    accruedMinor: project.accruedMinor,
    receivedMinor,
    pendingMinor,
    trackedMinutes,
    effectiveHourlyReceivedMinor,
    effectiveHourlyEarnedMinor,
  };
}

/**
 * Applies partial or early debt repayment safely, clamping remaining balance to >= 0.
 */
export function applyDebtPayment(
  debt: Debt,
  amountMinor: number,
  date: string,
  isEarlyRepayment: boolean,
  note: string,
): Debt {
  if (amountMinor <= 0) return debt;
  const appliedMinor = Math.min(debt.remainingMinor, amountMinor);
  const payment: DebtPayment = {
    id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amountMinor: appliedMinor,
    date,
    isEarlyRepayment,
    note,
  };
  return {
    ...debt,
    remainingMinor: Math.max(0, debt.remainingMinor - appliedMinor),
    payments: [payment, ...debt.payments],
  };
}

export function calculateSavingsForecast(goal: SavingsGoal): {
  remainingMinor: number;
  progressPct: number;
  monthsNeededAtCurrentPace: number | null;
} {
  const remainingMinor = Math.max(0, goal.targetMinor - goal.currentMinor);
  const progressPct =
    goal.targetMinor > 0 ? Math.min(100, Math.round((goal.currentMinor / goal.targetMinor) * 100)) : 100;
  const monthsNeededAtCurrentPace =
    remainingMinor === 0
      ? 0
      : goal.regularContributionMinor > 0
        ? Math.ceil(remainingMinor / goal.regularContributionMinor)
        : null;
  return {
    remainingMinor,
    progressPct,
    monthsNeededAtCurrentPace,
  };
}

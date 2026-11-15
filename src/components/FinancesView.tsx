import React, { useState } from 'react';
import { ArrowLeftRight, Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import {
  calculateAccountBalanceMinor,
  calculatePeriodCashflowMinor,
  calculateProjectMetrics,
  calculateSavingsForecast,
  calculateTotalNetWorthMinor,
  formatMoney,
  toMinorUnits,
} from '../domain/financeMath';
import type { Account, Debt, TransactionType } from '../domain/types';

export function FinancesView() {
  const {
    state,
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
  } = useLifeOS();

  const [subTab, setSubTab] = useState<'overview' | 'projects' | 'debts' | 'savings'>('overview');

  // Quick Transaction Form
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txAccountId, setTxAccountId] = useState(state.accounts[0]?.id ?? '');
  const [txToAccountId, setTxToAccountId] = useState(state.accounts[1]?.id ?? state.accounts[0]?.id ?? '');
  const [txCategory, setTxCategory] = useState('Продукти');
  const [txComment, setTxComment] = useState('');

  // New Account Form
  const [showAccForm, setShowAccForm] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('card');
  const [accCurr, setAccCurr] = useState(state.settings.baseCurrency || 'UAH');
  const [accInit, setAccInit] = useState('0');

  // Exchange rate form
  const [rateFrom, setRateFrom] = useState('USD');
  const [rateVal, setRateVal] = useState('41.5');

  // Project payment form
  const [payingProjId, setPayingProjId] = useState<string | null>(null);
  const [projPayAmt, setProjPayAmt] = useState('');
  const [projPayAcc, setProjPayAcc] = useState(state.accounts[0]?.id ?? '');
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjTotal, setNewProjTotal] = useState('');

  // Debt payment
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [debtPayAmt, setDebtPayAmt] = useState('');
  const [debtEarly, setDebtEarly] = useState(false);
  const [newDebtTitle, setNewDebtTitle] = useState('');
  const [newDebtType, setNewDebtType] = useState<Debt['type']>('personal_owe');
  const [newDebtAmt, setNewDebtAmt] = useState('');

  // Savings
  const [savAddId, setSavAddId] = useState<string | null>(null);
  const [savAddAmt, setSavAddAmt] = useState('');
  const [newSavTitle, setNewSavTitle] = useState('');
  const [newSavTarget, setNewSavTarget] = useState('');

  // Budget quick editor
  const [budgetCat, setBudgetCat] = useState('Продукти');
  const [budgetLimit, setBudgetLimit] = useState('9000');

  const baseCurr = state.settings.baseCurrency;
  const effectiveAccountId = state.accounts.some((a) => a.id === txAccountId)
    ? txAccountId
    : (state.accounts[0]?.id ?? '');
  const effectiveToAccountId = state.accounts.some((a) => a.id === txToAccountId)
    ? txToAccountId
    : (state.accounts[1]?.id ?? state.accounts[0]?.id ?? '');
  const effectiveProjPayAcc = state.accounts.some((a) => a.id === projPayAcc)
    ? projPayAcc
    : (state.accounts[0]?.id ?? '');
  const netWorthMinor = calculateTotalNetWorthMinor(
    state.accounts,
    state.transactions,
    baseCurr,
    state.exchangeRates,
  );
  const cashflow = calculatePeriodCashflowMinor(state.transactions);
  const totalDebtOwedMinor = state.debts
    .filter((d) => d.type !== 'personal_owed_to_me')
    .reduce((s, d) => s + d.remainingMinor, 0);
  const totalSavingsMinor = state.savingsGoals.reduce((s, g) => s + g.currentMinor, 0);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAccountId) return;
    const minor = toMinorUnits(txAmount);
    if (minor <= 0) return;
    const acc = state.accounts.find((a) => a.id === effectiveAccountId);
    addTransaction({
      type: txType,
      amountMinor: minor,
      currency: acc?.currency ?? baseCurr,
      accountId: effectiveAccountId,
      toAccountId: txType === 'transfer' ? effectiveToAccountId : null,
      category: txType === 'transfer' ? 'Переказ між рахунками' : txCategory,
      date: new Date().toISOString().slice(0, 10),
      comment: txComment.trim(),
    });
    setTxAmount('');
    setTxComment('');
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    addAccount({
      name: accName.trim(),
      type: accType,
      currency: accCurr,
      initialBalanceMinor: toMinorUnits(accInit),
    });
    setAccName('');
    setAccInit('0');
    setShowAccForm(false);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Header + Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Фінансовий менеджер
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Точні десяткові розрахунки, мультивалютність, проєкти та контроль боргів
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
          {(
            [
              ['overview', 'Огляд і операції'],
              ['projects', 'Проєкти'],
              ['debts', 'Борги та кредити'],
              ['savings', 'Заощадження'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap ${
                subTab === id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Загальний баланс</p>
          <p
            data-testid="finance-net-worth"
            className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1"
          >
            {formatMoney(netWorthMinor, baseCurr, state.currencies)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Доходи / Витрати</p>
          <p
            data-testid="finance-income-total"
            className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1"
          >
            +{formatMoney(cashflow.incomeMinor, baseCurr, state.currencies)}
          </p>
          <p
            data-testid="finance-expense-total"
            className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400"
          >
            -{formatMoney(cashflow.expenseMinor, baseCurr, state.currencies)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Заощадження</p>
          <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1">
            {formatMoney(totalSavingsMinor, baseCurr, state.currencies)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Зобов’язання (борги)</p>
          <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatMoney(totalDebtOwedMinor, baseCurr, state.currencies)}
          </p>
        </div>
      </div>

      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Transaction Form + Accounts */}
          <div className="lg:col-span-5 space-y-5">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Швидке додавання операції
              </h3>

              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory('Продукти');
                  }}
                  className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                    txType === 'expense'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Витрата
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('Фриланс');
                  }}
                  className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                    txType === 'income'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Дохід
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('transfer')}
                  className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                    txType === 'transfer'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Переказ
                </button>
              </div>

              {state.accounts.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                  <p>
                    Щоб записувати витрати, доходи та перекази, спочатку створіть свій перший рахунок (наприклад, картку або готівку).
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAccForm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Додати перший рахунок
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddTx} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="tx-amt" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Сума
                      </label>
                      <input
                        id="tx-amt"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="tx-acc" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {txType === 'transfer' ? 'З рахунку' : 'Рахунок'}
                      </label>
                      <select
                        id="tx-acc"
                        value={effectiveAccountId}
                        onChange={(e) => setTxAccountId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {state.accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {txType === 'transfer' ? (
                    <div>
                      <label htmlFor="tx-to-acc" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        На рахунок (перекази не змінюють дохід/витрати)
                      </label>
                      <select
                        id="tx-to-acc"
                        value={effectiveToAccountId}
                        onChange={(e) => setTxToAccountId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {state.accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="tx-cat" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Категорія
                      </label>
                      <input
                        id="tx-cat"
                        type="text"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="tx-comment" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Коментар
                    </label>
                    <input
                      id="tx-comment"
                      type="text"
                      value={txComment}
                      onChange={(e) => setTxComment(e.target.value)}
                      placeholder="Деталі операції"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold min-h-[44px]"
                  >
                    Записати операцію
                  </button>
                </form>
              )}
            </section>

            {/* Accounts List */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Рахунки
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAccForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Рахунок
                </button>
              </div>

              {showAccForm && (
                <form onSubmit={handleAddAccount} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2.5">
                  <input
                    type="text"
                    required
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="Назва рахунку"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={accType}
                      onChange={(e) => setAccType(e.target.value as Account['type'])}
                      className="px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="card">Картка</option>
                      <option value="cash">Готівка</option>
                      <option value="bank">Рахунок</option>
                      <option value="ewallet">Гаманець</option>
                      <option value="savings">Заощадження</option>
                    </select>
                    <select
                      value={accCurr}
                      onChange={(e) => setAccCurr(e.target.value)}
                      className="px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      {state.currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={accInit}
                      onChange={(e) => setAccInit(e.target.value)}
                      placeholder="Баланс"
                      className="px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold">
                    Створити
                  </button>
                </form>
              )}

              {state.accounts.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  Рахунків ще немає. Натисніть «+ Рахунок», щоб додати картку, готівку або банківський рахунок.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.accounts.map((acc) => {
                    const bal = calculateAccountBalanceMinor(acc, state.transactions);
                    return (
                      <li key={acc.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <Wallet className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{acc.name}</p>
                            <p className="text-xs text-slate-500">{acc.currency}</p>
                          </div>
                        </div>
                        <span
                          data-testid={`account-balance-${acc.id}`}
                          className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {formatMoney(bal, acc.currency, state.currencies)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Right Column: Budgets + Exchange Rates + Transactions Ledger */}
          <div className="lg:col-span-7 space-y-5">
            {/* Monthly Budgets */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Місячні бюджети та ліміти ({currentMonth})
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={budgetCat}
                    onChange={(e) => setBudgetCat(e.target.value)}
                    placeholder="Категорія"
                    className="w-28 px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="w-24 px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => addOrUpdateBudget(budgetCat.trim(), toMinorUnits(budgetLimit))}
                    className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                  >
                    Зберегти ліміт
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {state.budgets.map((b) => {
                  const spentMinor = state.transactions
                    .filter(
                      (t) =>
                        t.type === 'expense' &&
                        t.category === b.category &&
                        t.date.startsWith(currentMonth),
                    )
                    .reduce((s, t) => s + t.amountMinor, 0);
                  const pct = b.limitMinor > 0 ? Math.min(100, Math.round((spentMinor / b.limitMinor) * 100)) : 0;
                  const isRisk = spentMinor >= b.limitMinor * 0.85;
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {b.category}
                          {isRisk && <span className="text-amber-600 dark:text-amber-400"> · Ризик перевищення</span>}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {formatMoney(spentMinor, b.currency, state.currencies)} /{' '}
                          {formatMoney(b.limitMinor, b.currency, state.currencies)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isRisk ? 'bg-amber-500' : 'bg-teal-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Exchange Rates */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Курси валют до {baseCurr}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {state.exchangeRates
                    .slice(0, 3)
                    .map((r) => `1 ${r.fromCurrency} = ${r.rate} ${r.toCurrency}`)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rateFrom}
                  onChange={(e) => setRateFrom(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={rateVal}
                  onChange={(e) => setRateVal(e.target.value)}
                  className="w-20 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    addExchangeRate(rateFrom, baseCurr, Number(rateVal) || 1, new Date().toISOString().slice(0, 10))
                  }
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                >
                  Оновити курс
                </button>
              </div>
            </section>

            {/* Transactions Table */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Останні фінансові операції
              </h3>
              {state.transactions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  Операцій ще немає. Тут з’являтимуться ваші доходи, витрати та перекази.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.transactions.slice(0, 10).map((tx) => {
                    const acc = state.accounts.find((a) => a.id === tx.accountId);
                    return (
                      <li key={tx.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {tx.category}
                            {tx.sourceOrPayee ? ` · ${tx.sourceOrPayee}` : ''}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tx.date} · {acc?.name ?? 'Рахунок'}
                            {tx.comment ? ` · ${tx.comment}` : ''}
                          </p>
                        </div>
                        <span
                          className={`font-mono tabular-nums font-semibold shrink-0 ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'expense'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄ '}
                          {formatMoney(tx.amountMinor, tx.currency, state.currencies)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {subTab === 'projects' && (
        <div className="space-y-5">
          {/* Add Project Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">Назва проєкту</label>
              <input
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Напр., Вебпортал аналітики"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs text-slate-500 mb-1">Клієнт</label>
              <input
                type="text"
                value={newProjClient}
                onChange={(e) => setNewProjClient(e.target.value)}
                placeholder="Компанія"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs text-slate-500 mb-1">Бюджет ({baseCurr})</label>
              <input
                type="number"
                value={newProjTotal}
                onChange={(e) => setNewProjTotal(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newProjName.trim()) return;
                addProject({
                  name: newProjName.trim(),
                  client: newProjClient.trim() || 'Приватний клієнт',
                  currency: baseCurr,
                  totalValueMinor: toMinorUnits(newProjTotal || '0'),
                });
                setNewProjName('');
                setNewProjClient('');
                setNewProjTotal('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold min-h-[38px]"
            >
              Додати проєкт
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {state.projects.map((proj) => {
              const m = calculateProjectMetrics(proj, state.timeEntries);
              return (
                <article
                  key={proj.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        {proj.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {proj.client} · Загальна вартість {formatMoney(proj.totalValueMinor, proj.currency, state.currencies)}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">
                      {proj.completionPct}% робіт
                    </span>
                  </div>

                  {/* 4 separated metrics per §7.4 */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500">Зароблено (за обсягом)</span>
                      <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatMoney(m.earnedByWorkMinor, proj.currency, state.currencies)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Нараховано</span>
                      <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatMoney(m.accruedMinor, proj.currency, state.currencies)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Фактично отримано</span>
                      <p className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatMoney(m.receivedMinor, proj.currency, state.currencies)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Очікується до отримання</span>
                      <p className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatMoney(m.pendingMinor, proj.currency, state.currencies)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-mono text-slate-500">
                      Час: {(m.trackedMinutes / 60).toFixed(1)} год · Ставка:{' '}
                      {formatMoney(m.effectiveHourlyReceivedMinor, proj.currency, state.currencies)}/год
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateProjectCompletion(proj.id, Math.min(100, proj.completionPct + 10))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                      >
                        +10% робіт
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayingProjId(payingProjId === proj.id ? null : proj.id)}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold"
                      >
                        Часткова виплата
                      </button>
                    </div>
                  </div>

                  {payingProjId === proj.id && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-wrap gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={projPayAmt}
                        onChange={(e) => setProjPayAmt(e.target.value)}
                        placeholder={`Сума (${proj.currency})`}
                        className="w-32 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                      <select
                        value={effectiveProjPayAcc}
                        onChange={(e) => setProjPayAcc(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        {state.accounts.length === 0 ? (
                          <option value="">Без рахунку</option>
                        ) : (
                          state.accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const minor = toMinorUnits(projPayAmt);
                          if (minor > 0 && effectiveProjPayAcc) {
                            recordProjectPayment(
                              proj.id,
                              minor,
                              effectiveProjPayAcc,
                              'Часткова оплата',
                              new Date().toISOString().slice(0, 10),
                            );
                            setProjPayAmt('');
                            setPayingProjId(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                      >
                        Зарахувати
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'debts' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500 mb-1">Назва боргу / кредиту</label>
              <input
                type="text"
                value={newDebtTitle}
                onChange={(e) => setNewDebtTitle(e.target.value)}
                placeholder="Напр., Кредит / Позика"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <select
              value={newDebtType}
              onChange={(e) => setNewDebtType(e.target.value as Debt['type'])}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="personal_owe">Я винен</option>
              <option value="personal_owed_to_me">Мені винні</option>
              <option value="bank_loan">Банківський кредит</option>
              <option value="installment">Розстрочка</option>
            </select>
            <input
              type="number"
              value={newDebtAmt}
              onChange={(e) => setNewDebtAmt(e.target.value)}
              placeholder={`Сума (${baseCurr})`}
              className="w-32 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const minor = toMinorUnits(newDebtAmt);
                if (!newDebtTitle.trim() || minor <= 0) return;
                addDebt({
                  title: newDebtTitle.trim(),
                  type: newDebtType,
                  principalMinor: minor,
                  currency: baseCurr,
                  interestRateAnnual: 0,
                  dueDate: '2027-06-01',
                  monthlyPaymentMinor: Math.round(minor / 6),
                });
                setNewDebtTitle('');
                setNewDebtAmt('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
            >
              Додати
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.debts.map((debt) => {
              const paidMinor = debt.principalMinor - debt.remainingMinor;
              const pct =
                debt.principalMinor > 0 ? Math.round((paidMinor / debt.principalMinor) * 100) : 100;
              return (
                <article
                  key={debt.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        {debt.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {debt.type === 'personal_owed_to_me'
                          ? 'Повернення мені'
                          : debt.type === 'installment'
                            ? 'Розстрочка'
                            : debt.type === 'bank_loan'
                              ? 'Банківський кредит'
                              : 'Особистий борг'}{' '}
                        · До {debt.dueDate}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">
                      Погашено {pct}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span>
                      Залишок: <strong>{formatMoney(debt.remainingMinor, debt.currency, state.currencies)}</strong>
                    </span>
                    <span className="text-slate-500">
                      із {formatMoney(debt.principalMinor, debt.currency, state.currencies)}
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">Платежів: {debt.payments.length}</span>
                    {debt.remainingMinor > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayingDebtId(payingDebtId === debt.id ? null : debt.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                      >
                        Внести платіж
                      </button>
                    )}
                  </div>

                  {payingDebtId === debt.id && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={debtPayAmt}
                          onChange={(e) => setDebtPayAmt(e.target.value)}
                          placeholder="Сума погашення"
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const minor = toMinorUnits(debtPayAmt);
                            if (minor > 0) {
                              payDebt(
                                debt.id,
                                minor,
                                debtEarly,
                                debtEarly ? 'Дострокове погашення' : 'Часткове погашення',
                              );
                              setDebtPayAmt('');
                              setPayingDebtId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                        >
                          Погасити
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={debtEarly}
                          onChange={(e) => setDebtEarly(e.target.checked)}
                        />
                        Дострокове погашення
                      </label>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'savings' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-end gap-3">
            <input
              type="text"
              value={newSavTitle}
              onChange={(e) => setNewSavTitle(e.target.value)}
              placeholder="Назва цілі накопичення"
              className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              value={newSavTarget}
              onChange={(e) => setNewSavTarget(e.target.value)}
              placeholder={`Цільова сума (${baseCurr})`}
              className="w-40 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const minor = toMinorUnits(newSavTarget);
                if (!newSavTitle.trim() || minor <= 0) return;
                addSavingsGoal({
                  title: newSavTitle.trim(),
                  mode: 'simple',
                  targetMinor: minor,
                  currency: baseCurr,
                  deadline: '2027-09-01',
                  regularContributionMinor: Math.round(minor / 12),
                });
                setNewSavTitle('');
                setNewSavTarget('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
            >
              Створити ціль
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.savingsGoals.map((sg) => {
              const fc = calculateSavingsForecast(sg);
              return (
                <article
                  key={sg.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        {sg.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {sg.mode === 'fund' ? 'Фонд розподілу' : 'Проста ціль'} · Термін {sg.deadline}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">
                      {fc.progressPct}%
                    </span>
                  </div>

                  <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {formatMoney(sg.currentMinor, sg.currency, state.currencies)} із{' '}
                    {formatMoney(sg.targetMinor, sg.currency, state.currencies)}
                    {fc.monthsNeededAtCurrentPace !== null && (
                      <span className="text-slate-500"> · Прогноз: ~{fc.monthsNeededAtCurrentPace} міс.</span>
                    )}
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${fc.progressPct}%` }} />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setSavAddId(savAddId === sg.id ? null : sg.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                    >
                      Поповнити
                    </button>
                  </div>

                  {savAddId === sg.id && (
                    <div className="flex gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <input
                        type="number"
                        step="0.01"
                        value={savAddAmt}
                        onChange={(e) => setSavAddAmt(e.target.value)}
                        placeholder="Сума внеску"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const minor = toMinorUnits(savAddAmt);
                          if (minor > 0) {
                            contributeSavings(sg.id, minor, 'Регулярне поповнення');
                            setSavAddAmt('');
                            setSavAddId(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                      >
                        Додати
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

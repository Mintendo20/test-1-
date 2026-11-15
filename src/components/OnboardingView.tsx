import React, { useState } from 'react';
import { Check, Sparkles, Upload } from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import { restoreBackupEnvelope } from '../domain/backupCrypto';
import { toMinorUnits } from '../domain/financeMath';
import {
  KAIZEN_DIRECTIONS,
  type AccountType,
  type CharacterState,
  type KaizenDirectionId,
  type ThemeMode,
} from '../domain/types';
import { PWAInstallButton } from './PWAInstallButton';

export function OnboardingView() {
  const { completeOnboarding, restoreFullState } = useLifeOS();

  const [userName, setUserName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('UAH');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeDirections, setActiveDirections] = useState<KaizenDirectionId[]>(
    KAIZEN_DIRECTIONS.map((d) => d.id),
  );
  const [addFirstAccount, setAddFirstAccount] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('card');
  const [initialBalance, setInitialBalance] = useState('');
  const [outfit, setOutfit] = useState<CharacterState['outfit']>('explorer');

  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const toggleDirection = (id: KaizenDirectionId) => {
    setActiveDirections((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((d) => d !== id)
          : prev
        : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
      userName: userName.trim() || 'Користувач',
      baseCurrency,
      theme,
      activeDirections,
      initialAccountName: addFirstAccount ? accountName.trim() : undefined,
      initialAccountType: accountType,
      initialBalanceMinor: addFirstAccount && initialBalance ? toMinorUnits(initialBalance) : 0,
      characterOutfit: outfit,
      onboardingCompleted: true,
    });
  };

  const handleSkipClean = () => {
    completeOnboarding({
      userName: 'Користувач',
      baseCurrency,
      theme,
      activeDirections,
      onboardingCompleted: true,
    });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    try {
      const text = await file.text();
      const { state } = await restoreBackupEnvelope(text, restorePassphrase || undefined);
      restoreFullState({
        ...state,
        settings: { ...state.settings, onboardingCompleted: true },
      });
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Не вдалося розшифрувати або прочитати файл.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-8 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
              Personal Life OS · Чистий старт
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-slate-50 mt-1">
              Налаштуйте свій простір
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Жодних тестових даних — усі ваші цілі, фінанси, час і прогрес зберігаються локально на цьому пристрої.
            </p>
          </div>
          <PWAInstallButton />
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm"
        >
          {/* Name & Base Currency & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Як до вас звертатися?
              </label>
              <input
                id="onb-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ваше ім’я"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="onb-curr" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Основна валюта
              </label>
              <select
                id="onb-curr"
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="UAH">UAH (₴) — Українська гривня</option>
                <option value="USD">USD ($) — Долар США</option>
                <option value="EUR">EUR (€) — Євро</option>
              </select>
            </div>
          </div>

          {/* Theme + Character Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Тема оформлення
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['light', 'Світла'],
                    ['dark', 'Темна'],
                    ['auto', 'Авто'],
                  ] as Array<[ThemeMode, string]>
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      theme === mode
                        ? 'bg-teal-600 text-white border-transparent'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="onb-outfit" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Стиль персонажа (Life World)
              </label>
              <select
                id="onb-outfit"
                value={outfit}
                onChange={(e) => setOutfit(e.target.value as CharacterState['outfit'])}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 min-h-[36px]"
              >
                <option value="explorer">Мандрівник</option>
                <option value="minimal">Мінімаліст</option>
                <option value="scholar">Дослідник</option>
                <option value="athlete">Атлет</option>
              </select>
            </div>
          </div>

          {/* Optional Starter Account */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <span>Додати перший фінансовий рахунок одразу (необов’язково)</span>
              <input
                type="checkbox"
                checked={addFirstAccount}
                onChange={(e) => setAddFirstAccount(e.target.checked)}
                className="rounded border-slate-300 text-teal-600"
              />
            </label>
            {addFirstAccount && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Напр., Основна картка"
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="card">Банківська картка</option>
                  <option value="cash">Готівка</option>
                  <option value="bank">Рахунок у банку</option>
                  <option value="savings">Заощадження</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder={`Баланс (${baseCurrency})`}
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            )}
          </div>

          {/* Active Kaizen Directions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Активні напрямки розвитку Kaizen
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KAIZEN_DIRECTIONS.map((dir) => {
                const selected = activeDirections.includes(dir.id);
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => toggleDirection(dir.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-colors ${
                      selected
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-medium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{dir.title}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold min-h-[46px]"
            >
              <Sparkles className="w-4 h-4" />
              Почати роботу з чистим профілем
            </button>
            <button
              type="button"
              onClick={handleSkipClean}
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold min-h-[46px]"
            >
              Пропустити
            </button>
          </div>
        </form>

        {/* Restore existing backup option */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Вже користувалися на іншому пристрої?
            </p>
            <p>Відновіть ваші дані з файлу резервної копії (.json).</p>
            {restoreError && <p className="text-rose-600 dark:text-rose-400 mt-1">{restoreError}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="password"
              value={restorePassphrase}
              onChange={(e) => setRestorePassphrase(e.target.value)}
              placeholder="Пароль (якщо є)"
              className="w-32 px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <Upload className="w-3.5 h-3.5" />
              Відновити
              <input
                type="file"
                accept="application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

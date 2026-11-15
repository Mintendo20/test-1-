import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Brain,
  Calendar,
  Download,
  Gamepad2,
  HeartHandshake,
  History,
  Lock,
  Settings,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import { createBackupEnvelope, restoreBackupEnvelope } from '../domain/backupCrypto';
import {
  CalendarSubView,
  DigitalHygieneSubView,
  HistorySubView,
  LearningSubView,
  PhysicalSubView,
  SocialSubView,
} from './ProfileSubModules';
import { PWAInstallSettingsCard } from './PWAInstallButton';
import type { ThemeMode } from '../domain/types';

interface ProfileHubViewProps {
  onOpenAiCoach: () => void;
  onOpenLifeWorld: () => void;
}

type ProfileSubSection =
  | 'menu'
  | 'calendar'
  | 'physical'
  | 'learning'
  | 'social'
  | 'hygiene'
  | 'history'
  | 'settings';

export function ProfileHubView({ onOpenAiCoach, onOpenLifeWorld }: ProfileHubViewProps) {
  const {
    state,
    setTheme,
    updateSettings,
    restoreFullState,
    recordBackupEvent,
    deleteCategoryData,
  } = useLifeOS();

  const [section, setSection] = useState<ProfileSubSection>('menu');
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportBackup = async () => {
    try {
      const env = await createBackupEnvelope(state, backupPassphrase || undefined);
      const json = JSON.stringify(env, null, 2);
      recordBackupEvent(env.encrypted, env.sha256, json.length);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus(
        env.encrypted
          ? 'Зашифровану резервну копію (AES-GCM + SHA-256) створено та завантажено.'
          : 'Резервну копію (SHA-256) створено та завантажено.',
      );
    } catch (e) {
      setBackupStatus(e instanceof Error ? e.message : 'Помилка створення копії.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { state: restored, integrityVerified } = await restoreBackupEnvelope(
        text,
        backupPassphrase || undefined,
      );
      restoreFullState(restored);
      setBackupStatus(
        integrityVerified
          ? 'Дані успішно відновлено. Цілісність SHA-256 підтверджено.'
          : 'Дані відновлено.',
      );
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : 'Помилка відновлення копії.');
    }
  };

  const moduleCards: Array<{
    id: ProfileSubSection | 'ai_coach' | 'life_world';
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'ai_coach', title: 'Персональний AI-коуч', subtitle: 'Окремий повноекранний аналітик і пам’ять', icon: Brain },
    { id: 'life_world', title: 'Ігровий світ — Life World', subtitle: '2.5D острів, персонаж та досягнення', icon: Gamepad2 },
    { id: 'calendar', title: 'Календар і нагадування', subtitle: 'День, тиждень, місяць + завдання Kaizen', icon: Calendar },
    { id: 'physical', title: 'Фізичний розвиток', subtitle: 'Тренування, вага, зріст і прогрес', icon: Activity },
    { id: 'learning', title: 'Навчання та AI-репетитор', subtitle: 'Курси, теми, тести й пояснення', icon: BookOpen },
    { id: 'social', title: 'Соціальний розвиток', subtitle: 'Зустрічі, контакти та AI-тренер', icon: HeartHandshake },
    { id: 'hygiene', title: 'Цифрова гігієна', subtitle: 'Focus Mode, Relax Mode і ліміти', icon: Smartphone },
    { id: 'history', title: 'Історія розвитку', subtitle: 'Хронологія, пошук і експорт', icon: History },
    { id: 'settings', title: 'Налаштування, приватність і копії', subtitle: 'Теми, шифрований бекап і видалення даних', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Профіль та екосистема модулів
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {state.settings.userName} · Рівень {state.character.level} · Local-First база даних
          </p>
        </div>

        {section !== 'menu' && (
          <button
            type="button"
            onClick={() => setSection('menu')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ← До списку модулів
          </button>
        )}
      </div>

      {section === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  if (card.id === 'ai_coach') onOpenAiCoach();
                  else if (card.id === 'life_world') onOpenLifeWorld();
                  else setSection(card.id);
                }}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-teal-500/60 transition-colors flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {section === 'calendar' && <CalendarSubView />}
      {section === 'physical' && <PhysicalSubView />}
      {section === 'learning' && <LearningSubView />}
      {section === 'social' && <SocialSubView />}
      {section === 'hygiene' && <DigitalHygieneSubView />}
      {section === 'history' && <HistorySubView />}

      {section === 'settings' && (
        <div className="space-y-6">
          <PWAInstallSettingsCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General & Theme Settings */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold">Загальні налаштування та тема</h3>
            <div>
              <label htmlFor="prof-name" className="block text-xs text-slate-500 mb-1">
                Ім’я користувача
              </label>
              <input
                id="prof-name"
                type="text"
                value={state.settings.userName}
                onChange={(e) => updateSettings({ userName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5">Тема оформлення</p>
              <div className="grid grid-cols-3 gap-2">
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
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      state.settings.theme === mode
                        ? 'bg-teal-600 text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="prof-curr" className="block text-xs text-slate-500 mb-1">
                Основна валюта статистики
              </label>
              <select
                id="prof-curr"
                value={state.settings.baseCurrency}
                onChange={(e) => updateSettings({ baseCurrency: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {state.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Backup & Privacy / Deletion */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-semibold">Резервне копіювання та приватність</h3>
            </div>

            <div>
              <label htmlFor="bk-pass" className="block text-xs text-slate-500 mb-1">
                Пароль шифрування резервної копії (AES-GCM, необов’язково)
              </label>
              <input
                id="bk-pass"
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder="Введіть пароль для шифрування/розшифрування"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Експорт резервної копії
              </button>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Відновити з файлу
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {backupStatus && (
              <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">{backupStatus}</p>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Керування та видалення даних
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => deleteCategoryData('ai')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  Очистити AI-пам’ять
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategoryData('history')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  Очистити історію
                </button>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Скинути всі локальні дані
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      deleteCategoryData('all');
                      setConfirmReset(false);
                      setBackupStatus('Усі локальні дані скинуто до початкового стану.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                  >
                    Підтвердити повне видалення
                  </button>
                )}
              </div>
            </div>
          </section>
          </div>
        </div>
      )}
    </div>
  );
}

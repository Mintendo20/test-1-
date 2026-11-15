import React, { useState } from 'react';
import { ArrowLeft, Brain, Lock, Plus, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import type { AIMemoryItem } from '../domain/types';

interface AiCoachScreenProps {
  onBack: () => void;
}

export function AiCoachScreen({ onBack }: AiCoachScreenProps) {
  const {
    state,
    sendAiMessage,
    addAiMemory,
    deleteAiMemory,
    resolveAiProposal,
    updateSettings,
  } = useLifeOS();

  const [promptInput, setPromptInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newMemText, setNewMemText] = useState('');
  const [newMemCat, setNewMemCat] = useState<AIMemoryItem['category']>('goal');
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);

  const coachMessages = state.aiInteractions.filter((m) => m.module === 'coach');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || sending) return;
    const text = promptInput.trim();
    setPromptInput('');
    setSending(true);
    try {
      await sendAiMessage('coach', text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <div>
            <h1 className="text-base font-bold">Персональний AI-коуч</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Гібридний режим: {state.settings.aiExternalEnabled ? 'Локально + Зовнішній AI' : 'Лише локальний режим'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            updateSettings({ aiExternalEnabled: !state.settings.aiExternalEnabled })
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium whitespace-nowrap"
        >
          {state.settings.aiExternalEnabled ? 'Вимкнути зовнішній AI' : 'Увімкнути зовнішній AI'}
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat & Guidance Column */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[520px] max-h-[78vh]">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Діалог і стратегія Kaizen</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Запитів сьогодні: {state.settings.aiRequestsUsedToday}/{state.settings.aiDailyRequestLimit}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {coachMessages.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Вітаю, {state.settings.userName}! Це ваш особистий AI-коуч. Поставте запитання про планування дня, цілі Kaizen, фінанси чи баланс — відповідь спиратиметься лише на ваші реальні дані та обрані дозволи приватності.
              </div>
            ) : (
              coachMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {msg.role === 'user' ? 'Ви' : msg.source === 'gemini' ? 'Зовнішній AI' : 'Локальний аналіз'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {[
              'Склади оптимальний фокус на сьогодні',
              'Проаналізуй мої витрати та заощадження',
              'Як збалансувати роботу і відпочинок?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPromptInput(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Запитайте коуча про цілі, час або рішення..."
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Аналіз...' : 'Надіслати'}
            </button>
          </form>
        </section>

        {/* Right Column: Proposals with confirmation + Structured Memory + Privacy Scopes */}
        <div className="lg:col-span-5 space-y-5">
          {/* Proposals */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-semibold">Пропозиції та автономні дії</h2>
            {state.aiProposals.filter((p) => p.status === 'pending').length === 0 ? (
              <p className="text-xs text-slate-500">Усі поточні рекомендації опрацьовано.</p>
            ) : (
              <div className="space-y-3">
                {state.aiProposals
                  .filter((p) => p.status === 'pending')
                  .map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        {prop.requiresConfirmation && (
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-semibold">{prop.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {prop.reason}
                          </p>
                        </div>
                      </div>

                      {pendingConfirmId === prop.id ? (
                        <div className="pt-1 space-y-2">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            Ця зміна впливає на пріоритети цілей. Підтвердити?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                resolveAiProposal(prop.id, true);
                                setPendingConfirmId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                            >
                              Так, підтвердити
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingConfirmId(null)}
                              className="px-3 py-1.5 text-xs text-slate-500"
                            >
                              Скасувати
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (prop.requiresConfirmation) setPendingConfirmId(prop.id);
                              else resolveAiProposal(prop.id, true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                          >
                            {prop.requiresConfirmation ? 'Перевірити та підтвердити' : 'Застосувати'}
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveAiProposal(prop.id, false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            Відхилити
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Structured AI Memory */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Структурована пам’ять AI</h2>
              <span className="text-xs text-slate-500">{state.aiMemory.length} фактів</span>
            </div>

            <div className="flex gap-2">
              <select
                value={newMemCat}
                onChange={(e) => setNewMemCat(e.target.value as AIMemoryItem['category'])}
                className="px-2 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="goal">Ціль</option>
                <option value="pattern">Патерн</option>
                <option value="habit">Звичка</option>
                <option value="decision">Рішення</option>
              </select>
              <input
                type="text"
                value={newMemText}
                onChange={(e) => setNewMemText(e.target.value)}
                placeholder="Додати важливий факт..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newMemText.trim()) return;
                  addAiMemory(newMemCat, newMemText.trim());
                  setNewMemText('');
                }}
                aria-label="Додати факт у пам'ять AI"
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
              {state.aiMemory.map((m) => (
                <li key={m.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{m.category}</span>
                    <span className="text-slate-600 dark:text-slate-300"> · {m.summary}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAiMemory(m.id)}
                    aria-label={`Видалити запис пам'яті ${m.summary}`}
                    className="text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Context Privacy Permissions */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Дозволений контекст для AI</span>
            </div>
            <p className="text-xs text-slate-500">
              Перед запитом формується лише мінімальний контекст із вибраних модулів.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              {(
                [
                  ['goals', 'Цілі Kaizen'],
                  ['tasks', 'Завдання'],
                  ['time', 'Час'],
                  ['financesSummary', 'Зведені фінанси'],
                  ['learning', 'Навчання'],
                  ['socialContacts', 'Контакти'],
                  ['privateNotes', 'Приватні нотатки'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.settings.aiPermittedScopes[key]}
                    onChange={(e) =>
                      updateSettings({
                        aiPermittedScopes: {
                          ...state.settings.aiPermittedScopes,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/60 whitespace-nowrap shrink-0 min-h-[36px]"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? 'Встановити' : 'Встановити додаток'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0 min-h-[36px]"
      >
        <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>{compact ? 'На телефон' : isIOS ? 'На iPhone' : 'На телефон'}</span>
      </button>

      {showGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl my-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-bold text-slate-900 dark:text-slate-50">
                    Встановлення на смартфон (PWA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Працює як окремий застосунок та зберігає ваші дані офлайн.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Закрити інструкцію"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Android (Google Chrome / Edge / Samsung Internet)
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Відкрийте цей сайт безпосередньо в Chrome на телефоні (не у вбудованому вікні месенджера).</li>
                    <li>Натисніть меню браузера <strong>⋮</strong> → <strong>«Встановити застосунок»</strong> (або «Додати на головний екран»).</li>
                    <li>Іконка <strong>Life OS</strong> з’явиться на екрані та запускатиметься без рамки браузера й без інтернету.</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                    iPhone / iPad (Safari) <Share className="w-3.5 h-3.5 text-teal-600" />
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Відкрийте сторінку в браузері <strong>Safari</strong>.</li>
                    <li>Натисніть кнопку <strong>«Поділитися»</strong> на нижній панелі.</li>
                    <li>Оберіть <strong>«На екран “Додому”»</strong> → <strong>«Додати»</strong>.</li>
                  </ol>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                Зрозуміло
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function PWAInstallSettingsCard() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-base font-semibold">Встановлення на телефон (PWA)</h3>
        </div>
        {isInstalled && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Встановлено
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Personal Life OS побудований як Progressive Web App: встановлюється на головний екран Android або iPhone без магазинів застосунків, відкривається на весь екран і працює офлайн із локальним збереженням даних.
      </p>

      {isInstallable ? (
        <button
          type="button"
          onClick={promptInstall}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          Встановити на цей пристрій зараз
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Android (Chrome)</p>
            <p>Меню ⋮ → «Встановити застосунок» або «Додати на головний екран».</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">iPhone (Safari)</p>
            <p>Кнопка «Поділитися» → «На екран “Додому”» → «Додати».</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function OfflineNotice() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        Офлайн-режим: усі ваші цілі, завдання, таймер і фінанси працюють локально на пристрої.
      </span>
    </div>
  );
}

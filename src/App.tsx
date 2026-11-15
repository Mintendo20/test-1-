import React, { useState } from 'react';
import {
  Brain,
  Clock,
  Gamepad2,
  Home,
  Moon,
  Sun,
  Target,
  User,
  Wallet,
} from 'lucide-react';
import { LifeOSProvider, useLifeOS } from './state/LifeOSContext';
import { DashboardView } from './components/DashboardView';
import { KaizenGoalsView } from './components/KaizenGoalsView';
import { TimeTrackerView } from './components/TimeTrackerView';
import { FinancesView } from './components/FinancesView';
import { ProfileHubView } from './components/ProfileHubView';
import { AiCoachScreen } from './components/AiCoachScreen';
import { LifeWorldScreen } from './components/LifeWorldScreen';
import { OnboardingView } from './components/OnboardingView';
import { OfflineNotice, PWAInstallButton } from './components/PWAInstallButton';

type MainTab = 'home' | 'goals' | 'time' | 'finance' | 'profile';
type FullScreenOverlay = 'none' | 'ai_coach' | 'life_world';

function LifeOSShell() {
  const { state, setTheme } = useLifeOS();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [overlay, setOverlay] = useState<FullScreenOverlay>('none');

  if (state.settings.onboardingCompleted === false) {
    return (
      <>
        <OfflineNotice />
        <OnboardingView />
      </>
    );
  }

  if (overlay === 'ai_coach') {
    return <AiCoachScreen onBack={() => setOverlay('none')} />;
  }

  if (overlay === 'life_world') {
    return <LifeWorldScreen onBack={() => setOverlay('none')} />;
  }

  const navItems: Array<{
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: 'Головна', icon: Home },
    { id: 'goals', label: 'Цілі', icon: Target },
    { id: 'time', label: 'Час', icon: Clock },
    { id: 'finance', label: 'Фінанси', icon: Wallet },
    { id: 'profile', label: 'Профіль', icon: User },
  ];

  const isDark =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          <div>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">
              Personal Life OS
            </span>
          </div>

          <nav aria-label="Головна навігація" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <p className="px-3 text-xs font-medium text-slate-400">Окремі простори</p>
            <button
              type="button"
              onClick={() => setOverlay('ai_coach')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 whitespace-nowrap"
            >
              <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>AI-коуч</span>
            </button>
            <button
              type="button"
              onClick={() => setOverlay('life_world')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Ігровий світ</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Local-First</span>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <OfflineNotice />
        {/* Compact Top Bar (<= 48px on mobile so sticky top+bottom <= 15% of 844px) */}
        <header className="sticky top-0 z-30 h-12 lg:h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <span className="sm:hidden text-base font-bold font-display whitespace-nowrap">
            Life OS
          </span>
          <span className="hidden sm:inline lg:hidden text-base font-bold font-display truncate">
            Personal Life OS
          </span>
          <span className="hidden lg:inline text-sm font-semibold text-slate-700 dark:text-slate-200">
            {navItems.find((n) => n.id === activeTab)?.label}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Перемкнути тему"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOverlay('ai_coach')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              AI-коуч
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'home' && (
            <DashboardView
              onNavigateTab={setActiveTab}
              onOpenAiCoach={() => setOverlay('ai_coach')}
              onOpenLifeWorld={() => setOverlay('life_world')}
            />
          )}
          {activeTab === 'goals' && <KaizenGoalsView />}
          {activeTab === 'time' && <TimeTrackerView />}
          {activeTab === 'finance' && <FinancesView />}
          {activeTab === 'profile' && (
            <ProfileHubView
              onOpenAiCoach={() => setOverlay('ai_coach')}
              onOpenLifeWorld={() => setOverlay('life_world')}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 core tabs per §4) */}
      <nav
        aria-label="Мобільна навігація"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                active
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <LifeOSProvider>
      <LifeOSShell />
    </LifeOSProvider>
  );
}

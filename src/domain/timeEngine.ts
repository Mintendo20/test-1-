import type {
  ActiveTimerState,
  Project,
  TimeCategory,
  TimeEntry,
} from './types';
import { calculateProjectMetrics } from './financeMath';

/**
 * Computes exact elapsed milliseconds for an active timer using persisted timestamps (§8.2).
 * Survives app restarts, tab closes, and screen locks without relying on continuous intervals.
 */
export function getElapsedTimerMs(timer: ActiveTimerState, nowMs: number = Date.now()): number {
  if (timer.status === 'idle') return 0;
  if (timer.status === 'paused' || timer.lastResumedAtMs === null) {
    return Math.max(0, timer.accumulatedMs);
  }
  return Math.max(0, timer.accumulatedMs + Math.max(0, nowMs - timer.lastResumedAtMs));
}

export function formatDurationHms(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatMinutesHuman(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} хв`;
  if (m === 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  minutes: number;
  percentageOfDay: number;
  isRestOrSleep: boolean;
}

/**
 * Resolves the root top-level category for any category or subcategory.
 */
export function getRootCategory(
  categoryId: string,
  categories: TimeCategory[],
): TimeCategory | undefined {
  let current = categories.find((c) => c.id === categoryId);
  let guard = 0;
  while (current?.parentId && guard < 10) {
    const parent = categories.find((c) => c.id === current!.parentId);
    if (!parent) break;
    current = parent;
    guard++;
  }
  return current;
}

export function compute24hDistribution(
  entries: TimeEntry[],
  categories: TimeCategory[],
  dateIso?: string,
): {
  items: CategoryBreakdownItem[];
  totalTrackedMinutes: number;
  untrackedMinutes: number;
} {
  const filtered = dateIso
    ? entries.filter((e) => e.startTime.slice(0, 10) === dateIso)
    : entries;

  const byRoot = new Map<string, number>();
  for (const entry of filtered) {
    const root = getRootCategory(entry.categoryId, categories);
    const rootId = root?.id ?? entry.categoryId;
    byRoot.set(rootId, (byRoot.get(rootId) ?? 0) + entry.durationMs / 60000);
  }

  const items: CategoryBreakdownItem[] = [];
  let totalTrackedMinutes = 0;

  for (const [rootId, mins] of byRoot.entries()) {
    const rounded = Math.round(mins);
    if (rounded <= 0) continue;
    totalTrackedMinutes += rounded;
    const cat = categories.find((c) => c.id === rootId);
    items.push({
      categoryId: rootId,
      name: cat?.name ?? 'Інше',
      color: cat?.color ?? '#64748B',
      minutes: rounded,
      percentageOfDay: Math.min(100, Math.round((rounded / 1440) * 1000) / 10),
      isRestOrSleep: Boolean(cat?.isRestOrSleep),
    });
  }

  items.sort((a, b) => b.minutes - a.minutes);
  const untrackedMinutes = Math.max(0, 1440 - totalTrackedMinutes);

  return {
    items,
    totalTrackedMinutes,
    untrackedMinutes,
  };
}

export interface ProjectProfitabilityRow {
  projectId: string;
  projectName: string;
  client: string;
  currency: string;
  trackedHours: number;
  receivedMinor: number;
  earnedByWorkMinor: number;
  hourlyReceivedMinor: number;
  hourlyEarnedMinor: number;
}

export function computeProjectProfitability(
  projects: Project[],
  timeEntries: TimeEntry[],
): ProjectProfitabilityRow[] {
  return projects.map((project) => {
    const metrics = calculateProjectMetrics(project, timeEntries);
    return {
      projectId: project.id,
      projectName: project.name,
      client: project.client,
      currency: project.currency,
      trackedHours: Math.round((metrics.trackedMinutes / 60) * 10) / 10,
      receivedMinor: metrics.receivedMinor,
      earnedByWorkMinor: metrics.earnedByWorkMinor,
      hourlyReceivedMinor: metrics.effectiveHourlyReceivedMinor,
      hourlyEarnedMinor: metrics.effectiveHourlyEarnedMinor,
    };
  });
}

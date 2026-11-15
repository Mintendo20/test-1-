export type KaizenDirectionId =
  | 'finance_career'
  | 'health_fitness'
  | 'learning_intellect'
  | 'discipline_habits'
  | 'social_life'
  | 'rest_balance';

export type PriorityLevel = 'high' | 'medium' | 'low';
export type GoalHorizon = 'long' | 'medium' | 'weekly';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deferred';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface DirectionMeta {
  id: KaizenDirectionId;
  title: string;
  shortTitle: string;
  description: string;
  characterStatKey: keyof CharacterStats;
}

export const KAIZEN_DIRECTIONS: DirectionMeta[] = [
  {
    id: 'finance_career',
    title: 'Фінанси та кар’єра',
    shortTitle: 'Кар’єра',
    description: 'Дохід, проєкти, заощадження та професійний розвиток',
    characterStatKey: 'career',
  },
  {
    id: 'health_fitness',
    title: 'Здоров’я та фізична форма',
    shortTitle: 'Здоров’я',
    description: 'Тренування, фізичні показники, витривалість',
    characterStatKey: 'physical',
  },
  {
    id: 'learning_intellect',
    title: 'Навчання та інтелект',
    shortTitle: 'Навчання',
    description: 'Курси, теми, практика, перевірка знань',
    characterStatKey: 'intellect',
  },
  {
    id: 'discipline_habits',
    title: 'Дисципліна та звички',
    shortTitle: 'Дисципліна',
    description: 'Регулярність, цифрова гігієна, фокус',
    characterStatKey: 'discipline',
  },
  {
    id: 'social_life',
    title: 'Соціальне життя та стосунки',
    shortTitle: 'Соціум',
    description: 'Зустрічі, контакти, комунікація та підтримка',
    characterStatKey: 'social',
  },
  {
    id: 'rest_balance',
    title: 'Відпочинок та особистий баланс',
    shortTitle: 'Баланс',
    description: 'Сон, відновлення, усвідомлений відпочинок без провини',
    characterStatKey: 'balance',
  },
];

export interface UserSettings {
  userName: string;
  onboardingCompleted?: boolean;
  theme: ThemeMode;
  baseCurrency: string;
  pinEnabled: boolean;
  pinHash?: string;
  activeDirections: KaizenDirectionId[];
  directionWeights: Record<KaizenDirectionId, number>;
  aiExternalEnabled: boolean;
  aiDailyRequestLimit: number;
  aiRequestsUsedToday: number;
  aiPermittedScopes: {
    goals: boolean;
    tasks: boolean;
    time: boolean;
    financesSummary: boolean;
    financesFullLedger: boolean;
    health: boolean;
    learning: boolean;
    socialContacts: boolean;
    privateNotes: boolean;
  };
  reminderSettings: {
    frequency: 'low' | 'balanced' | 'active';
    quietHoursStart: string;
    quietHoursEnd: string;
    mutedCategories: string[];
  };
  historyRetention: {
    goals: boolean;
    tasks: boolean;
    finances: boolean;
    time: boolean;
    health: boolean;
    learning: boolean;
    social: boolean;
    game: boolean;
    ai: boolean;
  };
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  parentGoalId?: string | null;
  title: string;
  description: string;
  direction: KaizenDirectionId;
  horizon: GoalHorizon;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: GoalStatus;
  milestones: GoalMilestone[];
}

export interface Task {
  id: string;
  goalId?: string | null;
  direction: KaizenDirectionId;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimatedMinutes: number;
  actualMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  deadline?: string;
  status: TaskStatus;
  resultNote?: string;
  difficultyNote?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: 'task' | 'event' | 'deadline' | 'reminder' | 'workout' | 'learning' | 'work' | 'rest';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  linkedTaskId?: string | null;
  linkedGoalId?: string | null;
  notes?: string;
}

export interface TimeCategory {
  id: string;
  parentId?: string | null;
  name: string;
  color: string;
  isRestOrSleep: boolean;
  isCustom?: boolean;
}

export interface TimeEntry {
  id: string;
  categoryId: string;
  subcategoryName?: string;
  taskId?: string | null;
  projectId?: string | null;
  note: string;
  startTime: string; // ISO
  endTime: string; // ISO
  durationMs: number;
  isBillable?: boolean;
}

export interface ActiveTimerState {
  id: string;
  categoryId: string;
  taskId?: string | null;
  projectId?: string | null;
  note: string;
  status: 'idle' | 'running' | 'paused';
  startedAtMs: number | null;
  lastResumedAtMs: number | null;
  accumulatedMs: number;
}

export type AccountType = 'cash' | 'card' | 'bank' | 'ewallet' | 'savings' | 'other';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  isCustom?: boolean;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number; // e.g., 41.5 UAH per 1 USD
  effectiveDate: string; // YYYY-MM-DD
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalanceMinor: number;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  exchangeRateApplied: number; // rate to baseCurrency at date
  accountId: string;
  toAccountId?: string | null; // only for transfer
  category: string;
  subcategory?: string;
  sourceOrPayee?: string;
  projectId?: string | null;
  date: string; // YYYY-MM-DD
  comment: string;
  isRecurring?: boolean;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface ProjectPayment {
  id: string;
  amountMinor: number;
  date: string;
  accountId: string;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  currency: string;
  totalValueMinor: number;
  completionPct: number; // 0-100 work done
  accruedMinor: number; // invoiced / earned accrued
  status: ProjectStatus;
  payments: ProjectPayment[];
  createdAt: string;
  updatedAt: string;
}

export type DebtType = 'personal_owe' | 'personal_owed_to_me' | 'bank_loan' | 'installment';

export interface DebtPayment {
  id: string;
  amountMinor: number;
  date: string;
  isEarlyRepayment: boolean;
  note: string;
}

export interface Debt {
  id: string;
  title: string;
  type: DebtType;
  principalMinor: number;
  remainingMinor: number;
  currency: string;
  interestRateAnnual: number;
  createdDate: string;
  dueDate: string;
  monthlyPaymentMinor: number;
  payments: DebtPayment[];
}

export interface Budget {
  id: string;
  category: string;
  limitMinor: number;
  currency: string;
  month: string; // YYYY-MM
}

export interface SavingsTransaction {
  id: string;
  amountMinor: number;
  date: string;
  note: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  mode: 'simple' | 'fund';
  allocationLabel?: string;
  targetMinor: number;
  currentMinor: number;
  currency: string;
  deadline: string;
  regularContributionMinor: number;
  transactions: SavingsTransaction[];
}

export interface Workout {
  id: string;
  title: string;
  activityType: string;
  durationMinutes: number;
  date: string;
  intensity: 'low' | 'medium' | 'high';
  notes: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  restingHeartRate?: number;
  sleepHours?: number;
}

export interface LearningTopic {
  id: string;
  title: string;
  masteryPct: number; // 0-100
  completed: boolean;
  quizScore?: number;
  practiceDone: boolean;
}

export interface LearningCourse {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  hoursSpent: number;
  topics: LearningTopic[];
}

export interface SocialContact {
  id: string;
  name: string;
  relation: string;
  importantDate?: string;
  importantDateLabel?: string;
  privateNote: string;
  lastContactDate: string;
}

export interface SocialEvent {
  id: string;
  title: string;
  date: string;
  contactIds: string[];
  reflection: string;
  confidenceRating: number; // 1-5
}

export interface DigitalAppUsage {
  id: string;
  appName: string;
  category: 'productive' | 'neutral' | 'distracting';
  minutesToday: number;
  dailyLimitMinutes: number;
}

export interface DigitalHygieneState {
  mode: 'normal' | 'focus' | 'relax';
  focusEndTimestamp: number | null;
  focusSelectedApps: string[];
  scheduleStart: string;
  scheduleEnd: string;
  apps: DigitalAppUsage[];
}

export interface AIMemoryItem {
  id: string;
  category: 'goal' | 'achievement' | 'decision' | 'pattern' | 'finance' | 'habit';
  summary: string;
  createdAt: string;
  editable: boolean;
}

export interface AIProposal {
  id: string;
  title: string;
  reason: string;
  actionType: 'reorder_tasks' | 'create_task' | 'adjust_goal' | 'adjust_budget' | 'change_weights';
  requiresConfirmation: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  payload?: Record<string, unknown>;
}

export interface AIInteraction {
  id: string;
  role: 'user' | 'assistant';
  module: 'coach' | 'tutor' | 'social' | 'finance';
  content: string;
  timestamp: string;
  source: 'local' | 'gemini';
}

export interface LifeHistoryEntry {
  id: string;
  category: 'goals' | 'tasks' | 'finances' | 'time' | 'health' | 'learning' | 'social' | 'game' | 'ai';
  title: string;
  detail: string;
  timestamp: string;
}

export interface CharacterStats {
  career: number;
  physical: number;
  intellect: number;
  discipline: number;
  social: number;
  balance: number;
}

export interface CharacterState {
  name: string;
  skinTone: string;
  hairStyle: 'short' | 'wavy' | 'ponytail';
  hairColor: string;
  outfit: 'explorer' | 'minimal' | 'scholar' | 'athlete';
  outfitColor: string;
  xp: number;
  level: number;
  stats: CharacterStats;
}

export interface GameCurrency {
  coins: number;
  crystals: number;
}

export type IslandObjectKind = 'cottage' | 'library' | 'gym_pavilion' | 'garden_tree' | 'flower_bed' | 'lantern' | 'tea_house' | 'fountain';

export interface IslandObject {
  id: string;
  kind: IslandObjectKind;
  name: string;
  gridX: number; // 0..7
  gridY: number; // 0..7
  unlocked: boolean;
  costCoins: number;
  costCrystals: number;
  description: string;
}

export interface IslandTerritory {
  id: string;
  name: string;
  unlocked: boolean;
  costCoins: number;
  costCrystals: number;
  requiredLevel: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  direction: KaizenDirectionId;
  unlocked: boolean;
  unlockedAt?: string;
  rewardCoins: number;
  rewardCrystals: number;
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  encrypted: boolean;
  sha256: string;
  sizeBytes: number;
  destination: 'local_file' | 'gdrive_sim' | 'icloud_sim';
}

export interface LifeOSState {
  version: number;
  settings: UserSettings;
  goals: Goal[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  timeCategories: TimeCategory[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimerState;
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  accounts: Account[];
  transactions: Transaction[];
  projects: Project[];
  debts: Debt[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  workouts: Workout[];
  bodyMetrics: BodyMetric[];
  courses: LearningCourse[];
  contacts: SocialContact[];
  socialEvents: SocialEvent[];
  digitalHygiene: DigitalHygieneState;
  aiMemory: AIMemoryItem[];
  aiProposals: AIProposal[];
  aiInteractions: AIInteraction[];
  lifeHistory: LifeHistoryEntry[];
  character: CharacterState;
  gameCurrency: GameCurrency;
  islandObjects: IslandObject[];
  islandTerritories: IslandTerritory[];
  achievements: Achievement[];
  backupHistory: BackupRecord[];
}

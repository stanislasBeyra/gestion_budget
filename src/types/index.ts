// Types de base pour l'application de budget PWA

export type Currency = 'EUR' | 'USD' | 'XOF';
export type Language = 'fr' | 'en';
export type Theme = 'light' | 'dark';

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}

export interface UserPreferences {
  currency: Currency;
  language: Language;
  theme: Theme;
  notifications: boolean;
}

// Session Types
export interface Session {
  userId: string;
  sessionId: string;
  loginTime: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SessionData extends Session {}
export interface UserData extends User {}

export interface StorageData {
  users: User[];
  sessions: Session[];
  userData: Record<string, UserData>;
  settings: AppSettings;
  metadata: AppMetadata;
}

// Account Types
export type AccountType = 'main' | 'savings' | 'emergency';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  createdAt: Date;
  lastUpdated: Date;
}

// Savings Goal Types
export type Priority = 'low' | 'medium' | 'high';
export type TransferFrequency = 'weekly' | 'monthly';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: Priority;
  category: string;
  autoTransferAmount: number;
  autoTransferFrequency: TransferFrequency;
  isCompleted: boolean;
  createdAt: Date;
}

// Transaction Types
export type TransactionType = 'income' | 'expense' | 'transfer' | 'savings';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  fromAccount?: string;
  toAccount?: string;
  date: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
  receipt?: string; // URL vers reçu scanné
  location?: string; // Géolocalisation
  createdAt: Date;
}

// Budget Types
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface BudgetCategory {
  categoryId: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  categories: BudgetCategory[];
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  totalAllocated: number;
  totalSpent: number;
  createdAt: Date;
}

// Category Types
export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string; // pour sous-catégories
  budgetLimit?: number;
  isDefault: boolean;
  userId?: string; // null pour catégories par défaut
}

// LocalStorage Structure
export interface LocalStorageData {
  budget_app_v2: {
    users: User[];
    sessions: Session[];
    userData: Record<string, UserData>;
    settings: AppSettings;
    metadata: AppMetadata;
  };
}

export interface UserData {
  accounts: Account[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: Budget[];
  categories: Category[];
}

export interface AppSettings {
  appVersion: string;
  defaultCurrency: Currency;
  sessionTimeout: number; // en millisecondes
}

export interface AppMetadata {
  version: string;
  lastBackup: string;
  totalUsers: number;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface TransactionForm {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  fromAccount?: string;
  toAccount?: string;
  date: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
}

export interface SavingsGoalForm {
  name: string;
  description: string;
  targetAmount: number;
  targetDate: Date;
  priority: Priority;
  category: string;
  autoTransferAmount: number;
  autoTransferFrequency: TransferFrequency;
}

// Dashboard Types
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsProgress: number;
  budgetUsage: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// PWA Types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

// Hook Types
export interface UseLocalStorageReturn<T> {
  data: T | null;
  setData: (value: T) => void;
  removeData: () => void;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn {
  user: User | null;
  login: (credentials: LoginForm) => Promise<ApiResponse<User>>;
  register: (userData: RegisterForm) => Promise<ApiResponse<User>>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
import type { UserProfile } from "../auth/types";

export const expenseCategories = ["Home & bills", "Food & dining", "Transport", "Everything else"] as const;
export type ExpenseCategory = typeof expenseCategories[number];

export type ExpenseEntry = {
  id: string;
  item: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
};

export type MonthlyTransaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
};

export type TransactionCategory = "vehicle" | "rent";

export type BorrowingPayment = {
  id: string;
  amount: number;
  date: string;
};

export type BorrowingEntry = {
  id: string;
  name: string;
  amount: number;
  monthlyPayment: number;
  startDate: string;
  payments: BorrowingPayment[];
};

export type PlanCategory = "LIC" | "SIP" | "Savings";
export type ContributionFrequency = "Monthly" | "Quarterly" | "Yearly" | "Not specified";

export type PlanContribution = {
  id: string;
  amount: number;
  date: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  category: PlanCategory;
  contributionAmount: number;
  frequency: ContributionFrequency;
  startDate: string;
  contributions: PlanContribution[];
};

export type DashboardData = {
  expenses: ExpenseEntry[];
  vehicleTransactions: MonthlyTransaction[];
  rentTransactions: MonthlyTransaction[];
  borrowings: BorrowingEntry[];
  investmentPlans: InvestmentPlan[];
};

export type SpendingRecord = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
};

export type DashboardSummary = {
  income: number;
  spending: number;
  previousSpending: number;
  spendingChangePercent: number | null;
  savings: number;
  savingsTrendPath: string;
  investmentContributions: number;
  transactionCount: number;
  spendingRecords: SpendingRecord[];
  categoryBreakdown: { name: string; amount: number; color: string; percent: number }[];
  categoryGradient: string;
  dailySpending: number[];
  dailyScale: number[];
  miniBarHeights: number[];
  chartLinePoints: string;
  chartAreaPath: string;
  chartLastY: number;
  allocatedTotal: number;
  allocatedPercent: number;
  remainingAfterAllocation: number;
  vehicleTransactionCount: number;
  vehicleTotal: number;
  rentTransactionCount: number;
  rentTotal: number;
  borrowedTotal: number;
  paidTotal: number;
  repaymentTotal: number;
  activeBorrowingCount: number;
  monthlyPaymentTotal: number;
};

const emptyDashboardData: DashboardData = {
  expenses: [],
  vehicleTransactions: [],
  rentTransactions: [],
  borrowings: [],
  investmentPlans: [],
};

const categoryColors = ["mint", "coral", "gold", "blue"];
const storageVersion = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMoneyEntry(value: unknown): value is { id: string; amount: number; date: string } {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.amount === "number"
    && Number.isFinite(value.amount)
    && value.amount >= 0
    && typeof value.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value.date);
}

export function isDashboardData(value: unknown): value is DashboardData {
  if (!isRecord(value)) return false;
  const isMonthlyTransaction = (entry: unknown) => isRecord(entry)
    && typeof entry.name === "string"
    && isMoneyEntry(entry);
  const isExpense = (entry: unknown) => isRecord(entry)
    && typeof entry.item === "string"
    && expenseCategories.includes(entry.category as ExpenseCategory)
    && isMoneyEntry(entry);
  const isBorrowing = (entry: unknown) => isRecord(entry)
    && typeof entry.id === "string"
    && typeof entry.name === "string"
    && typeof entry.amount === "number"
    && Number.isFinite(entry.amount)
    && typeof entry.monthlyPayment === "number"
    && typeof entry.startDate === "string"
    && Array.isArray(entry.payments)
    && entry.payments.every(isMoneyEntry);
  const isPlan = (entry: unknown) => isRecord(entry)
    && typeof entry.id === "string"
    && typeof entry.name === "string"
    && ["LIC", "SIP", "Savings"].includes(String(entry.category))
    && typeof entry.contributionAmount === "number"
    && ["Monthly", "Quarterly", "Yearly", "Not specified"].includes(String(entry.frequency))
    && typeof entry.startDate === "string"
    && Array.isArray(entry.contributions)
    && entry.contributions.every(isMoneyEntry);

  return Array.isArray(value.expenses) && value.expenses.every(isExpense)
    && Array.isArray(value.vehicleTransactions) && value.vehicleTransactions.every(isMonthlyTransaction)
    && Array.isArray(value.rentTransactions) && value.rentTransactions.every(isMonthlyTransaction)
    && Array.isArray(value.borrowings) && value.borrowings.every(isBorrowing)
    && Array.isArray(value.investmentPlans) && value.investmentPlans.every(isPlan);
}

function readStoredData(value: string | null): DashboardData {
  if (!value) return emptyDashboardData;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== storageVersion || !isDashboardData(parsed.data)) {
      return emptyDashboardData;
    }
    return parsed.data;
  } catch {
    return emptyDashboardData;
  }
}

export function readBrowserDashboardData(key: string): DashboardData {
  try {
    return readStoredData(window.localStorage.getItem(key));
  } catch {
    return emptyDashboardData;
  }
}

export function createDashboardStorageKey(profileId: string) {
  return `morrow-dashboard-v1:${encodeURIComponent(profileId)}`;
}

export function createDashboardId(prefix: string) {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export interface DashboardRepository {
  getSnapshot(key: string): DashboardData;
  subscribe(key: string, listener: () => void): () => void;
  update(key: string, update: (current: DashboardData) => DashboardData): void;
}

export class BrowserDashboardRepository implements DashboardRepository {
  private readonly snapshots = new Map<string, DashboardData>();
  private readonly listeners = new Map<string, Set<() => void>>();

  getSnapshot(key: string) {
    const cached = this.snapshots.get(key);
    if (cached) return cached;

    let snapshot: DashboardData;
    try {
      snapshot = readStoredData(window.localStorage.getItem(key));
    } catch {
      snapshot = emptyDashboardData;
    }
    this.snapshots.set(key, snapshot);
    return snapshot;
  }

  subscribe(key: string, listener: () => void) {
    const subscribers = this.listeners.get(key) ?? new Set<() => void>();
    subscribers.add(listener);
    this.listeners.set(key, subscribers);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      let storedValue = event.newValue;
      if (event.key === null) {
        try {
          storedValue = window.localStorage.getItem(key);
        } catch {
          storedValue = null;
        }
      }
      this.snapshots.set(key, readStoredData(storedValue));
      this.notify(key);
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      subscribers.delete(listener);
      if (subscribers.size === 0) this.listeners.delete(key);
    };
  }

  update(key: string, update: (current: DashboardData) => DashboardData) {
    const next = update(this.getSnapshot(key));
    this.snapshots.set(key, next);
    try {
      window.localStorage.setItem(key, JSON.stringify({ version: storageVersion, data: next }));
    } catch (error) {
      console.error("Unable to persist dashboard data in browser storage.", error);
    }
    this.notify(key);
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((listener) => listener());
  }
}

export const dashboardRepository: DashboardRepository = new BrowserDashboardRepository();

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getRecordsForMonth(data: DashboardData, year: number, month: number): SpendingRecord[] {
  const monthKey = getMonthKey(year, month);
  const records: SpendingRecord[] = [
    ...data.expenses.map((expense) => ({
      id: expense.id,
      name: expense.item,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
    })),
    ...data.vehicleTransactions.map((transaction) => ({ ...transaction, category: "Vehicle maintenance" })),
    ...data.rentTransactions.map((transaction) => ({ ...transaction, category: "Rent" })),
    ...data.borrowings.flatMap((borrowing) => borrowing.payments.map((payment) => ({
      id: payment.id,
      name: borrowing.name,
      amount: payment.amount,
      date: payment.date,
      category: "Debt repayment",
    }))),
  ];
  return records.filter((record) => record.date.startsWith(monthKey));
}

function getContributionsForMonth(data: DashboardData, year: number, month: number) {
  const monthKey = getMonthKey(year, month);
  return data.investmentPlans.flatMap((plan) => plan.contributions
    .filter((contribution) => contribution.date.startsWith(monthKey))
    .map((contribution) => ({ ...contribution, category: plan.category })));
}

export function calculateDashboardSummary(
  data: DashboardData,
  profile: UserProfile,
  year: number,
  month: number,
): DashboardSummary {
  const spendingRecords = getRecordsForMonth(data, year, month).sort((first, second) => second.date.localeCompare(first.date));
  const spending = spendingRecords.reduce((total, record) => total + record.amount, 0);
  const previousDate = new Date(year, month - 1, 1);
  const previousRecords = getRecordsForMonth(data, previousDate.getFullYear(), previousDate.getMonth());
  const previousSpending = previousRecords.reduce((total, record) => total + record.amount, 0);
  const monthKey = getMonthKey(year, month);
  const income = Math.max(0, Number(profile.monthlyIncome) || 0)
    + (profile.additionalIncomes ?? []).reduce((total, entry) => total + (entry.month === monthKey ? entry.amount : 0), 0);
  const contributions = getContributionsForMonth(data, year, month);
  const savings = contributions.reduce((total, contribution) => total + (contribution.category === "Savings" ? contribution.amount : 0), 0);
  const savingsTrendValues = Array.from({ length: 6 }, (_, index) => {
    const trendDate = new Date(year, month - 5 + index, 1);
    return getContributionsForMonth(data, trendDate.getFullYear(), trendDate.getMonth())
      .reduce((total, contribution) => total + (contribution.category === "Savings" ? contribution.amount : 0), 0);
  });
  const maxSavingsInTrend = Math.max(...savingsTrendValues, 0);
  const savingsTrendPath = savingsTrendValues.map((amount, index) => {
    const x = (index / (savingsTrendValues.length - 1)) * 149 + 1;
    const y = maxSavingsInTrend === 0 ? 24 : 24 - (amount / maxSavingsInTrend) * 20;
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  const investmentContributions = contributions.reduce((total, contribution) => total + contribution.amount, 0);
  const categoryTotals = new Map<string, number>();
  spendingRecords.forEach((record) => categoryTotals.set(record.category, (categoryTotals.get(record.category) ?? 0) + record.amount));
  const categoryTotal = [...categoryTotals.values()].reduce((total, amount) => total + amount, 0);
  const categoryBreakdown = [...categoryTotals.entries()]
    .sort((first, second) => second[1] - first[1])
    .map(([name, amount], index) => ({
      name,
      amount,
      color: categoryColors[index % categoryColors.length],
      percent: categoryTotal === 0 ? 0 : (amount / categoryTotal) * 100,
    }));
  const chartColors: Record<string, string> = {
    mint: "var(--mint)",
    coral: "var(--coral)",
    gold: "var(--gold)",
    blue: "var(--blue)",
  };
  let categoryOffset = 0;
  const categoryGradient = categoryBreakdown.length === 0
    ? "#2b3b54"
    : `conic-gradient(${categoryBreakdown.map((category) => {
      const start = categoryOffset;
      categoryOffset += category.percent;
      return `${chartColors[category.color]} ${start}% ${categoryOffset}%`;
    }).join(", ")})`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailySpending = Array.from({ length: daysInMonth }, (_, day) => spendingRecords
    .filter((record) => Number(record.date.slice(8, 10)) === day + 1)
    .reduce((total, record) => total + record.amount, 0));
  const maxDailySpending = Math.max(...dailySpending, 0);
  const miniBarHeights = Array.from({ length: 12 }, (_, index) => {
    const start = Math.floor(index * daysInMonth / 12);
    const end = Math.floor((index + 1) * daysInMonth / 12);
    const amount = dailySpending.slice(start, Math.max(start + 1, end)).reduce((total, value) => total + value, 0);
    return maxDailySpending === 0 ? 0 : Math.round((amount / maxDailySpending) * 100);
  });
  const chartLinePoints = dailySpending.map((amount, index) => {
    const x = daysInMonth === 1 ? 300 : (index / (daysInMonth - 1)) * 600;
    const y = maxDailySpending === 0 ? 150 : 150 - (amount / maxDailySpending) * 125;
    return `${x},${y}`;
  }).join(" ");
  const chartAreaPath = `M0 170 L${chartLinePoints.replaceAll(" ", " L")} L600 170 Z`;
  const chartLastY = maxDailySpending === 0 ? 150 : 150 - (dailySpending.at(-1)! / maxDailySpending) * 125;
  const dailyScale = [1, 0.75, 0.5, 0.25, 0].map((factor) => maxDailySpending * factor);
  const selectedMonthKey = monthKey;
  const vehicleTransactions = data.vehicleTransactions.filter((transaction) => transaction.date.startsWith(selectedMonthKey));
  const rentTransactions = data.rentTransactions.filter((transaction) => transaction.date.startsWith(selectedMonthKey));
  const vehicleTotal = vehicleTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const rentTotal = rentTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const allocatedTotal = spending + investmentContributions;
  const borrowedTotal = data.borrowings.reduce((total, borrowing) => total + borrowing.amount, 0);
  const paidTotal = data.borrowings.reduce((total, borrowing) => total + borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0), 0);
  const repaymentTotal = data.borrowings.reduce((total, borrowing) => total + Math.max(0, borrowing.amount - borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0)), 0);

  return {
    income,
    spending,
    previousSpending,
    spendingChangePercent: previousSpending === 0 ? null : ((spending - previousSpending) / previousSpending) * 100,
    savings,
    savingsTrendPath,
    investmentContributions,
    transactionCount: spendingRecords.length,
    spendingRecords,
    categoryBreakdown,
    categoryGradient,
    dailySpending,
    dailyScale,
    miniBarHeights,
    chartLinePoints,
    chartAreaPath,
    chartLastY,
    allocatedTotal,
    allocatedPercent: income === 0 ? 0 : Math.round((allocatedTotal / income) * 100),
    remainingAfterAllocation: income - allocatedTotal,
    vehicleTransactionCount: vehicleTransactions.length,
    vehicleTotal,
    rentTransactionCount: rentTransactions.length,
    rentTotal,
    borrowedTotal,
    paidTotal,
    repaymentTotal,
    activeBorrowingCount: data.borrowings.filter((borrowing) => borrowing.amount > borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0)).length,
    monthlyPaymentTotal: data.borrowings.reduce((total, borrowing) => {
      const paid = borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return total + (borrowing.amount > paid ? borrowing.monthlyPayment : 0);
    }, 0),
  };
}
import { useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import { Brand } from "../../components/Brand";
import { normalizeMobile, type UserProfile } from "../auth/types";
import { AddExpensePage } from "./AddExpensePage";
import { BorrowingDetailsPage } from "./BorrowingDetailsPage";
import { InvestmentPlansPage } from "./InvestmentPlansPage";
import { MonthlyTransactionsPage } from "./MonthlyTransactionsPage";
import { RepaymentsPage } from "./RepaymentsPage";
import { SpendingDetailsPage } from "./SpendingDetailsPage";
import {
  calculateDashboardSummary,
  createDashboardId,
  createDashboardStorageKey,
  type BorrowingEntry,
  type BorrowingPayment,
  type DashboardData,
  type ExpenseEntry,
  type InvestmentPlan,
  type MonthlyTransaction,
  type PlanContribution,
  type TransactionCategory,
} from "./dashboardData";
import { dashboardRepository } from "./supabaseDashboardRepository";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const formatAmount = (amount: number) => amount.toLocaleString("en-IN");
const formatCurrency = (amount: number) => amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type DashboardPageProps = {
  profile: UserProfile;
  onOpenProfile: () => void;
};

export function DashboardPage({ profile, onOpenProfile }: DashboardPageProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const storageKey = createDashboardStorageKey(profile.id ?? normalizeMobile(profile.mobile));
  const data = useSyncExternalStore(
    (listener) => dashboardRepository.subscribe(storageKey, listener),
    () => dashboardRepository.getSnapshot(storageKey),
  );
  const [activeNavigation, setActiveNavigation] = useState("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSpendingDetails, setShowSpendingDetails] = useState(false);
  const [showRepayments, setShowRepayments] = useState(false);
  const [showInvestmentPlans, setShowInvestmentPlans] = useState(false);
  const [activeTransactionCategory, setActiveTransactionCategory] = useState<TransactionCategory | null>(null);
  const [selectedBorrowingId, setSelectedBorrowingId] = useState<string | null>(null);
  const { vehicleTransactions, rentTransactions, borrowings, investmentPlans } = data;
  const summary = calculateDashboardSummary(data, profile, selectedYear, selectedMonth);
  const periodExpenses = summary.spendingRecords;
  const spent = summary.spending;
  const previousDate = new Date(selectedYear, selectedMonth - 1, 1);
  const previousMonth = previousDate.getMonth();
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
  const currentMonthLabel = new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function navigate(event: MouseEvent<HTMLAnchorElement>, destination: string) {
    setActiveNavigation(destination);
    if (window.matchMedia("(max-width: 560px)").matches) {
      event.preventDefault();
      window.scrollTo(0, 0);
    }
  }

  function updateData(update: (current: DashboardData) => DashboardData) {
    dashboardRepository.update(storageKey, update);
  }

  function addExpense(expense: Omit<ExpenseEntry, "id">) {
    updateData((current) => ({ ...current, expenses: [{ ...expense, id: createDashboardId("expense") }, ...current.expenses] }));
    setShowAddExpense(false);
    setActiveNavigation("overview");
  }

  function addBorrowing(borrowing: Omit<BorrowingEntry, "id" | "payments">) {
    updateData((current) => ({
      ...current,
      borrowings: [{ ...borrowing, id: createDashboardId("borrowing"), payments: [] }, ...current.borrowings],
    }));
  }

  function makePayment(borrowingId: string, payment: Omit<BorrowingPayment, "id">) {
    updateData((current) => ({
      ...current,
      borrowings: current.borrowings.map((borrowing) => {
        if (borrowing.id !== borrowingId) return borrowing;
        const paid = borrowing.payments.reduce((total, currentPayment) => total + currentPayment.amount, 0);
        const amount = Math.min(payment.amount, Math.max(0, borrowing.amount - paid));
        return amount > 0
          ? { ...borrowing, payments: [...borrowing.payments, { ...payment, amount, id: createDashboardId("payment") }] }
          : borrowing;
      }),
    }));
  }

  function addInvestmentPlan(plan: Omit<InvestmentPlan, "id" | "contributions">) {
    updateData((current) => ({
      ...current,
      investmentPlans: [{ ...plan, id: createDashboardId("plan"), contributions: [] }, ...current.investmentPlans],
    }));
  }

  function recordPlanContribution(planId: string, contribution: Omit<PlanContribution, "id">) {
    updateData((current) => ({
      ...current,
      investmentPlans: current.investmentPlans.map((plan) => plan.id === planId
        ? { ...plan, contributions: [...plan.contributions, { ...contribution, id: createDashboardId("contribution") }] }
        : plan),
    }));
  }

  function addMonthlyTransaction(category: TransactionCategory, transaction: Omit<MonthlyTransaction, "id">) {
    const entry = { ...transaction, id: createDashboardId(category) };
    updateData((current) => category === "vehicle"
      ? { ...current, vehicleTransactions: [entry, ...current.vehicleTransactions] }
      : { ...current, rentTransactions: [entry, ...current.rentTransactions] });
  }

  if (activeTransactionCategory) {
    const category = activeTransactionCategory;
    return (
      <MonthlyTransactionsPage
        category={category}
        transactions={category === "vehicle" ? vehicleTransactions : rentTransactions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onBack={() => setActiveTransactionCategory(null)}
        onAdd={(transaction) => addMonthlyTransaction(category, transaction)}
      />
    );
  }

  if (selectedBorrowingId) {
    const selectedBorrowing = borrowings.find((borrowing) => borrowing.id === selectedBorrowingId);
    if (selectedBorrowing) {
      return (
        <BorrowingDetailsPage
          borrowing={selectedBorrowing}
          onBack={() => { setSelectedBorrowingId(null); setShowRepayments(true); }}
          onMakePayment={(payment) => makePayment(selectedBorrowing.id, payment)}
        />
      );
    }
  }

  if (showRepayments) {
    return (
      <RepaymentsPage
        borrowings={borrowings}
        onBack={() => setShowRepayments(false)}
        onAdd={addBorrowing}
        onOpenBorrowing={setSelectedBorrowingId}
      />
    );
  }

  if (showInvestmentPlans) {
    return (
      <InvestmentPlansPage
        plans={investmentPlans}
        onBack={() => setShowInvestmentPlans(false)}
        onAddPlan={addInvestmentPlan}
        onRecordContribution={recordPlanContribution}
      />
    );
  }

  if (showAddExpense) {
    return (
      <AddExpensePage
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onCancel={() => setShowAddExpense(false)}
        onSubmit={addExpense}
      />
    );
  }

  if (showSpendingDetails) {
    const isCurrentPeriod = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const lastDay = isCurrentPeriod ? today.getDate() : new Date(selectedYear, selectedMonth + 1, 0).getDate();

    return (
      <SpendingDetailsPage
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        lastDay={lastDay}
        expenses={periodExpenses}
        onBack={() => setShowSpendingDetails(false)}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand label="Morrow home" />
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className={`nav-link ${activeNavigation === "overview" ? "active" : ""}`} href="#overview" onClick={(event) => navigate(event, "overview")}><span className="nav-icon">◫</span>Overview</a>
          <a className={`nav-link ${activeNavigation === "spending" ? "active" : ""}`} href="#spending" onClick={(event) => navigate(event, "spending")}><span className="nav-icon">↗</span>Spending</a>
          <a className={`nav-link ${activeNavigation === "borrowings" ? "active" : ""}`} href="#borrowings" onClick={(event) => navigate(event, "borrowings")}><span className="nav-icon">⇄</span>Borrowings</a>
          <a className={`nav-link ${activeNavigation === "budget" ? "active" : ""}`} href="#budget" onClick={(event) => navigate(event, "budget")}><span className="nav-icon">◷</span>My budget</a>
          <button className="add-expense-button mobile-add-expense" type="button" aria-label="Add expense" onClick={() => setShowAddExpense(true)}><span aria-hidden="true">+</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-icon">✳</span><p>Small steps today,<br /><strong>more freedom tomorrow.</strong></p></div>
          <button className="profile-button" type="button" onClick={onOpenProfile}>
            <span className="avatar">{profile.firstName[0]}{profile.lastName[0]}</span>
            <span className="profile-copy"><strong>{profile.firstName} {profile.lastName}</strong><small>Personal account</small></span>
            <span className="profile-menu">···</span>
          </button>
        </div>
      </aside>

      <main className="main-content" id="overview" data-view={activeNavigation}>
        <header className="topbar">
          <Brand className="mobile-brand" onClick={(event) => navigate(event, "overview")} />
          <div className="breadcrumb">Your space <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="today-label">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            <button className="add-expense-button desktop-add-expense" type="button" onClick={() => setShowAddExpense(true)}><span aria-hidden="true">+</span> Add expense</button>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span className="notification-dot" /></button>
            <button className="icon-button profile-header-button" type="button" aria-label="Manage profile" onClick={onOpenProfile}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg></button>
          </div>
        </header>

        <section className="welcome-banner" aria-label="Welcome">
          <div className="welcome-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR MONEY, IN A GOOD PLACE</div>
            <h1>A new way to<br />get <span>organized.</span></h1>
            <p>Welcome to a clearer view of your money, so you can organize life and make room for what matters next.</p>
            <a className="welcome-link" href="#spending">See where it goes <span>↗</span></a>
          </div>
          <div className="welcome-image" role="img" aria-label="Sunlight falling across a calm, thoughtfully arranged home"><div className="image-caption"><span>01 / 03</span><span>Make space for what matters</span></div></div>
          <div className="welcome-orbit" aria-hidden="true">↗</div>
        </section>

        <section className="overview-heading">
          <div><span className="section-kicker">YOUR OVERVIEW</span><h2>The numbers, made simple.</h2></div>
          <div className="date-filters" aria-label="Choose a reporting period">
            <label className="visually-hidden" htmlFor="month-filter">Month</label>
            <select id="month-filter" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>{monthNames.map((month, index) => <option value={index} key={month}>{month}</option>)}</select>
            <label className="visually-hidden" htmlFor="year-filter">Year</label>
            <select id="year-filter" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select>
            <span className="select-chevron" aria-hidden="true">⌄</span>
          </div>
        </section>

        <section className="summary-grid" aria-label={`${monthNames[selectedMonth]} ${selectedYear} account summary`}>
          <button className="summary-card spending-summary spending-summary-button" type="button" aria-label="View daily spending details" onClick={() => setShowSpendingDetails(true)}>
            <div className="card-topline"><span className="summary-icon icon-mint">↗</span><span className="comparison">{summary.spendingChangePercent === null ? "No prior records" : <><span>{summary.spendingChangePercent <= 0 ? "↘" : "↗"}</span> {Math.abs(summary.spendingChangePercent).toFixed(1)}%</>}</span></div>
            <p className="summary-label">TOTAL SPENT</p><div className="summary-value">₹{formatCurrency(spent)}</div>
            <p className="summary-foot">vs. ₹{formatCurrency(summary.previousSpending)} last month</p>
            <div className="mini-bars" aria-hidden="true">{summary.miniBarHeights.map((height, index) => <span key={index} style={{ "--bar-height": `${height}%` } as CSSProperties} />)}</div>
          </button>
          <button className="summary-card borrowing-summary borrowing-summary-button" id="borrowings" type="button" aria-label="View repayments" onClick={() => setShowRepayments(true)}>
            <div className="card-topline borrowing-card-topline"><span className="summary-icon icon-coral">⇄</span><span className="loan-original-total"><small>ORIGINAL BORROWED</small><strong>₹{formatCurrency(summary.borrowedTotal)}</strong></span></div>
            <p className="summary-label">MONEY TO PAY BACK</p><div className="summary-value">₹{formatCurrency(summary.repaymentTotal)}</div>
            <p className="summary-foot">Across {summary.activeBorrowingCount} active {summary.activeBorrowingCount === 1 ? "borrowing" : "borrowings"} <span className="foot-separator">·</span> {summary.monthlyPaymentTotal > 0 ? `₹${formatCurrency(summary.monthlyPaymentTotal)} monthly plan` : "Payments tracked below"}</p><div className="repayment-track" aria-label="Borrowings repayment progress"><span style={{ width: `${summary.borrowedTotal ? Math.min(100, (summary.paidTotal / summary.borrowedTotal) * 100) : 0}%` }} /></div>
          </button>
          <button className="summary-card saved-summary spending-summary-button" type="button" aria-label="View savings contributions" onClick={() => setShowInvestmentPlans(true)}>
            <div className="card-topline"><span className="summary-icon icon-gold">✳</span><span className="comparison positive">Recorded</span></div>
            <p className="summary-label">SAVED THIS MONTH</p><div className="summary-value">₹{formatCurrency(summary.savings)}</div>
            <p className="summary-foot">Contributions to savings plans</p><div className="savings-spark" aria-hidden="true"><svg viewBox="0 0 150 28" preserveAspectRatio="none"><path d={summary.savingsTrendPath} /></svg></div>
          </button>
          <button className="summary-card transaction-summary spending-summary-button" type="button" aria-label="View outgoing transaction details" onClick={() => setShowSpendingDetails(true)}>
            <div className="card-topline"><span className="summary-icon icon-coral">↘</span><span className="investment-plan-count">{currentMonthLabel}</span></div>
            <p className="summary-label">OUTGOING TRANSACTIONS</p><div className="summary-value">{formatAmount(summary.transactionCount)}</div>
            <p className="summary-foot">Daily spending, bills, and repayments</p>
          </button>
          <button className="summary-card investment-summary spending-summary-button" type="button" aria-label="View LIC, SIP, and savings details" onClick={() => setShowInvestmentPlans(true)}>
            <div className="card-topline"><span className="summary-icon icon-investment">✳</span><span className="investment-plan-count">{investmentPlans.length} tracked</span></div>
            <p className="summary-label">LIC, SIP &amp; SAVINGS</p><div className="summary-value">₹{formatCurrency(summary.investmentContributions)}</div>
            <p className="summary-foot">Contributions in {currentMonthLabel}</p>
          </button>
          <button className="summary-card monthly-transaction-summary vehicle-summary spending-summary-button" type="button" aria-label="View vehicle maintenance transactions" onClick={() => setActiveTransactionCategory("vehicle")}>
            <div className="card-topline"><span className="summary-icon icon-vehicle" aria-hidden="true">↻</span><span className="monthly-transaction-count">{summary.vehicleTransactionCount} this month</span></div>
            <p className="summary-label">VEHICLE MAINTENANCE</p><div className="summary-value">₹{formatCurrency(summary.vehicleTotal)}</div>
            <p className="summary-foot">{currentMonthLabel}</p>
          </button>
          <button className="summary-card monthly-transaction-summary rent-summary spending-summary-button" type="button" aria-label="View rent transactions" onClick={() => setActiveTransactionCategory("rent")}>
            <div className="card-topline"><span className="summary-icon icon-rent" aria-hidden="true">⌂</span><span className="monthly-transaction-count">{summary.rentTransactionCount} this month</span></div>
            <p className="summary-label">RENT</p><div className="summary-value">₹{formatCurrency(summary.rentTotal)}</div>
            <p className="summary-foot">{currentMonthLabel}</p>
          </button>
        </section>

        <section className="budget-card" id="budget">
          <div className="budget-copy"><span className="budget-icon">◷</span><div><p className="budget-label">MONTHLY CASH FLOW</p><h3><strong>₹{formatCurrency(summary.income)}</strong> <span>income in {monthNames[selectedMonth]}</span></h3></div></div>
          <div className="budget-progress-wrap">
            <div className="budget-progress-label"><span><strong>₹{formatCurrency(summary.allocatedTotal)}</strong> allocated</span><span>₹{formatCurrency(summary.remainingAfterAllocation)} remaining</span></div>
            <div className="budget-progress"><span style={{ width: `${Math.min(100, summary.allocatedPercent)}%` }} /></div>
            <p className="budget-caption"><span className="budget-status-dot" /> {summary.income > 0 ? `${summary.allocatedPercent}% of income allocated` : "Add income in your profile to see cash flow"}</p>
          </div>
          <div className="budget-percent">{summary.allocatedPercent}<span>%</span></div>
        </section>

        <section className="insights-grid" id="spending">
          <article className="insight-card flow-card">
            <div className="insight-header"><div><span className="section-kicker">THE BIG PICTURE</span><h3>Your spending flow</h3></div><button className="more-button" type="button" aria-label="More spending chart options">···</button></div>
            <div className="chart-summary"><strong>₹{formatCurrency(spent)}</strong><span className="comparison">{summary.spendingChangePercent === null ? "No comparison" : <><span>{summary.spendingChangePercent <= 0 ? "↘" : "↗"}</span> {Math.abs(summary.spendingChangePercent).toFixed(1)}%</>}</span><small>compared to {monthNames[previousMonth]}</small></div>
            <div className="flow-chart" role="img" aria-label={`Recorded daily outflows for ${monthNames[selectedMonth]} ${selectedYear}`}>
              <div className="chart-y-labels">{summary.dailyScale.map((amount, index) => <span key={index}>₹{formatAmount(amount)}</span>)}</div>
              <div className="chart-plot">
                <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
                <svg className="flow-svg" viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="flowFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9bdfc4" stopOpacity=".25" /><stop offset="100%" stopColor="#9bdfc4" stopOpacity="0" /></linearGradient></defs>
                  <path className="chart-area" d={summary.chartAreaPath} />
                  <polyline className="chart-line" points={summary.chartLinePoints} />
                  <circle className="chart-point" cx="600" cy={summary.chartLastY} r="5" />
                </svg>
                <div className="chart-x-labels">{[1, 8, 15, 22, summary.dailySpending.length].map((day) => <span key={day}>{day} {monthNames[selectedMonth].slice(0, 3)}</span>)}</div>
              </div>
            </div>
            <div className="chart-footer"><span><i className="legend-dot" /> Recorded outflows</span><span>Live from your entries <i className="live-dot" /></span></div>
          </article>
          <article className="insight-card category-card">
            <div className="insight-header"><div><span className="section-kicker">WHERE IT GOES</span><h3>By category</h3></div><button className="more-button" type="button" aria-label="More category options">···</button></div>
            <div className="category-visual">
              <div className="donut-chart" style={{ background: summary.categoryGradient }} role="img" aria-label={`Spending by category: ${summary.categoryBreakdown.map((category) => `${category.name} ${category.percent.toFixed(1)} percent`).join(", ") || "no spending recorded"}`}><div className="donut-center"><strong>{summary.categoryBreakdown.length}</strong><span>categories</span></div></div>
              <div className="category-legend">{summary.categoryBreakdown.map((category) => <div className="category-row" key={category.name}><span className={`category-swatch ${category.color}`} /><span className="category-name">{category.name}</span><strong>₹{formatCurrency(category.amount)}</strong></div>)}{summary.categoryBreakdown.length === 0 && <p className="category-empty">No spending recorded for this month.</p>}</div>
            </div>
            <a href="#budget" className="category-link">Explore your spending <span>↗</span></a>
          </article>
        </section>
        {periodExpenses.length > 0 && (
          <section className="recent-expenses" aria-label="Recent transactions">
            <div className="recent-expenses-heading"><span className="section-kicker">JUST ADDED</span><h3>Recent transactions</h3></div>
            {periodExpenses.slice(0, 3).map((expense) => (
              <div className="recent-expense-row" key={expense.id}>
                <span className="recent-expense-mark" aria-hidden="true">↗</span>
                <span className="recent-expense-copy"><strong>{expense.name}</strong><small>{expense.category} · {new Date(`${expense.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span>
                <strong className="recent-expense-amount">−₹{formatCurrency(expense.amount)}</strong>
              </div>
            ))}
          </section>
        )}
        <footer className="page-footer"><span>A clearer picture, one day at a time.</span><span>Everything’s up to date <i className="live-dot" /></span></footer>
      </main>
    </div>
  );
}
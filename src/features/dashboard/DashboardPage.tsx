import { useState, type CSSProperties, type MouseEvent } from "react";
import { Brand } from "../../components/Brand";
import type { UserProfile } from "../auth/types";
import { AddExpensePage, type ExpenseEntry } from "./AddExpensePage";
import { BorrowingDetailsPage } from "./BorrowingDetailsPage";
import { InvestmentPlansPage, type InvestmentPlan, type PlanContribution } from "./InvestmentPlansPage";
import { MonthlyTransactionsPage, type MonthlyTransaction, type TransactionCategory } from "./MonthlyTransactionsPage";
import { RepaymentsPage, type BorrowingEntry, type BorrowingPayment } from "./RepaymentsPage";
import { SpendingDetailsPage } from "./SpendingDetailsPage";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthlySpending = [
  2840, 3180, 2675, 3490, 3025, 3760, 2910, 3340, 3120, 3580, 3275, 2460,
];

const initialBorrowings: BorrowingEntry[] = [
  {
    id: "borrowing-1",
    name: "Borrowing 1",
    amount: 10000,
    monthlyPayment: 1000,
    startDate: "2026-05-01",
    payments: [
      { id: "payment-may", date: "2026-05-01", amount: 1000 },
      { id: "payment-june", date: "2026-06-01", amount: 1000 },
      { id: "payment-july", date: "2026-07-01", amount: 1000 },
      { id: "payment-august", date: "2026-08-01", amount: 1000 },
      { id: "payment-september", date: "2026-09-01", amount: 1000 },
    ],
  },
];

const categories = [
  { name: "Home & bills", amount: 1280, color: "mint" },
  { name: "Food & dining", amount: 840, color: "coral" },
  { name: "Transport", amount: 590, color: "gold" },
  { name: "Everything else", amount: 640, color: "blue" },
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
  const [activeNavigation, setActiveNavigation] = useState("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSpendingDetails, setShowSpendingDetails] = useState(false);
  const [showRepayments, setShowRepayments] = useState(false);
  const [showInvestmentPlans, setShowInvestmentPlans] = useState(false);
  const [activeTransactionCategory, setActiveTransactionCategory] = useState<TransactionCategory | null>(null);
  const [selectedBorrowingId, setSelectedBorrowingId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [vehicleTransactions, setVehicleTransactions] = useState<MonthlyTransaction[]>([]);
  const [rentTransactions, setRentTransactions] = useState<MonthlyTransaction[]>([]);
  const [borrowings, setBorrowings] = useState(initialBorrowings);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const monthOffset = (selectedYear - today.getFullYear()) * 12 + selectedMonth - today.getMonth();
  const periodExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });
  const spent = monthlySpending[((monthOffset % 12) + 12) % 12]
    + periodExpenses.reduce((total, expense) => total + expense.amount, 0);
  const budget = 5200;
  const spentPercent = Math.round((spent / budget) * 100);
  const previousMonth = (selectedMonth + 11) % 12;
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
  const borrowedTotal = borrowings.reduce((total, borrowing) => total + borrowing.amount, 0);
  const paidTotal = borrowings.reduce((total, borrowing) => total + borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0), 0);
  const repaymentTotal = borrowings.reduce((total, borrowing) => total + Math.max(0, borrowing.amount - borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0)), 0);
  const activeBorrowingCount = borrowings.filter((borrowing) => borrowing.amount > borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0)).length;
  const monthlyPaymentTotal = borrowings.reduce((total, borrowing) => total + (borrowing.amount > borrowing.payments.reduce((sum, payment) => sum + payment.amount, 0) ? borrowing.monthlyPayment : 0), 0);
  const investmentTotal = investmentPlans.reduce((total, plan) => total + plan.contributions.reduce((sum, contribution) => sum + contribution.amount, 0), 0);
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const vehicleMonthTransactions = vehicleTransactions.filter((transaction) => transaction.date.slice(0, 7) === currentMonthKey);
  const rentMonthTransactions = rentTransactions.filter((transaction) => transaction.date.slice(0, 7) === currentMonthKey);
  const vehicleMonthTotal = vehicleMonthTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const rentMonthTotal = rentMonthTransactions.reduce((total, transaction) => total + transaction.amount, 0);

  function navigate(event: MouseEvent<HTMLAnchorElement>, destination: string) {
    setActiveNavigation(destination);
    if (window.matchMedia("(max-width: 560px)").matches) {
      event.preventDefault();
      window.scrollTo(0, 0);
    }
  }

  function addExpense(expense: ExpenseEntry) {
    setExpenses((current) => [expense, ...current]);
    setShowAddExpense(false);
    setActiveNavigation("overview");
  }

  function addBorrowing(borrowing: Omit<BorrowingEntry, "id" | "payments">) {
    setBorrowings((current) => [{ ...borrowing, id: `borrowing-${Date.now()}`, payments: [] }, ...current]);
  }

  function makePayment(borrowingId: string, payment: Omit<BorrowingPayment, "id">) {
    setBorrowings((current) => current.map((borrowing) => borrowing.id === borrowingId
      ? { ...borrowing, payments: [...borrowing.payments, { ...payment, id: `payment-${Date.now()}` }] }
      : borrowing));
  }

  function addInvestmentPlan(plan: Omit<InvestmentPlan, "id" | "contributions">) {
    setInvestmentPlans((current) => [{ ...plan, id: `plan-${Date.now()}`, contributions: [] }, ...current]);
  }

  function recordPlanContribution(planId: string, contribution: Omit<PlanContribution, "id">) {
    setInvestmentPlans((current) => current.map((plan) => plan.id === planId
      ? { ...plan, contributions: [...plan.contributions, { ...contribution, id: `contribution-${Date.now()}` }] }
      : plan));
  }

  function addMonthlyTransaction(category: TransactionCategory, transaction: Omit<MonthlyTransaction, "id">) {
    const entry = { ...transaction, id: `${category}-${Date.now()}` };
    if (category === "vehicle") setVehicleTransactions((current) => [entry, ...current]);
    else setRentTransactions((current) => [entry, ...current]);
  }

  if (activeTransactionCategory) {
    const category = activeTransactionCategory;
    return (
      <MonthlyTransactionsPage
        category={category}
        transactions={category === "vehicle" ? vehicleTransactions : rentTransactions}
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
            <div className="card-topline"><span className="summary-icon icon-mint">↗</span><span className="comparison"><span>↘</span> 8.2%</span></div>
            <p className="summary-label">TOTAL SPENT</p><div className="summary-value">₹{formatCurrency(spent)}</div>
            <p className="summary-foot">vs. ₹{formatAmount(monthlySpending[previousMonth])} last month</p>
            <div className="mini-bars" aria-hidden="true">{[32, 44, 37, 62, 48, 74, 54, 67, 46, 84, 59, 71].map((height, index) => <span key={index} style={{ "--bar-height": `${height}%` } as CSSProperties} />)}</div>
          </button>
          <button className="summary-card borrowing-summary borrowing-summary-button" id="borrowings" type="button" aria-label="View repayments" onClick={() => setShowRepayments(true)}>
            <div className="card-topline borrowing-card-topline"><span className="summary-icon icon-coral">⇄</span><span className="loan-original-total"><small>ORIGINAL BORROWED</small><strong>₹{formatCurrency(borrowedTotal)}</strong></span></div>
            <p className="summary-label">MONEY TO PAY BACK</p><div className="summary-value">₹{formatCurrency(repaymentTotal)}</div>
            <p className="summary-foot">Across {activeBorrowingCount} active {activeBorrowingCount === 1 ? "borrowing" : "borrowings"} <span className="foot-separator">·</span> {monthlyPaymentTotal > 0 ? `₹${formatAmount(monthlyPaymentTotal)} monthly plan` : "Payments tracked below"}</p><div className="repayment-track" aria-label="Borrowings repayment progress"><span style={{ width: `${borrowedTotal ? Math.min(100, (paidTotal / borrowedTotal) * 100) : 0}%` }} /></div>
          </button>
          <article className="summary-card saved-summary">
            <div className="card-topline"><span className="summary-icon icon-gold">✳</span><span className="comparison positive">↗ on track</span></div>
            <p className="summary-label">SET ASIDE THIS MONTH</p><div className="summary-value">₹{formatAmount(860)}<span>.00</span></div>
            <p className="summary-foot">You’re building a good habit.</p><div className="savings-spark" aria-hidden="true"><svg viewBox="0 0 150 28" preserveAspectRatio="none"><path d="M1 24 C20 21 22 14 38 17 S58 23 73 12 S97 18 109 9 S132 12 149 2" /></svg></div>
          </article>
          <button className="summary-card investment-summary spending-summary-button" type="button" aria-label="View LIC, SIP, and savings details" onClick={() => setShowInvestmentPlans(true)}>
            <div className="card-topline"><span className="summary-icon icon-investment">✳</span><span className="investment-plan-count">{investmentPlans.length} tracked</span></div>
            <p className="summary-label">LIC, SIP &amp; SAVINGS</p><div className="summary-value">₹{formatCurrency(investmentTotal)}</div>
            <p className="summary-foot">Plans and contributions</p>
          </button>
          <button className="summary-card monthly-transaction-summary vehicle-summary spending-summary-button" type="button" aria-label="View vehicle maintenance transactions" onClick={() => setActiveTransactionCategory("vehicle")}>
            <div className="card-topline"><span className="summary-icon icon-vehicle" aria-hidden="true">↻</span><span className="monthly-transaction-count">{vehicleMonthTransactions.length} this month</span></div>
            <p className="summary-label">VEHICLE MAINTENANCE</p><div className="summary-value">₹{formatCurrency(vehicleMonthTotal)}</div>
            <p className="summary-foot">{currentMonthLabel}</p>
          </button>
          <button className="summary-card monthly-transaction-summary rent-summary spending-summary-button" type="button" aria-label="View rent transactions" onClick={() => setActiveTransactionCategory("rent")}>
            <div className="card-topline"><span className="summary-icon icon-rent" aria-hidden="true">⌂</span><span className="monthly-transaction-count">{rentMonthTransactions.length} this month</span></div>
            <p className="summary-label">RENT</p><div className="summary-value">₹{formatCurrency(rentMonthTotal)}</div>
            <p className="summary-foot">{currentMonthLabel}</p>
          </button>
        </section>

        <section className="budget-card" id="budget">
          <div className="budget-copy"><span className="budget-icon">◷</span><div><p className="budget-label">YOUR MONTHLY BUDGET</p><h3><strong>₹{formatAmount(budget)}</strong> <span>planned for {monthNames[selectedMonth]}</span></h3></div></div>
          <div className="budget-progress-wrap">
            <div className="budget-progress-label"><span><strong>₹{formatCurrency(spent)}</strong> spent</span><span>₹{formatCurrency(budget - spent)} left</span></div>
            <div className="budget-progress"><span style={{ width: `${spentPercent}%` }} /></div>
            <p className="budget-caption"><span className="budget-status-dot" /> {spentPercent}% of your budget used</p>
          </div>
          <div className="budget-percent">{spentPercent}<span>%</span></div>
        </section>

        <section className="insights-grid" id="spending">
          <article className="insight-card flow-card">
            <div className="insight-header"><div><span className="section-kicker">THE BIG PICTURE</span><h3>Your spending flow</h3></div><button className="more-button" type="button" aria-label="More spending chart options">···</button></div>
            <div className="chart-summary"><strong>₹{formatCurrency(spent)}</strong><span className="comparison"><span>↘</span> 8.2%</span><small>compared to {monthNames[previousMonth]}</small></div>
            <div className="flow-chart" role="img" aria-label={`Spending chart for ${monthNames[selectedMonth]}, with daily spending rising over the month`}>
              <div className="chart-y-labels"><span>₹1,000</span><span>₹750</span><span>₹500</span><span>₹250</span><span>₹0</span></div>
              <div className="chart-plot">
                <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
                <svg className="flow-svg" viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="flowFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9bdfc4" stopOpacity=".25" /><stop offset="100%" stopColor="#9bdfc4" stopOpacity="0" /></linearGradient></defs>
                  <path className="chart-area" d="M0 137 C30 127 34 115 64 119 S101 128 128 106 S159 99 185 109 S220 86 246 91 S278 77 308 91 S340 68 368 75 S400 54 427 69 S458 46 486 57 S525 35 550 44 S582 23 600 19 L600 170 L0 170Z" />
                  <path className="chart-line" d="M0 137 C30 127 34 115 64 119 S101 128 128 106 S159 99 185 109 S220 86 246 91 S278 77 308 91 S340 68 368 75 S400 54 427 69 S458 46 486 57 S525 35 550 44 S582 23 600 19" />
                  <circle className="chart-point" cx="600" cy="19" r="5" />
                </svg>
                <div className="chart-x-labels"><span>1 {monthNames[selectedMonth].slice(0, 3)}</span><span>8 {monthNames[selectedMonth].slice(0, 3)}</span><span>15 {monthNames[selectedMonth].slice(0, 3)}</span><span>22 {monthNames[selectedMonth].slice(0, 3)}</span><span>Today</span></div>
              </div>
            </div>
            <div className="chart-footer"><span><i className="legend-dot" /> Daily spending</span><span>Updated just now <i className="live-dot" /></span></div>
          </article>
          <article className="insight-card category-card">
            <div className="insight-header"><div><span className="section-kicker">WHERE IT GOES</span><h3>By category</h3></div><button className="more-button" type="button" aria-label="More category options">···</button></div>
            <div className="category-visual">
              <div className="donut-chart" role="img" aria-label="Spending split: home and bills 38%, food and dining 25%, transport 18%, everything else 19%"><div className="donut-center"><strong>{spentPercent}%</strong><span>of budget</span></div></div>
              <div className="category-legend">{categories.map((category) => <div className="category-row" key={category.name}><span className={`category-swatch ${category.color}`} /><span className="category-name">{category.name}</span><strong>₹{formatAmount(category.amount)}</strong></div>)}</div>
            </div>
            <a href="#budget" className="category-link">Explore your spending <span>↗</span></a>
          </article>
        </section>
        {periodExpenses.length > 0 && (
          <section className="recent-expenses" aria-label="Recently added expenses">
            <div className="recent-expenses-heading"><span className="section-kicker">JUST ADDED</span><h3>Recent expenses</h3></div>
            {periodExpenses.slice(0, 3).map((expense) => (
              <div className="recent-expense-row" key={`${expense.date}-${expense.item}-${expense.amount}`}>
                <span className="recent-expense-mark" aria-hidden="true">↗</span>
                <span className="recent-expense-copy"><strong>{expense.item}</strong><small>{new Date(`${expense.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span>
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
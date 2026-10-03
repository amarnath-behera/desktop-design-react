import { useState, type FormEvent } from "react";

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

type NewBorrowing = Omit<BorrowingEntry, "id" | "payments">;

type RepaymentsPageProps = {
  borrowings: BorrowingEntry[];
  onBack: () => void;
  onAdd: (borrowing: NewBorrowing) => void;
  onOpenBorrowing: (borrowingId: string) => void;
};

const formatCurrency = (amount: number) => amount.toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

const getAmountPaid = (borrowing: BorrowingEntry) => borrowing.payments.reduce((total, payment) => total + payment.amount, 0);
const getOutstanding = (borrowing: BorrowingEntry) => Math.max(0, borrowing.amount - getAmountPaid(borrowing));

export function RepaymentsPage({ borrowings, onBack, onAdd, onOpenBorrowing }: RepaymentsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const activeBorrowings = borrowings.filter((borrowing) => getOutstanding(borrowing) > 0);
  const completedBorrowings = borrowings.filter((borrowing) => getOutstanding(borrowing) === 0);
  const activeCount = activeBorrowings.length;

  function renderBorrowingCard(borrowing: BorrowingEntry) {
    const amountPaid = getAmountPaid(borrowing);
    const outstanding = getOutstanding(borrowing);

    return (
      <button className="repayment-card repayment-card-button" type="button" key={borrowing.id} onClick={() => onOpenBorrowing(borrowing.id)}>
        <div className="repayment-card-top">
          <div className="repayment-card-origin"><span className="repayment-card-icon" aria-hidden="true">⇄</span><span className="repayment-original-principal"><small>AMOUNT BORROWED</small><strong>₹{formatCurrency(borrowing.amount)}</strong></span></div>
          <span className={`repayment-active ${outstanding === 0 ? "completed" : ""}`}><i /> {outstanding > 0 ? "Active" : "Completed"}</span>
        </div>
        <h2>{borrowing.name}</h2>
        <div className="repayment-card-amount">₹{formatCurrency(outstanding)}</div>
        <div className="repayment-due"><span>Remaining</span><strong>₹{formatCurrency(outstanding)}</strong></div>
        <div className="repayment-card-progress"><span style={{ width: `${borrowing.amount ? Math.min(100, (amountPaid / borrowing.amount) * 100) : 0}%` }} /></div>
        <p className="repayment-card-caption">₹{formatCurrency(amountPaid)} paid of ₹{formatCurrency(borrowing.amount)}</p>
      </button>
    );
  }

  function submitBorrowing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAdd({
      name: String(formData.get("name")).trim(),
      amount: Number(formData.get("amount")),
      monthlyPayment: 0,
      startDate: String(formData.get("startDate")),
    });
    setShowAddForm(false);
  }

  return (
    <main className="expense-page repayments-page">
      <header className="expense-topbar">
        <button className="expense-back" type="button" onClick={onBack}><span aria-hidden="true">←</span> Overview</button>
        <span className="expense-period">{activeCount} active {activeCount === 1 ? "borrowing" : "borrowings"}</span>
      </header>
      <section className="repayments-content">
        <div className="repayments-heading">
          <span className="section-kicker">YOUR BORROWINGS</span>
          <h1>Money to pay back</h1>
          <p>Review each borrowing and its outstanding balance.</p>
        </div>
        <div className="repayments-total"><span>TOTAL REMAINING</span><strong>₹{formatCurrency(borrowings.reduce((total, borrowing) => total + getOutstanding(borrowing), 0))}</strong></div>
        <section className="repayment-list-section" aria-label="Active borrowings">
          <div className="repayment-list-heading"><h2>Active borrowings</h2><span>{activeBorrowings.length}</span></div>
          <div className="repayments-grid">
            {activeBorrowings.map(renderBorrowingCard)}
            {activeBorrowings.length === 0 && <p className="repayments-empty">No active borrowings.</p>}
          </div>
        </section>
        <section className="completed-borrowings-section" aria-label="Completed borrowings">
          <div className="repayment-list-heading"><h2>Completed borrowings</h2><span>{completedBorrowings.length}</span></div>
          <div className="repayments-grid">
            {completedBorrowings.map(renderBorrowingCard)}
            {completedBorrowings.length === 0 && <p className="repayments-empty">Completed borrowings will appear here once fully repaid.</p>}
          </div>
        </section>
      </section>
      <nav className="repayments-action-bar" aria-label="Repayment actions">
        <button className="repayments-footer-button repayments-home-button" type="button" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg>
          <span>Back to overview</span>
        </button>
        <button className="repayments-footer-button repayments-add-button" type="button" aria-label="Add a borrowing" onClick={() => setShowAddForm(true)}>
          <span aria-hidden="true">+</span><span>Add a borrowing</span>
        </button>
      </nav>
      {showAddForm && (
        <div className="repayment-dialog-backdrop">
          <section className="repayment-dialog" role="dialog" aria-modal="true" aria-labelledby="repayment-dialog-title">
            <div className="repayment-dialog-heading">
              <h2 id="repayment-dialog-title">Add a borrowing</h2>
              <button className="repayment-dialog-close" type="button" aria-label="Close" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form className="expense-form" onSubmit={submitBorrowing}>
              <label className="expense-field" htmlFor="borrowing-name">Borrowing name<input id="borrowing-name" name="name" type="text" placeholder="e.g. Personal loan" required /></label>
              <label className="expense-field" htmlFor="borrowing-amount">Amount borrowed<span className="expense-price-input"><span aria-hidden="true">₹</span><input id="borrowing-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" inputMode="decimal" required /></span></label>
              <label className="expense-field" htmlFor="borrowing-start-date">Start date<input id="borrowing-start-date" name="startDate" type="date" defaultValue={getTodayDate()} required /></label>
              <button className="auth-submit expense-submit" type="submit">Save borrowing <span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
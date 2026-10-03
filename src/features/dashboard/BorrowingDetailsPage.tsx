import { useState, type FormEvent } from "react";
import type { BorrowingEntry, BorrowingPayment } from "./RepaymentsPage";

type BorrowingDetailsPageProps = {
  borrowing: BorrowingEntry;
  onBack: () => void;
  onMakePayment: (payment: Omit<BorrowingPayment, "id">) => void;
};

const formatCurrency = (amount: number) => amount.toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (date: string) => `${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`;

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function BorrowingDetailsPage({ borrowing, onBack, onMakePayment }: BorrowingDetailsPageProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const amountPaid = borrowing.payments.reduce((total, payment) => total + payment.amount, 0);
  const outstanding = Math.max(0, borrowing.amount - amountPaid);
  const paymentHistory = [...borrowing.payments].sort((first, second) => second.date.localeCompare(first.date));

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onMakePayment({ amount: Number(formData.get("amount")), date: String(formData.get("date")) });
    setShowPaymentForm(false);
  }

  return (
    <main className="expense-page borrowing-details-page">
      <header className="expense-topbar">
        <span className="expense-period">BORROWING DETAILS</span>
        <span className="expense-period">Started {formatDate(borrowing.startDate)}</span>
      </header>
      <section className="borrowing-details-content">
        <div className="borrowing-details-heading">
          <span className="section-kicker">YOUR BORROWING</span>
          <h1>{borrowing.name}</h1>
          <p>Started on {formatDate(borrowing.startDate)}{borrowing.monthlyPayment > 0 && <> · ₹{formatCurrency(borrowing.monthlyPayment)} monthly payment</>}</p>
        </div>
        <section className="borrowing-balance-grid" aria-label="Borrowing balance summary">
          <article className="borrowing-balance-card"><span>AMOUNT BORROWED</span><strong>₹{formatCurrency(borrowing.amount)}</strong></article>
          <article className="borrowing-balance-card"><span>AMOUNT PAID</span><strong>₹{formatCurrency(amountPaid)}</strong></article>
          <article className="borrowing-balance-card remaining"><span>REMAINING BALANCE</span><strong>₹{formatCurrency(outstanding)}</strong></article>
        </section>
        <section className="borrowing-payment-history" aria-label="Payment history for this borrowing">
          <div className="borrowing-history-heading"><h2>Payment history</h2><span>{paymentHistory.length} payments</span></div>
          {paymentHistory.length > 0 ? (
            <div className="borrowing-history-list">
              {paymentHistory.map((payment) => (
                <div className="borrowing-history-row" key={payment.id}>
                  <span className="history-date-mark" aria-hidden="true">✓</span>
                  <span className="borrowing-history-date">{formatDate(payment.date)}</span>
                  <strong>−₹{formatCurrency(payment.amount)}</strong>
                </div>
              ))}
            </div>
          ) : <p className="borrowing-history-empty">No payments recorded yet.</p>}
        </section>
      </section>
      <nav className="repayments-action-bar" aria-label="Borrowing details actions">
        <button className="repayments-footer-button repayments-home-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span><span>Back to borrowings</span>
        </button>
        <button className="repayments-footer-button repayments-add-button" type="button" disabled={outstanding === 0} onClick={() => setShowPaymentForm(true)}>
          <span aria-hidden="true">+</span><span>{outstanding === 0 ? "Paid in full" : "Make a payment"}</span>
        </button>
      </nav>
      {showPaymentForm && (
        <div className="repayment-dialog-backdrop">
          <section className="repayment-dialog" role="dialog" aria-modal="true" aria-labelledby="make-payment-title">
            <div className="repayment-dialog-heading">
              <h2 id="make-payment-title">Make a payment</h2>
              <button className="repayment-dialog-close" type="button" aria-label="Close" onClick={() => setShowPaymentForm(false)}>×</button>
            </div>
            <form className="expense-form" onSubmit={submitPayment}>
              <label className="expense-field" htmlFor="payment-amount">Payment amount<span className="expense-price-input"><span aria-hidden="true">₹</span><input id="payment-amount" name="amount" type="number" min="0.01" max={outstanding.toFixed(2)} step="0.01" defaultValue={borrowing.monthlyPayment > 0 ? Math.min(borrowing.monthlyPayment, outstanding).toFixed(2) : ""} inputMode="decimal" required /></span></label>
              <label className="expense-field" htmlFor="payment-date">Payment date<input id="payment-date" name="date" type="date" defaultValue={getTodayDate()} max={getTodayDate()} required /></label>
              <button className="auth-submit expense-submit" type="submit">Save payment <span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
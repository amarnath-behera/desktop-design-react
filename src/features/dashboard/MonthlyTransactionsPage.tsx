import { useState, type FormEvent } from "react";

export type MonthlyTransaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
};

export type TransactionCategory = "vehicle" | "rent";

type NewMonthlyTransaction = Omit<MonthlyTransaction, "id">;

type MonthlyTransactionsPageProps = {
  category: TransactionCategory;
  transactions: MonthlyTransaction[];
  onBack: () => void;
  onAdd: (transaction: NewMonthlyTransaction) => void;
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

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyTransactionsPage({ category, transactions, onBack, onAdd }: MonthlyTransactionsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const today = new Date();
  const monthKey = getMonthKey(today);
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const title = category === "vehicle" ? "Vehicle maintenance" : "Rent";
  const monthTransactions = transactions.filter((transaction) => transaction.date.slice(0, 7) === monthKey);
  const monthTotal = monthTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const history = [...transactions].sort((first, second) => second.date.localeCompare(first.date));

  function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAdd({
      name: String(formData.get("name")).trim(),
      amount: Number(formData.get("amount")),
      date: String(formData.get("date")),
    });
    setShowAddForm(false);
  }

  return (
    <main className="expense-page monthly-transactions-page">
      <header className="expense-topbar">
        <button className="expense-back" type="button" onClick={onBack}><span aria-hidden="true">←</span> Overview</button>
        <span className="expense-period">{transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}</span>
      </header>
      <section className="monthly-transactions-content">
        <div className="monthly-transactions-heading">
          <span className={`monthly-category-icon ${category}`} aria-hidden="true">{category === "vehicle" ? "↻" : "⌂"}</span>
          <h1>{title}</h1>
          <p>{monthLabel} total</p>
        </div>
        <div className="monthly-transactions-total"><span>SPENT THIS MONTH</span><strong>₹{formatCurrency(monthTotal)}</strong><small>{monthTransactions.length} {monthTransactions.length === 1 ? "transaction" : "transactions"}</small></div>
        <section className="monthly-transaction-history" aria-label={`${title} transaction history`}>
          <div className="monthly-transaction-history-heading"><h2>Transaction history</h2><span>{history.length} total</span></div>
          {history.length > 0 ? (
            <div className="monthly-transaction-list">
              {history.map((transaction) => (
                <article className="monthly-transaction-row" key={transaction.id}>
                  <span className={`monthly-transaction-mark ${category}`} aria-hidden="true">{category === "vehicle" ? "↻" : "⌂"}</span>
                  <span className="monthly-transaction-copy"><strong>{transaction.name}</strong><small>{formatDate(transaction.date)}</small></span>
                  <strong className="monthly-transaction-amount">−₹{formatCurrency(transaction.amount)}</strong>
                </article>
              ))}
            </div>
          ) : <p className="monthly-transaction-empty">No transactions recorded yet.</p>}
        </section>
      </section>
      <nav className="repayments-action-bar" aria-label={`${title} actions`}>
        <button className="repayments-footer-button repayments-home-button" type="button" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg><span>Back to overview</span></button>
        <button className="repayments-footer-button repayments-add-button" type="button" aria-label="Add transaction" onClick={() => setShowAddForm(true)}><span aria-hidden="true">+</span><span>Add transaction</span></button>
      </nav>
      {showAddForm && (
        <div className="repayment-dialog-backdrop">
          <section className="repayment-dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-transaction-dialog-title">
            <div className="repayment-dialog-heading"><h2 id="monthly-transaction-dialog-title">Add {title.toLowerCase()} transaction</h2><button className="repayment-dialog-close" type="button" aria-label="Close" onClick={() => setShowAddForm(false)}>×</button></div>
            <form className="expense-form" onSubmit={submitTransaction}>
              <label className="expense-field" htmlFor="monthly-transaction-name">Details<input id="monthly-transaction-name" name="name" type="text" placeholder={category === "vehicle" ? "e.g. Oil change" : "e.g. October rent"} required /></label>
              <label className="expense-field" htmlFor="monthly-transaction-amount">Amount<span className="expense-price-input"><span aria-hidden="true">₹</span><input id="monthly-transaction-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" inputMode="decimal" required /></span></label>
              <label className="expense-field" htmlFor="monthly-transaction-date">Date<input id="monthly-transaction-date" name="date" type="date" defaultValue={getTodayDate()} required /></label>
              <button className="auth-submit expense-submit" type="submit">Save transaction <span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
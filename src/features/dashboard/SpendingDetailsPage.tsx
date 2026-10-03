import type { ExpenseEntry } from "./AddExpensePage";

type SpendingDetailsPageProps = {
  selectedMonth: number;
  selectedYear: number;
  lastDay: number;
  expenses: ExpenseEntry[];
  onBack: () => void;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (amount: number) => amount.toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function SpendingDetailsPage({ selectedMonth, selectedYear, lastDay, expenses, onBack }: SpendingDetailsPageProps) {
  const dailyDetails = Array.from({ length: lastDay }, (_, index) => {
    const day = lastDay - index;
    const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayExpenses = expenses.filter((expense) => expense.date === date);

    return {
      date,
      label: `${String(day).padStart(2, "0")}-${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`,
      expenses: dayExpenses,
      total: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    };
  });
  const recordedTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="expense-page spending-details-page">
      <header className="expense-topbar">
        <button className="expense-back" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back to overview</button>
        <span className="expense-period">{monthNames[selectedMonth]} {selectedYear}</span>
      </header>
      <section className="details-content">
        <div className="details-heading">
          <div>
            <span className="section-kicker">SPENDING HISTORY</span>
            <h1>Daily details</h1>
            <p>Expenses recorded from {dailyDetails[dailyDetails.length - 1]?.label} to {dailyDetails[0]?.label}.</p>
          </div>
          <div className="details-total"><span>RECORDED TOTAL</span><strong>₹{formatCurrency(recordedTotal)}</strong></div>
        </div>
        <div className="daily-expense-list" aria-label="Daily spending details">
          {dailyDetails.map((day) => (
            <article className="daily-expense-card" key={day.date}>
              <header className="daily-expense-header"><h2>{day.label}</h2><span>{day.expenses.length} {day.expenses.length === 1 ? "item" : "items"}</span></header>
              {day.expenses.length > 0 ? (
                <ul className="daily-expense-items">
                  {day.expenses.map((expense, index) => (
                    <li key={`${expense.item}-${index}`}><span>{expense.item}</span><strong>₹{formatCurrency(expense.amount)}</strong></li>
                  ))}
                </ul>
              ) : <p className="daily-expense-empty">No expenses recorded</p>}
              <div className="daily-expense-total"><span>Day total</span><strong>₹{formatCurrency(day.total)}</strong></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
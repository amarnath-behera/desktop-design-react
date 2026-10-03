import { expenseCategories, type ExpenseEntry } from "./dashboardData";

export type { ExpenseEntry } from "./dashboardData";

type AddExpensePageProps = {
  selectedMonth: number;
  selectedYear: number;
  onCancel: () => void;
  onSubmit: (expense: Omit<ExpenseEntry, "id">) => void;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function AddExpensePage({ selectedMonth, selectedYear, onCancel, onSubmit }: AddExpensePageProps) {
  const today = new Date();
  const day = Math.min(today.getDate(), new Date(selectedYear, selectedMonth + 1, 0).getDate());
  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dateValue = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  function submitExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      item: String(formData.get("item")),
      category: String(formData.get("category")) as ExpenseEntry["category"],
      amount: Number(formData.get("price")),
      date: String(formData.get("date")),
    });
  }

  return (
    <main className="expense-page">
      <header className="expense-topbar">
        <button className="expense-back" type="button" onClick={onCancel}><span aria-hidden="true">←</span> Back to overview</button>
        <span className="expense-period">{monthNames[selectedMonth]} {selectedYear}</span>
      </header>
      <section className="expense-content">
        <div className="expense-heading">
          <span className="section-kicker">SPENDING</span>
          <h1>Add an expense</h1>
          <p>Keep a clear record of where your money goes.</p>
        </div>
        <form className="expense-form" onSubmit={submitExpense}>
          <label className="expense-field" htmlFor="expense-date">
            Date
            <input id="expense-date" name="date" type="date" min={`${monthKey}-01`} max={`${monthKey}-${String(lastDay).padStart(2, "0")}`} defaultValue={dateValue} required />
          </label>
          <label className="expense-field" htmlFor="expense-item">
            Item name
            <input id="expense-item" name="item" type="text" placeholder="e.g. Weekly groceries" autoComplete="off" required />
          </label>
          <label className="expense-field" htmlFor="expense-category">
            Category
            <select id="expense-category" name="category" defaultValue={expenseCategories[0]}>
              {expenseCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="expense-field" htmlFor="expense-price">
            Item price
            <span className="expense-price-input"><span aria-hidden="true">₹</span><input id="expense-price" name="price" type="number" min="0.01" step="0.01" placeholder="0.00" inputMode="decimal" required /></span>
          </label>
          <button className="auth-submit expense-submit" type="submit">Save expense <span aria-hidden="true">↗</span></button>
        </form>
      </section>
    </main>
  );
}
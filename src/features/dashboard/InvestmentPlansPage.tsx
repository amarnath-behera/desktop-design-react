import { useState, type FormEvent } from "react";
import type { ContributionFrequency, InvestmentPlan, PlanCategory, PlanContribution } from "./dashboardData";

export type { InvestmentPlan, PlanCategory, PlanContribution } from "./dashboardData";

type NewInvestmentPlan = Omit<InvestmentPlan, "id" | "contributions">;
type NewPlanContribution = Omit<PlanContribution, "id">;
type PlanFilter = PlanCategory | "All";

type InvestmentPlansPageProps = {
  plans: InvestmentPlan[];
  onBack: () => void;
  onAddPlan: (plan: NewInvestmentPlan) => void;
  onRecordContribution: (planId: string, contribution: NewPlanContribution) => void;
};

const categories: PlanFilter[] = ["All", "LIC", "SIP", "Savings"];

const formatCurrency = (amount: number) => amount.toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (date: string) => `${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`;

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

const getContributed = (plan: InvestmentPlan) => plan.contributions.reduce((total, contribution) => total + contribution.amount, 0);

export function InvestmentPlansPage({ plans, onBack, onAddPlan, onRecordContribution }: InvestmentPlansPageProps) {
  const [filter, setFilter] = useState<PlanFilter>("All");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const totalContributed = plans.reduce((total, plan) => total + getContributed(plan), 0);
  const filteredPlans = filter === "All" ? plans : plans.filter((plan) => plan.category === filter);

  function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAddPlan({
      name: String(formData.get("name")).trim(),
      category: String(formData.get("category")) as PlanCategory,
      contributionAmount: Number(formData.get("contributionAmount")),
      frequency: String(formData.get("frequency")) as ContributionFrequency,
      startDate: String(formData.get("startDate")),
    });
    setFilter("All");
    setShowPlanForm(false);
  }

  function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    const formData = new FormData(event.currentTarget);
    onRecordContribution(selectedPlan.id, {
      amount: Number(formData.get("amount")),
      date: String(formData.get("date")),
    });
    setShowContributionForm(false);
  }

  function renderPlanCard(plan: InvestmentPlan) {
    return (
      <button className="investment-plan-card" key={plan.id} type="button" onClick={() => setSelectedPlanId(plan.id)}>
        <div className="investment-plan-card-top"><span className={`investment-plan-category ${plan.category.toLowerCase()}`}>{plan.category}</span><span className="investment-plan-count">{plan.contributions.length} contributions</span></div>
        <h2>{plan.name}</h2>
        <div className="investment-plan-total">₹{formatCurrency(getContributed(plan))}</div>
        <div className="investment-plan-meta"><span>{plan.frequency} contribution</span><strong>₹{formatCurrency(plan.contributionAmount)}</strong></div>
        <div className="investment-plan-meta"><span>Started</span><strong>{formatDate(plan.startDate)}</strong></div>
      </button>
    );
  }

  if (selectedPlan) {
    const contributions = [...selectedPlan.contributions].sort((first, second) => second.date.localeCompare(first.date));

    return (
      <main className="expense-page investment-plans-page">
        <header className="expense-topbar"><span className="expense-period">{selectedPlan.category.toUpperCase()} DETAILS</span><span className="expense-period">Started {formatDate(selectedPlan.startDate)}</span></header>
        <section className="investment-detail-content">
          <div className="investment-detail-heading">
            <span className={`investment-plan-category ${selectedPlan.category.toLowerCase()}`}>{selectedPlan.category}</span>
            <h1>{selectedPlan.name}</h1>
            <p>Started on {formatDate(selectedPlan.startDate)} · ₹{formatCurrency(selectedPlan.contributionAmount)} {selectedPlan.frequency.toLowerCase()} contribution</p>
          </div>
          <section className="investment-metrics" aria-label="Plan summary">
            <article><span>TOTAL CONTRIBUTED</span><strong>₹{formatCurrency(getContributed(selectedPlan))}</strong></article>
            <article><span>PLANNED CONTRIBUTION</span><strong>₹{formatCurrency(selectedPlan.contributionAmount)} / {selectedPlan.frequency.toLowerCase()}</strong></article>
            <article><span>CONTRIBUTIONS</span><strong>{contributions.length}</strong></article>
          </section>
          <section className="investment-history" aria-label="Contribution history">
            <div className="investment-history-heading"><h2>Contribution history</h2><span>{contributions.length} entries</span></div>
            {contributions.length > 0 ? (
              <div className="investment-history-list">
                {contributions.map((contribution) => (
                  <div className="investment-history-row" key={contribution.id}>
                    <span className="investment-history-mark" aria-hidden="true">✓</span>
                    <span>{formatDate(contribution.date)}</span>
                    <strong>+₹{formatCurrency(contribution.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : <p className="investment-history-empty">No contributions recorded yet.</p>}
          </section>
        </section>
        <nav className="repayments-action-bar" aria-label="Investment plan actions">
          <button className="repayments-footer-button repayments-home-button" type="button" onClick={() => setSelectedPlanId(null)}><span aria-hidden="true">←</span><span>Back to plans</span></button>
          <button className="repayments-footer-button repayments-add-button" type="button" aria-label="Record a contribution" onClick={() => setShowContributionForm(true)}><span aria-hidden="true">+</span><span>Record contribution</span></button>
        </nav>
        {showContributionForm && (
          <div className="repayment-dialog-backdrop">
            <section className="repayment-dialog" role="dialog" aria-modal="true" aria-labelledby="contribution-dialog-title">
              <div className="repayment-dialog-heading"><h2 id="contribution-dialog-title">Record contribution</h2><button className="repayment-dialog-close" type="button" aria-label="Close" onClick={() => setShowContributionForm(false)}>×</button></div>
              <form className="expense-form" onSubmit={submitContribution}>
                <label className="expense-field" htmlFor="plan-contribution-amount">Amount<span className="expense-price-input"><span aria-hidden="true">₹</span><input id="plan-contribution-amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={selectedPlan.contributionAmount.toFixed(2)} inputMode="decimal" required /></span></label>
                <label className="expense-field" htmlFor="plan-contribution-date">Date<input id="plan-contribution-date" name="date" type="date" defaultValue={getTodayDate()} max={getTodayDate()} required /></label>
                <button className="auth-submit expense-submit" type="submit">Save contribution <span aria-hidden="true">↗</span></button>
              </form>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="expense-page investment-plans-page">
      <header className="expense-topbar"><button className="expense-back" type="button" onClick={onBack}><span aria-hidden="true">←</span> Overview</button><span className="expense-period">{plans.length} tracked {plans.length === 1 ? "plan" : "plans"}</span></header>
      <section className="investment-plans-content">
        <div className="investment-plans-heading"><span className="section-kicker">YOUR FINANCIAL PLANS</span><h1>LIC, SIP &amp; savings</h1><p>Track your plans, contributions, and progress in one place.</p></div>
        <div className="investment-total"><span>TOTAL CONTRIBUTED</span><strong>₹{formatCurrency(totalContributed)}</strong></div>
        <div className="investment-filters" role="group" aria-label="Filter plans by type">
          {categories.map((category) => <button className={filter === category ? "active" : ""} type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}
        </div>
        <div className="investment-plans-grid" aria-label={`${filter} plans`}>
          {filteredPlans.map(renderPlanCard)}
          {filteredPlans.length === 0 && <p className="investment-empty">{plans.length === 0 ? "No plans added yet. Add an LIC, SIP, or savings plan to get started." : `No ${filter} plans yet.`}</p>}
        </div>
      </section>
      <nav className="repayments-action-bar" aria-label="Investment plan actions">
        <button className="repayments-footer-button repayments-home-button" type="button" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg><span>Back to overview</span></button>
        <button className="repayments-footer-button repayments-add-button" type="button" aria-label="Add a plan" onClick={() => setShowPlanForm(true)}><span aria-hidden="true">+</span><span>Add a plan</span></button>
      </nav>
      {showPlanForm && (
        <div className="repayment-dialog-backdrop">
          <section className="repayment-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title">
            <div className="repayment-dialog-heading"><h2 id="plan-dialog-title">Add a financial plan</h2><button className="repayment-dialog-close" type="button" aria-label="Close" onClick={() => setShowPlanForm(false)}>×</button></div>
            <form className="expense-form" onSubmit={submitPlan}>
              <label className="expense-field" htmlFor="plan-category">Plan type<select id="plan-category" name="category" defaultValue="LIC"><option>LIC</option><option>SIP</option><option>Savings</option></select></label>
              <label className="expense-field" htmlFor="plan-name">Plan name<input id="plan-name" name="name" type="text" placeholder="e.g. Family protection" required /></label>
              <label className="expense-field" htmlFor="plan-contribution-amount-input">Contribution amount<span className="expense-price-input"><span aria-hidden="true">₹</span><input id="plan-contribution-amount-input" name="contributionAmount" type="number" min="0.01" step="0.01" placeholder="0.00" inputMode="decimal" required /></span></label>
              <label className="expense-field" htmlFor="plan-frequency">Contribution frequency<select id="plan-frequency" name="frequency" defaultValue="Monthly"><option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>Not specified</option></select></label>
              <label className="expense-field" htmlFor="plan-start-date">Start date<input id="plan-start-date" name="startDate" type="date" defaultValue={getTodayDate()} required /></label>
              <button className="auth-submit expense-submit" type="submit">Save plan <span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
import { useState, type FormEvent } from "react";
import type { AdditionalIncomeEntry, AuthMode, UserProfile } from "../types";
import { emptyProfile, normalizeMobile } from "../types";

type ProfileFormProps = {
  mode: Exclude<AuthMode, "login">;
  profile?: UserProfile;
  onRegister: (profile: UserProfile) => Promise<void>;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  onLogout: () => void;
};

type ProfileTextField = "firstName" | "lastName" | "dateOfBirth" | "gender" | "mobile" | "email";

function getCurrentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function formatIncomeMonth(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const formatIncomeAmount = (amount: number) => amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ProfileForm({ mode, profile, onRegister, onSaveProfile, onModeChange, onLogout }: ProfileFormProps) {
  const [form, setForm] = useState<UserProfile>(() => ({
    ...(profile ?? emptyProfile),
    monthlyIncome: profile?.monthlyIncome,
    additionalIncomes: profile?.additionalIncomes ?? [],
  }));
  const [error, setError] = useState("");
  const [additionalIncomeAmount, setAdditionalIncomeAmount] = useState("");
  const [additionalIncomeMonth, setAdditionalIncomeMonth] = useState(getCurrentMonth);
  const today = new Date().toISOString().slice(0, 10);
  const isProfile = mode === "profile";

  function updateField(field: ProfileTextField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function updateMonthlyIncome(value: string) {
    setForm((current) => ({ ...current, monthlyIncome: value === "" ? undefined : Number(value) }));
    setError("");
  }

  function addAdditionalIncome() {
    const amount = Number(additionalIncomeAmount);
    if (amount <= 0 || !additionalIncomeMonth) return;
    const entry: AdditionalIncomeEntry = { id: `income-${Date.now()}`, amount, month: additionalIncomeMonth };
    setForm((current) => ({ ...current, additionalIncomes: [...(current.additionalIncomes ?? []), entry] }));
    setAdditionalIncomeAmount("");
    setAdditionalIncomeMonth(getCurrentMonth());
  }

  function removeAdditionalIncome(incomeId: string) {
    setForm((current) => ({
      ...current,
      additionalIncomes: (current.additionalIncomes ?? []).filter((income) => income.id !== incomeId),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      mobile: normalizeMobile(form.mobile),
      email: form.email.trim().toLowerCase(),
      monthlyIncome: Number(form.monthlyIncome ?? 0),
      additionalIncomes: form.additionalIncomes ?? [],
    };
    if (!/^[6-9]\d{9}$/.test(normalized.mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!normalized.dateOfBirth || normalized.dateOfBirth >= today) {
      setError("Choose a valid date of birth in the past.");
      return;
    }
    const save = mode === "register" ? onRegister(normalized) : onSaveProfile(normalized);
    void save.catch((saveError: unknown) => setError(saveError instanceof Error ? saveError.message : "Unable to save your profile."));
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field-grid">
        <label className="auth-field"><span>First name</span><input type="text" autoComplete="given-name" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} required /></label>
        <label className="auth-field"><span>Last name</span><input type="text" autoComplete="family-name" value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} required /></label>
      </div>
      <div className="auth-field-grid">
        <label className="auth-field"><span>Date of birth</span><input type="date" autoComplete="bday" max={today} value={form.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} required /></label>
        <label className="auth-field"><span>Gender</span><select value={form.gender} onChange={(event) => updateField("gender", event.target.value)} required><option value="" disabled>Select gender</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
      </div>
      <label className="auth-field"><span>Mobile number</span><div className="mobile-input-wrap"><span>+91</span><input type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="98765 43210" value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} required /></div></label>
      <label className="auth-field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} required /></label>
      <label className="auth-field" htmlFor="monthly-income"><span>Monthly income</span><div className="expense-price-input"><span aria-hidden="true">₹</span><input id="monthly-income" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={form.monthlyIncome ?? ""} onChange={(event) => updateMonthlyIncome(event.target.value)} required /></div></label>
      {isProfile && (
        <section className="additional-income-section" aria-label="Additional monthly income">
          <div className="additional-income-heading"><div><h3>Additional income</h3><p>Add extra income to a specific month.</p></div></div>
          <div className="additional-income-controls">
            <label className="auth-field" htmlFor="additional-income-amount"><span>Amount</span><div className="expense-price-input"><span aria-hidden="true">₹</span><input id="additional-income-amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={additionalIncomeAmount} onChange={(event) => setAdditionalIncomeAmount(event.target.value)} /></div></label>
            <label className="auth-field" htmlFor="additional-income-month"><span>Month</span><input id="additional-income-month" type="month" value={additionalIncomeMonth} onChange={(event) => setAdditionalIncomeMonth(event.target.value)} /></label>
            <button className="additional-income-add" type="button" aria-label="Add income for selected month" disabled={!additionalIncomeAmount || Number(additionalIncomeAmount) <= 0} onClick={addAdditionalIncome}>+</button>
          </div>
          {(form.additionalIncomes ?? []).length > 0 && (
            <div className="additional-income-list">
              {(form.additionalIncomes ?? []).map((income) => (
                <div className="additional-income-row" key={income.id}>
                  <span>{formatIncomeMonth(income.month)}</span>
                  <strong>₹{formatIncomeAmount(income.amount)}</strong>
                  <button type="button" aria-label={`Remove additional income for ${formatIncomeMonth(income.month)}`} onClick={() => removeAdditionalIncome(income.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit">{isProfile ? "Save changes" : "Create account"}<span>→</span></button>
      {mode === "register" && <p className="auth-switch">Already have an account? <button type="button" onClick={() => onModeChange("login")}>Sign in</button></p>}
      {isProfile && <button className="auth-signout" type="button" onClick={onLogout}>Sign out</button>}
    </form>
  );
}
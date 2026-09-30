import { useState, type FormEvent } from "react";
import type { AuthMode, UserProfile } from "../types";
import { emptyProfile, normalizeMobile } from "../types";

type ProfileFormProps = {
  mode: Exclude<AuthMode, "login">;
  profiles: UserProfile[];
  profile?: UserProfile;
  onRegister: (profile: UserProfile) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onModeChange: (mode: AuthMode) => void;
  onLogout: () => void;
};

export function ProfileForm({ mode, profiles, profile, onRegister, onSaveProfile, onModeChange, onLogout }: ProfileFormProps) {
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const isProfile = mode === "profile";

  function updateField(field: keyof UserProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), mobile: normalizeMobile(form.mobile), email: form.email.trim().toLowerCase() };
    if (!/^[6-9]\d{9}$/.test(normalized.mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!normalized.dateOfBirth || normalized.dateOfBirth >= today) {
      setError("Choose a valid date of birth in the past.");
      return;
    }
    const duplicate = profiles.find((savedProfile) =>
      savedProfile.mobile !== profile?.mobile &&
      (normalizeMobile(savedProfile.mobile) === normalized.mobile || savedProfile.email.toLowerCase() === normalized.email),
    );
    if (duplicate) {
      setError("That mobile number or email is already registered.");
      return;
    }
    if (mode === "register") onRegister(normalized);
    else onSaveProfile(normalized);
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
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit">{isProfile ? "Save changes" : "Create account"}<span>→</span></button>
      {mode === "register" && <p className="auth-switch">Already have an account? <button type="button" onClick={() => onModeChange("login")}>Sign in</button></p>}
      {isProfile && <button className="auth-signout" type="button" onClick={onLogout}>Sign out</button>}
    </form>
  );
}
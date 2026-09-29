import { useState, type FormEvent } from "react";

export type AuthMode = "login" | "register" | "profile";

export type UserProfile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
};

type AuthFlowProps = {
  mode: AuthMode;
  profiles: UserProfile[];
  profile?: UserProfile;
  onLogin: (profile: UserProfile) => void;
  onRegister: (profile: UserProfile) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onModeChange: (mode: AuthMode) => void;
  onCancelProfile: () => void;
  onLogout: () => void;
};

const emptyProfile: UserProfile = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
};

function normalizeMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

function Brand() {
  return (
    <a className="brand auth-brand" href="#login" aria-label="Morrow, a better tomorrow">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 3v3M4.9 7.9 7 10M19.1 7.9 17 10" /></svg>
      </span>
      <span className="brand-copy">
        <span className="brand-name">morrow<span className="brand-period">.</span></span>
        <span className="brand-tagline">A better tomorrow</span>
      </span>
    </a>
  );
}

export function AuthFlow({
  mode,
  profiles,
  profile,
  onLogin,
  onRegister,
  onSaveProfile,
  onModeChange,
  onCancelProfile,
  onLogout,
}: AuthFlowProps) {
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile);
  const [loginMobile, setLoginMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTarget, setOtpTarget] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  function updateField(field: keyof UserProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!otpTarget) {
      const mobile = normalizeMobile(loginMobile);
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }

      const matchingProfile = profiles.find((savedProfile) => normalizeMobile(savedProfile.mobile) === mobile);
      if (!matchingProfile) {
        setError("We couldn’t find an account for this number. Please create an account first.");
        return;
      }

      setOtpTarget(matchingProfile);
      setNotice(`Check ${matchingProfile.email} for your sign-in code. Email delivery is not connected in this demo; use 1234.`);
      return;
    }

    if (otp !== "1234") {
      setError("That code doesn’t match. Enter the 4-digit demo code.");
      return;
    }
    onLogin(otpTarget);
  }

  function validateProfile(): UserProfile | null {
    const normalized = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      mobile: normalizeMobile(form.mobile),
      email: form.email.trim().toLowerCase(),
    };

    if (!/^[6-9]\d{9}$/.test(normalized.mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return null;
    }
    if (!normalized.dateOfBirth || normalized.dateOfBirth >= today) {
      setError("Choose a valid date of birth in the past.");
      return null;
    }
    const duplicate = profiles.find((savedProfile) =>
      savedProfile.mobile !== profile?.mobile &&
      (normalizeMobile(savedProfile.mobile) === normalized.mobile || savedProfile.email.toLowerCase() === normalized.email),
    );
    if (duplicate) {
      setError("That mobile number or email is already registered.");
      return null;
    }
    return normalized;
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validatedProfile = validateProfile();
    if (!validatedProfile) return;

    if (mode === "register") onRegister(validatedProfile);
    else onSaveProfile(validatedProfile);
  }

  const isProfile = mode === "profile";
  const isRegistration = mode === "register";

  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <Brand />
        <div className="auth-visual-copy">
          <span className="auth-eyebrow"><i /> A BETTER TOMORROW STARTS HERE</span>
          <h1>Make room for<br /><em>what matters.</em></h1>
          <p>A calmer, clearer way to understand your money and plan what comes next.</p>
        </div>
        <span className="auth-image-caption">YOUR MONEY, IN A GOOD PLACE</span>
      </aside>

      <main className="auth-main">
        <div className="auth-mobile-brand"><Brand /></div>
        <section className="auth-panel">
          {isProfile && (
            <button className="auth-back" type="button" onClick={onCancelProfile}>← <span>Back to dashboard</span></button>
          )}

          <div className="auth-heading">
            <span className="auth-step">{isProfile ? "YOUR ACCOUNT" : isRegistration ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2>{isProfile ? "Your profile" : isRegistration ? "Create your account" : otpTarget ? "Check your email" : "Good to see you."}</h2>
            <p>{isProfile ? "Keep your personal details up to date." : isRegistration ? "A few details, then your money has a home." : otpTarget ? "Enter the 4-digit code to continue." : "Sign in securely with your mobile number."}</p>
          </div>

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              {!otpTarget ? (
                <label className="auth-field">
                  <span>Mobile number</span>
                  <div className="mobile-input-wrap"><span>+91</span><input type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="98765 43210" value={loginMobile} onChange={(event) => setLoginMobile(event.target.value)} required /></div>
                </label>
              ) : (
                <>
                  <div className="otp-destination"><span className="otp-mail-icon">✉</span><span>Code sent to <strong>{otpTarget.email}</strong></span></div>
                  <label className="auth-field otp-field">
                    <span>4-digit verification code</span>
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} placeholder="••••" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))} required />
                  </label>
                  <p className="demo-code-note">Demo mode: enter <strong>1234</strong>. Email delivery is not connected.</p>
                  <button className="auth-text-button" type="button" onClick={() => { setOtpTarget(null); setOtp(""); setNotice(""); setError(""); }}>Use a different number</button>
                </>
              )}
              {error && <p className="auth-error" role="alert">{error}</p>}
              {notice && !otpTarget && <p className="auth-notice" role="status">{notice}</p>}
              <button className="auth-submit" type="submit">{otpTarget ? "Verify and continue" : "Continue with email code"}<span>→</span></button>
              {!otpTarget && <p className="auth-switch">New to Morrow? <button type="button" onClick={() => onModeChange("register")}>Create an account</button></p>}
              {error.includes("create an account") && <button className="auth-secondary" type="button" onClick={() => onModeChange("register")}>Go to registration <span>→</span></button>}
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleProfileSubmit}>
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
              {isRegistration && <p className="auth-switch">Already have an account? <button type="button" onClick={() => onModeChange("login")}>Sign in</button></p>}
              {isProfile && <button className="auth-signout" type="button" onClick={onLogout}>Sign out</button>}
            </form>
          )}
          <p className="auth-legal">Your information stays on this device in this demo.</p>
        </section>
      </main>
    </div>
  );
}
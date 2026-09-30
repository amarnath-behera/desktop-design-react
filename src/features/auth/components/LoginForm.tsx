import { useState, type FormEvent } from "react";
import type { AuthMode, UserProfile } from "../types";
import { normalizeMobile } from "../types";

type LoginFormProps = {
  profiles: UserProfile[];
  onLogin: (profile: UserProfile) => void;
  onModeChange: (mode: AuthMode) => void;
  onOtpStateChange: (active: boolean) => void;
};

export function LoginForm({ profiles, onLogin, onModeChange, onOtpStateChange }: LoginFormProps) {
  const [loginMobile, setLoginMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTarget, setOtpTarget] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!otpTarget) {
      const mobile = normalizeMobile(loginMobile);
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      const matchingProfile = profiles.find((profile) => normalizeMobile(profile.mobile) === mobile);
      if (!matchingProfile) {
        setError("We couldn’t find an account for this number. Please create an account first.");
        return;
      }
      setOtpTarget(matchingProfile);
      onOtpStateChange(true);
      setNotice(`Check ${matchingProfile.email} for your sign-in code. Email delivery is not connected in this demo; use 1234.`);
      return;
    }
    if (otp !== "1234") {
      setError("That code doesn’t match. Enter the 4-digit demo code.");
      return;
    }
    onLogin(otpTarget);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {!otpTarget ? (
        <label className="auth-field"><span>Mobile number</span><div className="mobile-input-wrap"><span>+91</span><input type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="98765 43210" value={loginMobile} onChange={(event) => setLoginMobile(event.target.value)} required /></div></label>
      ) : (
        <>
          <div className="otp-destination"><span className="otp-mail-icon">✉</span><span>Code sent to <strong>{otpTarget.email}</strong></span></div>
          <label className="auth-field otp-field"><span>4-digit verification code</span><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} placeholder="••••" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))} required /></label>
          <p className="demo-code-note">Demo mode: enter <strong>1234</strong>. Email delivery is not connected.</p>
          <button className="auth-text-button" type="button" onClick={() => { setOtpTarget(null); setOtp(""); setNotice(""); setError(""); onOtpStateChange(false); }}>Use a different number</button>
        </>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && !otpTarget && <p className="auth-notice" role="status">{notice}</p>}
      <button className="auth-submit" type="submit">{otpTarget ? "Verify and continue" : "Continue with email code"}<span>→</span></button>
      {!otpTarget && <p className="auth-switch">New to Morrow? <button type="button" onClick={() => onModeChange("register")}>Create an account</button></p>}
      {error.includes("create an account") && <button className="auth-secondary" type="button" onClick={() => onModeChange("register")}>Go to registration <span>→</span></button>}
    </form>
  );
}
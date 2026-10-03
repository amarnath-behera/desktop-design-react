import { useState, type FormEvent } from "react";

type EmailOtpFormProps = {
  email: string;
  onVerify: (token: string) => Promise<void>;
  onResend: () => Promise<void>;
  onCancel: () => void;
};

export function EmailOtpForm({ email, onVerify, onResend, onCancel }: EmailOtpFormProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsBusy(true);
    try {
      await onVerify(token);
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : "The verification code could not be confirmed.";
      setError(message.toLowerCase().includes("token has expired or is invalid")
        ? "That code is expired or no longer current. Use the newest email code, or resend a new one."
        : message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setIsBusy(true);
    try {
      await onResend();
      setToken("");
      setNotice("A new code has been sent. Use it instead of any earlier code.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Unable to resend the verification code.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleVerify}>
      <div className="otp-destination"><span className="otp-mail-icon">✉</span><span>Verification code sent to <strong>{email}</strong></span></div>
      <label className="auth-field otp-field"><span>Verification code</span><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} placeholder="Enter code from email" value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 10))} required /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <button className="auth-submit" type="submit" disabled={isBusy || token.length < 6}>{isBusy ? "Verifying…" : "Verify and continue"}<span>→</span></button>
      <button className="auth-text-button" type="button" disabled={isBusy} onClick={() => void handleResend()}>Resend code</button>
      <button className="auth-text-button" type="button" disabled={isBusy} onClick={onCancel}>Use a different email</button>
    </form>
  );
}
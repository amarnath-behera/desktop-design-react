import { useState, type FormEvent } from "react";
import type { AuthMode } from "../types";

type LoginFormProps = {
  onSendCode: (email: string) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
};

export function LoginForm({ onSendCode, onModeChange }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSending(true);
    try {
      await onSendCode(email.trim().toLowerCase());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send a sign-in code.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={isSending}>{isSending ? "Sending code…" : "Continue with email code"}<span>→</span></button>
      <p className="auth-switch">New to Morrow? <button type="button" onClick={() => onModeChange("register")}>Create an account</button></p>
    </form>
  );
}
import { Brand } from "../../components/Brand";
import { EmailOtpForm } from "./components/EmailOtpForm";
import { LoginForm } from "./components/LoginForm";
import { ProfileForm } from "./components/ProfileForm";
import type { AuthMode, UserProfile } from "./types";

export type { AuthMode, UserProfile } from "./types";

type AuthFlowProps = {
  mode: AuthMode;
  profile?: UserProfile;
  otpEmail: string | null;
  onLogin: (email: string) => Promise<void>;
  onVerifyOtp: (token: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onCancelOtp: () => void;
  onRegister: (profile: UserProfile) => Promise<void>;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  onCancelProfile: () => void;
  onLogout: () => void;
};

export function AuthFlow({ mode, profile, otpEmail, onLogin, onVerifyOtp, onResendOtp, onCancelOtp, onRegister, onSaveProfile, onModeChange, onCancelProfile, onLogout }: AuthFlowProps) {
  const isProfile = mode === "profile";
  const isRegistration = mode === "register";
  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <Brand className="auth-brand" href="#login" />
        <div className="auth-visual-copy">
          <span className="auth-eyebrow"><i /> A BETTER TOMORROW STARTS HERE</span>
          <h1>Make room for<br /><em>what matters.</em></h1>
          <p>A calmer, clearer way to understand your money and plan what comes next.</p>
        </div>
        <span className="auth-image-caption">YOUR MONEY, IN A GOOD PLACE</span>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand"><Brand className="auth-brand" href="#login" /></div>
        <section className="auth-panel">
          {isProfile && <button className="auth-back" type="button" onClick={onCancelProfile}>← <span>Back to dashboard</span></button>}
          <div className="auth-heading">
            <span className="auth-step">{isProfile ? "YOUR ACCOUNT" : isRegistration ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2>{isProfile ? "Your profile" : otpEmail ? "Check your email" : isRegistration ? "Create your account" : "Good to see you."}</h2>
            <p>{isProfile ? "Keep your personal details up to date." : otpEmail ? "Enter the verification code to continue." : isRegistration ? "A few details, then your money has a home." : "Sign in securely with your email address."}</p>
          </div>
          {otpEmail ? (
            <EmailOtpForm email={otpEmail} onVerify={onVerifyOtp} onResend={onResendOtp} onCancel={onCancelOtp} />
          ) : mode === "login" ? (
            <LoginForm onSendCode={onLogin} onModeChange={onModeChange} />
          ) : (
            <ProfileForm mode={mode} profile={profile} onRegister={onRegister} onSaveProfile={onSaveProfile} onModeChange={onModeChange} onLogout={onLogout} />
          )}
          <p className="auth-legal">Your account is protected by email verification.</p>
        </section>
      </main>
    </div>
  );
}
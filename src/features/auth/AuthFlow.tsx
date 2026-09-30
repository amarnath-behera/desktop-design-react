import { useState } from "react";
import { Brand } from "../../components/Brand";
import { LoginForm } from "./components/LoginForm";
import { ProfileForm } from "./components/ProfileForm";
import type { AuthMode, UserProfile } from "./types";

export type { AuthMode, UserProfile } from "./types";

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

export function AuthFlow({ mode, profiles, profile, onLogin, onRegister, onSaveProfile, onModeChange, onCancelProfile, onLogout }: AuthFlowProps) {
  const [isOtpStep, setIsOtpStep] = useState(false);
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
            <h2>{isProfile ? "Your profile" : isRegistration ? "Create your account" : isOtpStep ? "Check your email" : "Good to see you."}</h2>
            <p>{isProfile ? "Keep your personal details up to date." : isRegistration ? "A few details, then your money has a home." : isOtpStep ? "Enter the 4-digit code to continue." : "Sign in securely with your mobile number."}</p>
          </div>
          {mode === "login" ? <LoginForm profiles={profiles} onLogin={onLogin} onModeChange={onModeChange} onOtpStateChange={setIsOtpStep} /> : <ProfileForm mode={mode} profiles={profiles} profile={profile} onRegister={onRegister} onSaveProfile={onSaveProfile} onModeChange={onModeChange} onLogout={onLogout} />}
          <p className="auth-legal">Your information stays on this device in this demo.</p>
        </section>
      </main>
    </div>
  );
}
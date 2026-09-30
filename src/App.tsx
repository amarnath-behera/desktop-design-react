import { useState } from "react";
import { AuthFlow, type AuthMode, type UserProfile } from "./features/auth/AuthFlow";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import "./App.css";

const profilesStorageKey = "morrow-demo-profiles";
const sessionStorageKey = "morrow-demo-session";

function loadProfiles(): UserProfile[] {
  try {
    return JSON.parse(window.localStorage.getItem(profilesStorageKey) ?? "[]") as UserProfile[];
  } catch {
    return [];
  }
}

function loadSession(): UserProfile | null {
  try {
    const session = window.localStorage.getItem(sessionStorageKey);
    return session ? JSON.parse(session) as UserProfile : null;
  } catch {
    return null;
  }
}

type AppPage = AuthMode | "dashboard";

function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(loadSession);
  const [page, setPage] = useState<AppPage>(() => loadSession() ? "dashboard" : "login");

  function persistProfiles(nextProfiles: UserProfile[]) {
    setProfiles(nextProfiles);
    window.localStorage.setItem(profilesStorageKey, JSON.stringify(nextProfiles));
  }

  function signIn(profile: UserProfile) {
    setCurrentProfile(profile);
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(profile));
    setPage("dashboard");
  }

  function register(profile: UserProfile) {
    persistProfiles([...profiles, profile]);
    signIn(profile);
  }

  function saveProfile(profile: UserProfile) {
    const nextProfiles = profiles.map((savedProfile) =>
      savedProfile.mobile === currentProfile?.mobile ? profile : savedProfile,
    );
    persistProfiles(nextProfiles);
    signIn(profile);
  }

  function signOut() {
    window.localStorage.removeItem(sessionStorageKey);
    setCurrentProfile(null);
    setPage("login");
  }

  if (page === "dashboard" && currentProfile) {
    return <DashboardPage profile={currentProfile} onOpenProfile={() => setPage("profile")} />;
  }

  return (
    <AuthFlow
      key={page}
      mode={page === "dashboard" ? "login" : page}
      profiles={profiles}
      profile={page === "profile" ? currentProfile ?? undefined : undefined}
      onLogin={signIn}
      onRegister={register}
      onSaveProfile={saveProfile}
      onModeChange={setPage}
      onCancelProfile={() => setPage("dashboard")}
      onLogout={signOut}
    />
  );
}

export default App;
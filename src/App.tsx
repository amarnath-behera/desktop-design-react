import { useEffect, useEffectEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthFlow, type AuthMode, type UserProfile } from "./features/auth/AuthFlow";
import { normalizeMobile } from "./features/auth/types";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { createDashboardStorageKey } from "./features/dashboard/dashboardData";
import { supabaseDashboardRepository } from "./features/dashboard/supabaseDashboardRepository";
import { supabase } from "./lib/supabase";
import "./App.css";

const profilesStorageKey = "morrow-demo-profiles";

function loadProfiles(): UserProfile[] {
  try {
    return JSON.parse(window.localStorage.getItem(profilesStorageKey) ?? "[]") as UserProfile[];
  } catch {
    return [];
  }
}

type ProfileRow = {
  id: string;
  email: string;
  mobile: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  monthly_income: number | string;
};

function isProfileComplete(profile: UserProfile) {
  return Boolean(
    profile.firstName.trim()
    && profile.lastName.trim()
    && profile.dateOfBirth
    && profile.gender
    && /^[6-9]\d{9}$/.test(normalizeMobile(profile.mobile))
    && profile.email,
  );
}

function profileFromMetadata(user: User): UserProfile {
  const metadata = user.user_metadata;
  return {
    id: user.id,
    firstName: typeof metadata.first_name === "string" ? metadata.first_name : "",
    lastName: typeof metadata.last_name === "string" ? metadata.last_name : "",
    dateOfBirth: typeof metadata.date_of_birth === "string" ? metadata.date_of_birth : "",
    gender: typeof metadata.gender === "string" ? metadata.gender : "",
    mobile: typeof metadata.mobile === "string" ? normalizeMobile(metadata.mobile) : "",
    email: user.email ?? "",
    monthlyIncome: Number(metadata.monthly_income) || 0,
    additionalIncomes: Array.isArray(metadata.additional_incomes) ? metadata.additional_incomes : [],
  };
}

async function loadRemoteProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) throw new Error("Supabase is not configured. Add the project URL and publishable key to .env.local.");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as ProfileRow;
  const { data: incomes, error: incomesError } = await supabase
    .from("additional_incomes")
    .select("id, amount, income_month")
    .eq("user_id", userId);
  if (incomesError) throw incomesError;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    mobile: row.mobile,
    email: row.email,
    monthlyIncome: Number(row.monthly_income),
    additionalIncomes: (incomes ?? []).map((income) => ({
      id: income.id,
      amount: Number(income.amount),
      month: income.income_month,
    })),
  };
}

async function saveRemoteProfile(userId: string, profile: UserProfile) {
  if (!supabase) throw new Error("Supabase is not configured. Add the project URL and publishable key to .env.local.");
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    email: profile.email.trim().toLowerCase(),
    mobile: normalizeMobile(profile.mobile),
    first_name: profile.firstName.trim(),
    last_name: profile.lastName.trim(),
    date_of_birth: profile.dateOfBirth,
    gender: profile.gender,
    monthly_income: Number(profile.monthlyIncome ?? 0),
  }, { onConflict: "id" });
  if (error) throw error;

  const { error: deleteError } = await supabase.from("additional_incomes").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;
  const incomes = profile.additionalIncomes ?? [];
  if (incomes.length > 0) {
    const { error: insertError } = await supabase.from("additional_incomes").insert(incomes.map((income) => ({
      id: income.id,
      user_id: userId,
      amount: income.amount,
      income_month: income.month,
    })));
    if (insertError) throw insertError;
  }
}

function toAuthMetadata(profile: UserProfile) {
  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    mobile: normalizeMobile(profile.mobile),
    date_of_birth: profile.dateOfBirth,
    gender: profile.gender,
    monthly_income: Number(profile.monthlyIncome ?? 0),
    additional_incomes: profile.additionalIncomes ?? [],
  };
}

type AppPage = AuthMode | "dashboard";

function App() {
  const [profiles] = useState<UserProfile[]>(loadProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [page, setPage] = useState<AppPage>("login");
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<UserProfile | null>(null);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);

  async function activateUser(user: User, registrationProfile?: UserProfile | null) {
    const remoteProfile = await loadRemoteProfile(user.id);
    const legacyProfile = profiles.find((savedProfile) => savedProfile.email.toLowerCase() === user.email?.toLowerCase());
    const profile = remoteProfile ?? registrationProfile ?? legacyProfile ?? profileFromMetadata(user);
    const authenticatedProfile = { ...profile, id: user.id, email: user.email ?? profile.email };

    setAuthenticatedUserId(user.id);
    setCurrentProfile(authenticatedProfile);
    if (!isProfileComplete(authenticatedProfile)) {
      setPage("profile");
      return;
    }

    if (!remoteProfile) await saveRemoteProfile(user.id, authenticatedProfile);
    const legacyKey = createDashboardStorageKey(normalizeMobile(authenticatedProfile.mobile));
    if (supabaseDashboardRepository) {
      const dashboardKey = createDashboardStorageKey(user.id);
      await supabaseDashboardRepository.load(dashboardKey, legacyKey);
    }
    setCurrentProfile(authenticatedProfile);
    setPage("dashboard");
  }

  const restoreSession = useEffectEvent(async (user: User) => {
    try {
      await activateUser(user);
    } catch (error) {
      console.error("Unable to initialize the Supabase user profile.", error);
    }
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (active && data.session) void restoreSession(data.session.user);
    }).catch((error: unknown) => console.error("Unable to restore the Supabase session.", error));
    return () => { active = false; };
  }, []);

  async function requestOtp(email: string, registrationProfile?: UserProfile | null) {
    if (!supabase) throw new Error("Supabase is not configured. Add the project URL and publishable key to .env.local.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: Boolean(registrationProfile),
        ...(registrationProfile ? { data: toAuthMetadata(registrationProfile) } : {}),
      },
    });
    if (error?.message.toLowerCase().includes("signups not allowed for otp") && !registrationProfile) {
      throw new Error("No Morrow account exists for this email yet. Choose Create an account to register.");
    }
    if (error) throw error;
    setOtpEmail(email);
    setPendingRegistration(registrationProfile ?? null);
    setPage("login");
  }

  async function verifyOtp(token: string) {
    if (!supabase || !otpEmail) throw new Error("Request a verification code first.");
    const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token, type: "email" });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase did not return a signed-in user.");
    await activateUser(data.user, pendingRegistration);
    setOtpEmail(null);
    setPendingRegistration(null);
  }

  async function resendOtp() {
    if (!otpEmail) throw new Error("Request a verification code first.");
    await requestOtp(otpEmail, pendingRegistration);
  }

  async function saveProfile(profile: UserProfile) {
    if (!authenticatedUserId) throw new Error("Sign in before saving your profile.");
    const authenticatedProfile = { ...profile, id: authenticatedUserId };
    await saveRemoteProfile(authenticatedUserId, authenticatedProfile);
    setCurrentProfile(authenticatedProfile);
    if (supabaseDashboardRepository) {
      const legacyKey = createDashboardStorageKey(normalizeMobile(authenticatedProfile.mobile));
      const dashboardKey = createDashboardStorageKey(authenticatedUserId);
      await supabaseDashboardRepository.load(dashboardKey, legacyKey);
    }
    setPage("dashboard");
  }

  function cancelOtp() {
    setOtpEmail(null);
    setPendingRegistration(null);
  }

  function signOut() {
    void supabase?.auth.signOut();
    setAuthenticatedUserId(null);
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
      profile={page === "profile" ? currentProfile ?? undefined : undefined}
      otpEmail={otpEmail}
      onLogin={(email) => requestOtp(email)}
      onVerifyOtp={verifyOtp}
      onResendOtp={resendOtp}
      onCancelOtp={cancelOtp}
      onRegister={(profile) => requestOtp(profile.email.trim().toLowerCase(), profile)}
      onSaveProfile={saveProfile}
      onModeChange={setPage}
      onCancelProfile={() => setPage(currentProfile ? "dashboard" : "login")}
      onLogout={signOut}
    />
  );
}

export default App;
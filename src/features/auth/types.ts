export type AuthMode = "login" | "register" | "profile";

export type UserProfile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
};

export const emptyProfile: UserProfile = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
};

export function normalizeMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
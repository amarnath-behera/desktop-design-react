export type AuthMode = "login" | "register" | "profile";

export type AdditionalIncomeEntry = {
  id: string;
  amount: number;
  month: string;
};

export type UserProfile = {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
  monthlyIncome?: number | undefined;
  additionalIncomes?: AdditionalIncomeEntry[];
};

export const emptyProfile: UserProfile = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
  additionalIncomes: [],
};

export function normalizeMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
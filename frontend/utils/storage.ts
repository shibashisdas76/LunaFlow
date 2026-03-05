
import { PeriodLog, UserProfile, User } from "../types";

const LOGS_PREFIX = 'lunaflow_logs_';
const PROFILE_PREFIX = 'lunaflow_profile_';
const USERS_KEY = 'lunaflow_registered_users';
const SESSION_KEY = 'lunaflow_current_session';

// User Management
export const registerUser = (user: User): boolean => {
  const users = getUsers();
  if (users.find(u => u.email === user.email)) return false;
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const getSession = (): User | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Data Scoped by User ID
export const saveLogs = (userId: string, logs: PeriodLog[]) => {
  localStorage.setItem(`${LOGS_PREFIX}${userId}`, JSON.stringify(logs));
};

export const getLogs = (userId: string): PeriodLog[] => {
  const data = localStorage.getItem(`${LOGS_PREFIX}${userId}`);
  return data ? JSON.parse(data) : [];
};

export const saveProfile = (userId: string, profile: UserProfile) => {
  localStorage.setItem(`${PROFILE_PREFIX}${userId}`, JSON.stringify(profile));
};

export const getProfile = (userId: string): UserProfile | null => {
  const data = localStorage.getItem(`${PROFILE_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
};

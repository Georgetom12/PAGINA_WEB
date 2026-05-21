export type UserRole = "ADMIN" | "PRO" | "BÁSICO";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const ROLE_META: Record<UserRole, { label: string; color: string; desc: string }> = {
  ADMIN:  { label: "ADMINISTRADOR", color: "#ffd700", desc: "Acceso total + panel de gestión" },
  PRO:    { label: "PRO",           color: "#00e5ff", desc: "Acceso a todos los módulos" },
  BÁSICO: { label: "BÁSICO",        color: "#00e676", desc: "Acceso a módulos N1 y N2" },
};

export const LEVEL_ACCESS: Record<UserRole, string[]> = {
  ADMIN:  ["N1","N2","N3","N4","N5","N6","N7","N8"],
  PRO:    ["N1","N2","N3","N4","N5","N6","N7","N8"],
  BÁSICO: ["N1","N2"],
};

const STORAGE_KEY = "psy_users";
const SESSION_KEY = "psy_session";

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function initStorage(): void {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

export function getUsers(): User[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function login(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
  );
  if (user) {
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
}

export function createUser(username: string, password: string, role: UserRole, displayName?: string): User {
  const users = getUsers();
  const newUser: User = {
    id: genId(),
    username: username.trim().toUpperCase(),
    password: password.trim(),
    role,
    displayName: displayName?.trim() || username.trim(),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveUsers([...users, newUser]);
  return newUser;
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

export function updateUser(id: string, updates: Partial<Pick<User, "username" | "password" | "displayName" | "role">>): void {
  const users = getUsers().map((u) => u.id === id ? { ...u, ...updates } : u);
  saveUsers(users);
}

export function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return "PSY-" + pwd.slice(0, 4) + "-" + pwd.slice(4);
}

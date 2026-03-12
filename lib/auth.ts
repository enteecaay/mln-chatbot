export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  emailVerified: boolean;
  verificationCode?: string;
  createdAt: string;
};

export function hashPassword(password: string): string {
  let hash = 0;
  const salted = "chatbot_salt_2024_" + password;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + salted.length.toString(36);
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ─── Validation ─────────────────────────────────────────────────────────────
export function validateEmail(email: string): string | null {
  if (!email) return "Email không được để trống";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Email không hợp lệ";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Mật khẩu không được để trống";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(password)) return "Phải có ít nhất 1 chữ hoa";
  if (!/[0-9]/.test(password)) return "Phải có ít nhất 1 chữ số";
  if (!/[^A-Za-z0-9]/.test(password)) return "Phải có ít nhất 1 ký tự đặc biệt";
  return null;
}

export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);

  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  return { score, label: labels[score], color: colors[score] };
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Tên không được để trống";
  if (name.trim().length < 2) return "Tên phải có ít nhất 2 ký tự";
  return null;
}

// ─── Verification code ───────────────────────────────────────────────────────
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── localStorage helpers ────────────────────────────────────────────────────
const USERS_KEY = "chatbot_users";
const SESSION_KEY = "chatbot_session";

export function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserByEmail(email: string): User | null {
  return (
    getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
    null
  );
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
}): User {
  const users = getUsers();
  const code = generateVerificationCode();
  const user: User = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash: hashPassword(data.password),
    emailVerified: false,
    verificationCode: code,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  // Cập nhật session nếu đang đăng nhập
  const session = getSession();
  if (session?.id === id) {
    saveSession(users[idx]);
  }
  return users[idx];
}

// ─── Session ─────────────────────────────────────────────────────────────────
export function getSession(): User | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

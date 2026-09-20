/**
 * Dedicated Admin Authentication Module
 * Decoupled from Firebase Auth to avoid unauthorized domain or provider configuration issues.
 */

const ADMIN_EMAIL = 'rajatb419@gmail.com';
const STORAGE_KEY_SESSION = 'igl_admin_session_v1';
const STORAGE_KEY_CUSTOM_PASS = 'igl_admin_custom_password';

// Accepted passwords: default password or user-customized password
const DEFAULT_PASSWORDS = ['rajat123', 'admin123', 'admin12345', 'rajat@123'];

export interface AdminUser {
  email: string;
  role: 'admin';
  authenticatedAt: string;
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

export function getStoredCustomPassword(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CUSTOM_PASS);
  } catch {
    return null;
  }
}

export function setCustomAdminPassword(newPass: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PASS, newPass);
  } catch (err) {
    console.error('Failed to persist admin password:', err);
  }
}

/**
 * Validate credentials against Admin email and accepted passwords
 */
export function verifyAdminCredentials(inputEmail: string, inputPass: string): { success: boolean; message?: string } {
  const cleanEmail = inputEmail.trim().toLowerCase();
  const cleanPass = inputPass.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Email and password are both required.' };
  }

  if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: `Unauthorized email address. Only ${ADMIN_EMAIL} is authorized.` };
  }

  const customPass = getStoredCustomPassword();
  const isValidPass =
    (customPass && cleanPass === customPass) ||
    DEFAULT_PASSWORDS.includes(cleanPass);

  if (!isValidPass) {
    return {
      success: false,
      message: 'Incorrect admin password. Default password is: rajat123'
    };
  }

  return { success: true };
}

/**
 * Get the currently authenticated admin session from localStorage
 */
export function getActiveAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    if (parsed && parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && parsed.role === 'admin') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save an active session
 */
export function saveAdminSession(): AdminUser {
  const session: AdminUser = {
    email: ADMIN_EMAIL,
    role: 'admin',
    authenticatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
  return session;
}

/**
 * Clear admin session (Sign Out)
 */
export function destroyAdminSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (err) {
    console.error('Failed to destroy session:', err);
  }
}

/**
 * Auth Service — Mock authentication service
 * Replace with Firebase Auth in production.
 */

import { User, UserRole } from '../types/user';
export type LoginResponse = { user?: User; requiresOtp?: boolean; challengeId?: string; tempUser?: User };

export interface AuthService {
  login(email: string, password: string, role: UserRole): Promise<LoginResponse>;
  register(name: string, email: string, password: string, institution: string): Promise<LoginResponse>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
  requestStudentOtp(email: string): Promise<{ success: boolean; challengeId: string }>;
  verifyStudentOtp(challengeId: string, otp: string, tempUser: User): Promise<User>;
}

const STUDENT_EMAIL_REGEX = /^[0-9]{9}\.simats@saveetha\.com$/;

export function validateStudentEmail(email: string): boolean {
  return STUDENT_EMAIL_REGEX.test(email);
}

class MockAuthService implements AuthService {
  private currentUser: User | null = null;

  async login(email: string, password: string, role: UserRole): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      if (data.requiresOtp) {
        return { requiresOtp: true, challengeId: data.challengeId, tempUser: data.tempUser };
      }

      this.currentUser = data.user;
      localStorage.setItem('academicverify_user', JSON.stringify(data.user));
      return { user: data.user };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async register(name: string, email: string, password: string, institution: string): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, institution }),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      return { requiresOtp: true, challengeId: data.challengeId, tempUser: data.tempUser };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem('academicverify_user');
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('academicverify_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    return null;
  }

  async requestStudentOtp(email: string): Promise<{ success: boolean; challengeId: string }> {
    try {
      const response = await fetch('/api/auth/student/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP.');
      }
      return { success: true, challengeId: data.challengeId };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async verifyStudentOtp(challengeId: string, otp: string, tempUser: User): Promise<User> {
    try {
      const response = await fetch('/api/auth/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'OTP Verification Failed.');
      }
      
      // Verification successful, establish session using backend user
      const activatedUser = data.user || { ...tempUser, status: 'active' as const };
      this.currentUser = activatedUser;
      localStorage.setItem('academicverify_user', JSON.stringify(activatedUser));

      return activatedUser;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

export const authService: AuthService = new MockAuthService();

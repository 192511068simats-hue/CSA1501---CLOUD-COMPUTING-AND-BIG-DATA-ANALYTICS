const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ActivityLog {
  id: string;
  userId: string;
  userRole: 'student' | 'admin' | 'institution';
  userName: string;
  action: string;
  entityType: 'user' | 'certificate' | 'verification' | 'blockchain' | 'authentication';
  entityId?: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

export interface AdminStats {
  totalCertificates: number;
  verified: number;
  pending: number;
  revoked: number;
  totalStudents: number;
  activeStudents: number;
  integrityAlerts: number;
  blockchainRecords: number;
}

export const adminService = {
  getDashboardStats: async (): Promise<AdminStats> => {
    const res = await fetch(`${API_URL}/admin/dashboard`);
    return await res.json();
  },
  
  getStudents: async () => {
    const res = await fetch(`${API_URL}/admin/students`);
    return await res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`);
    return await res.json();
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const res = await fetch(`${API_URL}/admin/activity`);
    return await res.json();
  }
};

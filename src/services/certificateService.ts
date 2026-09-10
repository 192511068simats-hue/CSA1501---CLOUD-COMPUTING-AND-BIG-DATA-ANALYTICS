/**
 * Certificate Service — Certificate CRUD operations
 * Replace with Firebase Firestore in production.
 */

import { Certificate, CertificateFormData } from '../types/certificate';

export interface CertificateService {
  getAll(): Promise<Certificate[]>;
  getById(certificateId: string): Promise<Certificate | null>;
  create(data: CertificateFormData, file: File, hash: string, userId?: string, userName?: string, userRole?: string): Promise<Certificate>;
  revoke(certificateId: string, reason: string): Promise<Certificate>;
  approve(certificateId: string, adminId?: string, adminName?: string): Promise<Certificate>;
  reject(certificateId: string, reason: string, adminId?: string, adminName?: string): Promise<Certificate>;
  simulateTamper(certificateId: string, adminId?: string, adminName?: string): Promise<Certificate>;
  restoreFromBlockchain(certificateId: string): Promise<Certificate>;
  search(query: string): Promise<Certificate[]>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class RealCertificateService implements CertificateService {
  async getAll(): Promise<Certificate[]> {
    const res = await fetch(`${API_URL}/certificates`);
    return await res.json();
  }

  async getById(certificateId: string): Promise<Certificate | null> {
    const certs = await this.getAll();
    return certs.find((c) => c.certificateId === certificateId) || null;
  }

  async create(data: CertificateFormData, file: File, hash: string, userId?: string, userName?: string, userRole?: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { ...data, fileName: file.name, fileSize: file.size }, hash, userId, userName, userRole }),
    });
    const result = await res.json();
    
    // Certificate stays pending — no auto-approve. Admin must approve.
    return result.certificate;
  }

  async revoke(certificateId: string, reason: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates/${certificateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'revoked', reason }), 
    });
    const result = await res.json();
    return result.certificate;
  }

  async approve(certificateId: string, adminId?: string, adminName?: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates/${certificateId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminId || 'admin', adminName: adminName || 'Admin' }),
    });
    const result = await res.json();
    return result.certificate;
  }

  async reject(certificateId: string, reason: string, adminId?: string, adminName?: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates/${certificateId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminId || 'admin', adminName: adminName || 'Admin', reason }),
    });
    const result = await res.json();
    return result.certificate;
  }

  async simulateTamper(certificateId: string, adminId?: string, adminName?: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates/${certificateId}/simulate-tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminId || 'admin', adminName: adminName || 'Admin' }),
    });
    const result = await res.json();
    return result.certificate;
  }

  async restoreFromBlockchain(certificateId: string): Promise<Certificate> {
    const res = await fetch(`${API_URL}/certificates/${certificateId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
    return result.certificate;
  }

  async search(query: string): Promise<Certificate[]> {
    const certs = await this.getAll();
    const q = query.toLowerCase();
    return certs.filter(
      (c) =>
        c.certificateId.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.registerNumber.toLowerCase().includes(q) ||
        c.institution.toLowerCase().includes(q)
    );
  }
}

export const certificateService: CertificateService = new RealCertificateService();

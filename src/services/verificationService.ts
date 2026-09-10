/**
 * Verification Service — Certificate verification logic
 * Combines certificate lookup with blockchain record comparison.
 */

import { VerificationResponse, VerificationMethod, VerificationRecord } from '../types/blockchain';
import { certificateService } from './certificateService';
import { blockchainService } from './blockchainService';
import { mockVerificationRecords } from '../data/mockData';

export interface VerifyService {
  verifyCertificate(certificateId: string, method: VerificationMethod, user?: any): Promise<VerificationResponse>;
  getVerificationHistory(): Promise<VerificationRecord[]>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class RealVerificationService implements VerifyService {
  async verifyCertificate(
    certificateId: string,
    method: VerificationMethod,
    user?: any
  ): Promise<VerificationResponse> {
    const cert = await certificateService.getById(certificateId);

    if (!cert) {
      await this.recordVerification(certificateId, method, 'not_found', user);
      return {
        result: 'not_found',
        certificateId,
        integrityStatus: 'unknown',
        message: 'No certificate was found with this Certificate ID. Please check the ID and try again.',
      };
    }

    if (cert.certificateStatus === 'revoked') {
      await this.recordVerification(certificateId, method, 'revoked', user);
      return {
        result: 'revoked',
        certificateId: cert.certificateId,
        certificateStatus: cert.certificateStatus,
        integrityStatus: 'unknown',
        certificate: cert,
        message: 'This certificate was previously registered but has been marked as revoked by the issuing institution.',
      };
    }

    if (cert.certificateStatus === 'pending') {
      await this.recordVerification(certificateId, method, 'pending', user);
      return {
        result: 'pending',
        certificateId: cert.certificateId,
        certificateStatus: cert.certificateStatus,
        integrityStatus: 'unknown',
        certificate: cert,
        message: 'This certificate is currently pending verification and blockchain registration.',
      };
    }

    const blockchainRecord = await blockchainService.getCertificate(certificateId);
    
    const originalHash = blockchainRecord ? blockchainRecord.hash : 'Unavailable';
    const currentHash = cert.sha256Hash;
    const hashMatch = blockchainRecord ? originalHash === currentHash : false;
    const integrityStatus = hashMatch ? 'authentic' : 'tampered';

    if (!hashMatch) {
      await this.recordVerification(certificateId, method, 'tampered', user);
      return {
        result: 'tampered',
        certificateId: cert.certificateId,
        certificateStatus: cert.certificateStatus as any,
        integrityStatus,
        originalHash,
        currentHash,
        hashMatch,
        blockchainRecordId: blockchainRecord?.transactionHash,
        blockchainStatus: blockchainRecord ? 'confirmed' : 'unavailable',
        registeredAt: blockchainRecord?.timestamp || cert.createdAt,
        verifiedAt: new Date().toISOString(),
        certificate: cert,
        blockchain: blockchainRecord,
        message: 'The certificate fingerprint does not match the registered blockchain record.',
      };
    }

    await this.recordVerification(certificateId, method, 'authentic', user);

    return {
      result: 'authentic',
      certificateId: cert.certificateId,
      certificateStatus: cert.certificateStatus as any,
      integrityStatus,
      originalHash,
      currentHash,
      hashMatch,
      blockchainRecordId: blockchainRecord?.transactionHash,
      blockchainStatus: 'confirmed',
      registeredAt: blockchainRecord?.timestamp || cert.createdAt,
      verifiedAt: new Date().toISOString(),
      certificate: cert,
      blockchain: blockchainRecord,
      message: 'This certificate matches the registered blockchain record.',
    };
  }

  async getVerificationHistory(): Promise<VerificationRecord[]> {
    const res = await fetch(`${API_URL}/verifications`);
    return await res.json();
  }

  private async recordVerification(
    certificateId: string,
    method: VerificationMethod,
    result: VerificationRecord['result'],
    user?: any
  ): Promise<void> {
    await fetch(`${API_URL}/verifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certificateId,
        method,
        result,
        userId: user?.id,
        userName: user?.name
      })
    });
  }
}

export const verificationService: VerifyService = new RealVerificationService();

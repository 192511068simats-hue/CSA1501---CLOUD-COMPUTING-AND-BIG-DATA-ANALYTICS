/**
 * Blockchain Service — Blockchain interaction with chain validation
 * Replace with ethers.js + smart contract in production.
 */

import { BlockchainRecord, ChainValidationResult } from '../types/blockchain';

export interface BlockchainService {
  connectWallet(): Promise<string>;
  registerCertificate(certificateId: string, hash: string): Promise<BlockchainRecord>;
  getCertificate(certificateId: string): Promise<BlockchainRecord | null>;
  revokeCertificate(certificateId: string): Promise<void>;
  verifyCertificate(certificateId: string, hash: string): Promise<boolean>;
  getAllRecords(): Promise<BlockchainRecord[]>;
  validateChain(): Promise<ChainValidationResult>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class RealBlockchainService implements BlockchainService {
  async connectWallet(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
  }

  async registerCertificate(certificateId: string, hash: string): Promise<BlockchainRecord> {
    const res = await fetch(`${API_URL}/blockchain/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certificateId,
        certificateHash: hash,
        action: 'CERTIFICATE_REGISTERED',
        actor: 'System',
      }),
    });
    const data = await res.json();
    return data.record;
  }

  async getCertificate(certificateId: string): Promise<BlockchainRecord | null> {
    const records = await this.getAllRecords();
    return records.find((r) => r.certificateId === certificateId) || null;
  }

  async revokeCertificate(_certificateId: string): Promise<void> {
    // Usually a transaction that writes to the blockchain contract. Mocked delay here.
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  async verifyCertificate(certificateId: string, hash: string): Promise<boolean> {
    const record = await this.getCertificate(certificateId);
    if (!record) return false;
    return record.hash === hash;
  }

  async getAllRecords(): Promise<BlockchainRecord[]> {
    const res = await fetch(`${API_URL}/blockchain`);
    return await res.json();
  }

  async validateChain(): Promise<ChainValidationResult> {
    const res = await fetch(`${API_URL}/blockchain/validate`);
    return await res.json();
  }
}

export const blockchainService: BlockchainService = new RealBlockchainService();

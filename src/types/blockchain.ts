export type VerificationResult = 'authentic' | 'tampered' | 'revoked' | 'not_found' | 'pending' | 'error' | 'timeout';

export type VerificationMethod = 'certificate_id' | 'qr_code';

export interface BlockchainRecord {
  id: string;
  certificateId: string;
  hash: string;
  network: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  // Chain fields
  blockIndex?: number;
  previousHash?: string;
  currentHash?: string;
  transactionId?: string;
  action?: string;
  actor?: string;
}

export interface BlockValidation {
  blockIndex: number;
  certificateId: string;
  valid: boolean;
  hashValid: boolean;
  previousHashValid: boolean;
  expectedHash?: string;
  actualHash?: string;
  message?: string;
}

export interface ChainValidationResult {
  valid: boolean;
  totalBlocks: number;
  validBlocks: number;
  invalidBlocks: number;
  blocks: BlockValidation[];
}

export interface VerificationRecord {
  id: string;
  certificateId: string;
  method: VerificationMethod;
  result: VerificationResult;
  timestamp: string;
  verifierIp?: string;
}

export interface IntegrityVerificationResult {
  result: VerificationResult;
  certificateId?: string;
  certificateStatus?: 'active' | 'pending' | 'revoked';
  integrityStatus?: 'authentic' | 'tampered' | 'unknown';
  originalHash?: string;
  currentHash?: string;
  hashMatch?: boolean;
  blockchainRecordId?: string;
  blockchainStatus?: 'confirmed' | 'not_found' | 'unavailable';
  registeredAt?: string;
  verifiedAt?: string;
  message: string;
  certificate?: any;
  blockchain?: any;
  revocation?: {
    revokedAt: string;
    reason: string;
  };
}

export type VerificationResponse = IntegrityVerificationResult;

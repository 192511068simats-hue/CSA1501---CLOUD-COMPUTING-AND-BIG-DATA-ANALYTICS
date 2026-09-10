export type CertificateStatus = 'active' | 'pending' | 'revoked';

export type BlockchainStatus = 'registered' | 'pending' | 'failed';

export type CertificateType =
  | 'Degree Certificate'
  | 'Provisional Certificate'
  | 'Course Certificate'
  | 'Academic Transcript';

export interface Certificate {
  id: string;
  certificateId: string;
  studentName: string;
  registerNumber: string;
  degree: string;
  department: string;
  institution: string;
  certificateType: CertificateType;
  academicYear: string;
  issueDate: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  sha256Hash: string;
  blockchainStatus: BlockchainStatus;
  blockchainTransaction: string;
  certificateStatus: CertificateStatus;
  createdAt: string;
  // Approval / rejection fields
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  // Tamper demo: original hash before tampering
  originalHash?: string;
}

export interface CertificateFormData {
  studentName: string;
  registerNumber: string;
  degree: string;
  department: string;
  institution: string;
  certificateType: CertificateType;
  academicYear: string;
  issueDate: string;
}

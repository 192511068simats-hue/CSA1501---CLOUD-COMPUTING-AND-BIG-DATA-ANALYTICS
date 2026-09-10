import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'institution';
  passwordHash: string; // Plaintext for now since no bcrypt installed, but named hash for semantics
  studentId?: string;
  institution?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

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

export interface DbSchema {
  users: UserRecord[];
  certificates: any[];
  blockchainRecords: any[];
  verificationRecords: any[];
  activityLogs: ActivityLog[];
}

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

export function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const seedUsers: UserRecord[] = [
      {
        id: 'usr-001',
        name: 'Leo Leenas',
        email: 'admin@academicverify.io',
        role: 'admin',
        institution: 'AcademicVerify Platform',
        status: 'active',
        passwordHash: 'demo', // Legacy mock password
        createdAt: '2025-08-01T10:00:00Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-002',
        name: 'Dr. Priya Venkatesh',
        email: 'priya@northstar.edu.in',
        role: 'institution',
        institution: 'Northstar Institute of Technology',
        status: 'active',
        passwordHash: 'demo',
        createdAt: '2025-09-15T09:00:00Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-003',
        name: 'Prof. Ramesh Iyer',
        email: 'ramesh@crescent.edu.in',
        role: 'institution',
        institution: 'Crescent University',
        status: 'active',
        passwordHash: 'demo',
        createdAt: '2025-10-01T08:00:00Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-004',
        name: 'Aarav Kumar',
        email: '192511068.simats@saveetha.com',
        studentId: '192511068',
        role: 'student',
        institution: 'Northstar Institute of Technology',
        status: 'active',
        passwordHash: 'demo',
        createdAt: '2026-01-10T10:00:00Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-005',
        name: 'Diya Sharma',
        email: '192511069.simats@saveetha.com',
        studentId: '192511069',
        role: 'student',
        institution: 'Crescent University',
        status: 'active',
        passwordHash: 'demo',
        createdAt: '2026-02-14T09:30:00Z',
        lastLogin: new Date().toISOString(),
      }
    ];

    const initialDb: DbSchema = {
      users: seedUsers,
      certificates: [],
      blockchainRecords: [],
      verificationRecords: [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          userId: 'usr-001',
          userRole: 'admin',
          userName: 'Leo Leenas',
          action: 'Admin Dashboard Initialized',
          entityType: 'authentication',
          description: 'System seeded with initial data',
          status: 'success',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  } else {
    // Migration: If existing DB is just array of users, migrate to DbSchema
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (Array.isArray(data)) {
        const migrated: DbSchema = {
          users: data,
          certificates: [],
          blockchainRecords: [],
          verificationRecords: [],
          activityLogs: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(migrated, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Failed to migrate db', e);
    }
  }
}

export function getDb(): DbSchema {
  if (!fs.existsSync(DB_PATH)) initDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(db: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function getAllUsers(): UserRecord[] {
  return getDb().users;
}

export function saveUser(user: UserRecord): void {
  const db = getDb();
  const index = db.users.findIndex(u => u.email === user.email);
  if (index >= 0) {
    db.users[index] = user;
  } else {
    db.users.push(user);
  }
  saveDb(db);
}

export function findUserByEmail(email: string): UserRecord | undefined {
  return getDb().users.find(u => u.email === email);
}

export function getAllCertificates() {
  return getDb().certificates;
}

export function getCertificateById(certificateId: string) {
  return getDb().certificates.find((c: any) => c.certificateId === certificateId);
}

export function saveCertificate(cert: any) {
  const db = getDb();
  const index = db.certificates.findIndex((c: any) => c.certificateId === cert.certificateId);
  if (index >= 0) db.certificates[index] = cert;
  else db.certificates.push(cert);
  saveDb(db);
}

export function getBlockchainRecords() {
  return getDb().blockchainRecords;
}

export function getBlockchainRecordByCertId(certificateId: string) {
  return getDb().blockchainRecords.find((r: any) => r.certificateId === certificateId);
}

export function saveBlockchainRecord(record: any) {
  const db = getDb();
  db.blockchainRecords.push(record);
  saveDb(db);
}

export function updateBlockchainRecord(record: any) {
  const db = getDb();
  const index = db.blockchainRecords.findIndex((r: any) => r.id === record.id);
  if (index >= 0) db.blockchainRecords[index] = record;
  saveDb(db);
}

export function getVerificationRecords() {
  return getDb().verificationRecords;
}

export function saveVerificationRecord(record: any) {
  const db = getDb();
  db.verificationRecords.unshift(record);
  saveDb(db);
}

export function getActivityLogs() {
  return getDb().activityLogs;
}

export function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
  const db = getDb();
  const newLog: ActivityLog = {
    ...log,
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString()
  };
  db.activityLogs.unshift(newLog); // prepend so newest is first
  saveDb(db);
  return newLog;
}

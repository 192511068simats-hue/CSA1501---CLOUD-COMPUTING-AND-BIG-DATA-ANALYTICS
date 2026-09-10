import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { generateOtp } from './otp/generateOtp.js';
import { createChallenge, verifyChallenge, getChallenge } from './otp/otpStore.js';
import { sendOtpEmail } from './email/resendClient.js';
import { initDb, findUserByEmail, saveUser, getAllUsers, getAllCertificates, getCertificateById, saveCertificate, getBlockchainRecords, getBlockchainRecordByCertId, saveBlockchainRecord, updateBlockchainRecord, getVerificationRecords, saveVerificationRecord, getActivityLogs, logActivity } from './data/dbStore.js';

// Setup SSE clients array
let sseClients: express.Response[] = [];

// Helper to broadcast SSE events
const broadcastEvent = (eventType: string, data: any) => {
  sseClients.forEach(client => {
    client.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  });
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb(); // Ensure DB is initialized on startup

// ==========================================
// BLOCKCHAIN HASH CHAIN HELPERS
// ==========================================

function computeBlockHash(blockData: {
  blockIndex: number;
  timestamp: string;
  certificateId: string;
  certificateHash: string;
  previousHash: string;
  transactionId: string;
  action: string;
}): string {
  const input = `${blockData.blockIndex}${blockData.timestamp}${blockData.certificateId}${blockData.certificateHash}${blockData.previousHash}${blockData.transactionId}${blockData.action}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

function generateTransactionId(certId: string): string {
  const hash = crypto.createHash('sha256').update(`${certId}-${Date.now()}-${Math.random()}`).digest('hex');
  return `TX-${new Date().getFullYear()}-${hash.substring(0, 8).toUpperCase()}`;
}

function createBlockchainBlock(certificateId: string, certificateHash: string, action: string, actor: string) {
  const existingRecords = getBlockchainRecords();
  const blockIndex = existingRecords.length;
  const previousHash = blockIndex > 0 ? (existingRecords[blockIndex - 1].currentHash || '0'.repeat(64)) : '0'.repeat(64);
  const transactionId = generateTransactionId(certificateId);
  const timestamp = new Date().toISOString();

  const currentHash = computeBlockHash({
    blockIndex,
    timestamp,
    certificateId,
    certificateHash,
    previousHash,
    transactionId,
    action,
  });

  const record = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    certificateId,
    hash: certificateHash,
    network: 'AcademicVerify Chain (Demo)',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
    blockNumber: blockIndex,
    timestamp,
    status: 'confirmed' as const,
    // Chain fields
    blockIndex,
    previousHash,
    currentHash,
    transactionId,
    action,
    actor,
  };

  saveBlockchainRecord(record);
  return record;
}

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, institution } = req.body;
    
    if (!email || !/^[0-9]{9}\.simats@saveetha\.com$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please use your official SIMATS student email.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    if (findUserByEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Email is already in use.' });
    }

    const studentId = normalizedEmail.substring(0, 9);
    
    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email: normalizedEmail,
      role: 'student' as const,
      studentId,
      institution,
      passwordHash: password, // TODO: Add bcrypt for production
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    saveUser(newUser);

    const otp = generateOtp();
    const emailResult = await sendOtpEmail(normalizedEmail, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
    }

    const challengeId = createChallenge(normalizedEmail, otp);
    
    // Omit password from response
    const { passwordHash, ...safeUser } = newUser;
    res.json({ success: true, challengeId, tempUser: safeUser });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing credentials.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    if (role === 'student' && !/^[0-9]{9}\.simats@saveetha\.com$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Student login requires a valid SIMATS institutional email.' });
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please register first.' });
    }
    
    if (user.role !== role) {
      return res.status(401).json({ success: false, message: 'Role mismatch. Please select the correct account type.' });
    }
    
    if (user.passwordHash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const { passwordHash, ...safeUser } = user;

    if (role === 'student') {
      const otp = generateOtp();
      const emailResult = await sendOtpEmail(normalizedEmail, otp);
      
      if (!emailResult.success) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
      }

      const challengeId = createChallenge(normalizedEmail, otp);
      return res.json({ success: true, requiresOtp: true, challengeId, tempUser: safeUser });
    }

    // Admin / Institution bypass OTP
    user.lastLogin = new Date().toISOString();
    saveUser(user);
    safeUser.lastLogin = user.lastLogin;
    
    // Log Activity
    logActivity({
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      action: `${user.name} logged in`,
      entityType: 'authentication',
      description: 'User completed password authentication',
      status: 'success'
    });
    
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/student/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    
    if (!normalizedEmail || !/^[0-9]{9}\.simats@saveetha\.com$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid student email format' });
    }

    const otp = generateOtp();
    const emailResult = await sendOtpEmail(normalizedEmail, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    const challengeId = createChallenge(normalizedEmail, otp);
    res.json({ success: true, challengeId });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/student/verify-otp', (req, res) => {
  try {
    const { challengeId, otp } = req.body;

    if (!challengeId || !otp) {
      return res.status(400).json({ success: false, message: 'Missing challenge ID or OTP' });
    }

    const verificationResult = verifyChallenge(challengeId, otp);

    if (verificationResult.success) {
      const challenge = getChallenge(challengeId);
      if (challenge) {
        const user = findUserByEmail(challenge.email);
        if (user) {
          user.status = 'active';
          user.lastLogin = new Date().toISOString();
          saveUser(user);
          
          logActivity({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: `${user.name} completed Student OTP verification`,
            entityType: 'authentication',
            description: 'OTP verified successfully',
            status: 'success'
          });
          
          const { passwordHash, ...safeUser } = user;
          return res.json({ success: true, user: safeUser });
        }
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: verificationResult.message });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// CERTIFICATE APIs
// ==========================================

app.get('/api/certificates', (req, res) => {
  res.json(getAllCertificates());
});

app.post('/api/certificates', (req, res) => {
  const { data, hash, userId, userName, userRole } = req.body;
  const certId = `CERT-${new Date().getFullYear()}-${String(getAllCertificates().length + 1).padStart(6, '0')}`;
  
  const newCert = {
    id: `cert-rec-${Date.now()}`,
    certificateId: certId,
    studentName: data.studentName,
    registerNumber: data.registerNumber,
    degree: data.degree,
    department: data.department,
    institution: data.institution,
    certificateType: data.certificateType,
    academicYear: data.academicYear,
    issueDate: data.issueDate,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileUrl: `/mock/certificates/${certId}.pdf`,
    sha256Hash: hash,
    blockchainStatus: 'registered',
    blockchainTransaction: '',
    certificateStatus: 'pending', // Stays pending until admin approves
    createdAt: new Date().toISOString(),
  };

  saveCertificate(newCert);

  // Create blockchain record with proper hash chain
  const blockRecord = createBlockchainBlock(certId, hash, 'CERTIFICATE_REGISTERED', userName || 'Student');
  newCert.blockchainTransaction = blockRecord.transactionId;
  saveCertificate(newCert);

  logActivity({
    userId: userId || 'unknown',
    userRole: userRole || 'student',
    userName: userName || 'Unknown',
    action: `${userName || 'Student'} uploaded a certificate`,
    entityType: 'certificate',
    entityId: certId,
    description: `Certificate uploaded for ${data.studentName}`,
    status: 'success'
  });

  // Notify Admin
  broadcastEvent('NEW_ACTIVITY', { message: 'New certificate uploaded', certId });
  
  res.json({ success: true, certificate: newCert, blockchain: blockRecord });
});

// Admin approve certificate
app.post('/api/certificates/:id/approve', (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;
  
  const cert = getCertificateById(id);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
  
  cert.certificateStatus = 'active';
  cert.approvedBy = adminName || 'Admin';
  cert.approvedAt = new Date().toISOString();
  saveCertificate(cert);
  
  // Create blockchain record for approval
  const blockRecord = createBlockchainBlock(id, cert.sha256Hash, 'CERTIFICATE_APPROVED', adminName || 'Admin');
  
  logActivity({
    userId: adminId || 'admin',
    userRole: 'admin',
    userName: adminName || 'Admin',
    action: `Certificate ${id} approved by ${adminName || 'Admin'}`,
    entityType: 'certificate',
    entityId: id,
    description: `Certificate verified and approved`,
    status: 'success'
  });

  broadcastEvent('CERT_STATUS_UPDATE', { certId: id, status: 'active' });
  res.json({ success: true, certificate: cert, blockchain: blockRecord });
});

// Admin reject certificate
app.post('/api/certificates/:id/reject', (req, res) => {
  const { id } = req.params;
  const { adminId, adminName, reason } = req.body;
  
  const cert = getCertificateById(id);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
  
  cert.certificateStatus = 'revoked';
  cert.rejectedBy = adminName || 'Admin';
  cert.rejectedAt = new Date().toISOString();
  cert.rejectedReason = reason || 'No reason provided';
  saveCertificate(cert);
  
  // Create blockchain record for rejection
  createBlockchainBlock(id, cert.sha256Hash, 'CERTIFICATE_REJECTED', adminName || 'Admin');
  
  logActivity({
    userId: adminId || 'admin',
    userRole: 'admin',
    userName: adminName || 'Admin',
    action: `Certificate ${id} rejected by ${adminName || 'Admin'}`,
    entityType: 'certificate',
    entityId: id,
    description: `Rejected: ${reason || 'No reason provided'}`,
    status: 'success'
  });

  broadcastEvent('CERT_STATUS_UPDATE', { certId: id, status: 'revoked' });
  res.json({ success: true, certificate: cert });
});

// Update Certificate Status (legacy endpoint — kept for compatibility)
app.patch('/api/certificates/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminId, adminName } = req.body;
  
  const certs = getAllCertificates();
  const cert = certs.find((c: any) => c.certificateId === id);
  if (!cert) return res.status(404).json({ success: false, message: 'Not found' });
  
  cert.certificateStatus = status;
  if (status === 'active') {
    cert.approvedBy = adminName || 'Admin';
    cert.approvedAt = new Date().toISOString();
  }
  saveCertificate(cert);
  
  logActivity({
    userId: adminId || 'admin',
    userRole: 'admin',
    userName: adminName || 'Admin',
    action: `Certificate ${id} was ${status}`,
    entityType: 'certificate',
    entityId: id,
    description: `Status changed to ${status}`,
    status: 'success'
  });

  broadcastEvent('CERT_STATUS_UPDATE', { certId: id, status });
  res.json({ success: true, certificate: cert });
});

// Simulate Certificate Tampering (Capstone Demo)
app.post('/api/certificates/:id/simulate-tamper', (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;
  
  const cert = getCertificateById(id);
  if (!cert) return res.status(404).json({ success: false, message: 'Not found' });
  
  // Store original hash before tampering so we can restore later
  if (!cert.originalHash) {
    cert.originalHash = cert.sha256Hash;
  }
  
  // Create a completely fake but valid-looking SHA-256 hash to represent a tampered file
  const fakeHash = crypto.randomBytes(32).toString('hex');
  cert.sha256Hash = fakeHash;
  
  saveCertificate(cert);
  
  logActivity({
    userId: adminId || 'admin',
    userRole: 'admin',
    userName: adminName || 'Admin',
    action: `Simulated tampering on Certificate ${id}`,
    entityType: 'certificate',
    entityId: id,
    description: `DEMONSTRATION: Modified certificate hash to ${fakeHash.substring(0, 8)}...`,
    status: 'success'
  });

  broadcastEvent('CERT_TAMPERED_DEMO', { certId: id });
  res.json({ success: true, certificate: cert });
});

// Restore certificate from blockchain (undo tamper demo)
app.post('/api/certificates/:id/restore', (req, res) => {
  const { id } = req.params;
  
  const cert = getCertificateById(id);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
  
  // Find the blockchain record with the original hash
  const blockRecord = getBlockchainRecordByCertId(id);
  
  if (cert.originalHash) {
    cert.sha256Hash = cert.originalHash;
    delete cert.originalHash;
    saveCertificate(cert);
    res.json({ success: true, certificate: cert, message: 'Certificate restored from stored original hash.' });
  } else if (blockRecord) {
    cert.sha256Hash = blockRecord.hash;
    saveCertificate(cert);
    res.json({ success: true, certificate: cert, message: 'Certificate restored from blockchain record.' });
  } else {
    res.status(400).json({ success: false, message: 'No original hash or blockchain record found to restore from.' });
  }
});

// ==========================================
// BLOCKCHAIN APIs
// ==========================================

app.get('/api/blockchain', (req, res) => {
  res.json(getBlockchainRecords());
});

app.post('/api/blockchain', (req, res) => {
  const record = req.body;
  saveBlockchainRecord(record);
  res.json({ success: true });
});

// Chain-aware blockchain registration
app.post('/api/blockchain/register', (req, res) => {
  const { certificateId, certificateHash, action, actor } = req.body;
  
  if (!certificateId || !certificateHash) {
    return res.status(400).json({ success: false, message: 'Missing certificateId or certificateHash' });
  }
  
  const record = createBlockchainBlock(certificateId, certificateHash, action || 'CERTIFICATE_REGISTERED', actor || 'System');
  res.json({ success: true, record });
});

// Validate entire blockchain chain
app.get('/api/blockchain/validate', (req, res) => {
  const records = getBlockchainRecords();
  const certs = getAllCertificates();
  
  const blocks: any[] = [];
  let chainValid = true;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const blockValidation: any = {
      blockIndex: record.blockIndex ?? i,
      certificateId: record.certificateId,
      valid: true,
      hashValid: true,
      previousHashValid: true,
      certHashValid: true,
    };
    
    // Validate current hash
    if (record.currentHash && record.blockIndex !== undefined) {
      const expectedHash = computeBlockHash({
        blockIndex: record.blockIndex,
        timestamp: record.timestamp,
        certificateId: record.certificateId,
        certificateHash: record.hash,
        previousHash: record.previousHash || '0'.repeat(64),
        transactionId: record.transactionId || '',
        action: record.action || '',
      });
      
      if (expectedHash !== record.currentHash) {
        blockValidation.hashValid = false;
        blockValidation.valid = false;
        blockValidation.expectedHash = expectedHash;
        blockValidation.actualHash = record.currentHash;
        blockValidation.message = 'Block hash mismatch — block data may have been modified';
        chainValid = false;
      }
    }
    
    // Validate previous hash link
    if (i > 0 && record.previousHash) {
      const prevRecord = records[i - 1];
      if (prevRecord.currentHash && record.previousHash !== prevRecord.currentHash) {
        blockValidation.previousHashValid = false;
        blockValidation.valid = false;
        blockValidation.message = (blockValidation.message ? blockValidation.message + '. ' : '') + 'Previous hash does not match preceding block';
        chainValid = false;
      }
    }
    
    // Validate certificate hash against current cert record
    const cert = certs.find((c: any) => c.certificateId === record.certificateId);
    if (cert && record.action === 'CERTIFICATE_REGISTERED') {
      if (cert.sha256Hash !== record.hash) {
        blockValidation.certHashValid = false;
        blockValidation.valid = false;
        blockValidation.message = (blockValidation.message ? blockValidation.message + '. ' : '') + 'Certificate hash does not match blockchain record — possible tampering';
        chainValid = false;
      }
    }
    
    blocks.push(blockValidation);
  }
  
  res.json({
    valid: chainValid,
    totalBlocks: records.length,
    validBlocks: blocks.filter(b => b.valid).length,
    invalidBlocks: blocks.filter(b => !b.valid).length,
    blocks,
  });
});

// ==========================================
// VERIFICATIONS API
// ==========================================

app.get('/api/verifications', (req, res) => {
  res.json(getVerificationRecords());
});

app.post('/api/verifications', (req, res) => {
  const { certificateId, method, result, userName, userId } = req.body;
  
  const record = {
    id: `ver-${Date.now()}`,
    certificateId,
    method,
    result,
    timestamp: new Date().toISOString()
  };
  
  saveVerificationRecord(record);
  
  logActivity({
    userId: userId || 'public',
    userRole: 'student', // default
    userName: userName || 'Public User',
    action: `${userName || 'Someone'} verified certificate ${certificateId}`,
    entityType: 'verification',
    entityId: certificateId,
    description: `Result: ${result}`,
    status: 'success'
  });
  
  broadcastEvent('NEW_VERIFICATION', { certificateId, result });
  res.json({ success: true, record });
});

// ==========================================
// ADMIN DASHBOARD APIs
// ==========================================

// SSE Endpoint for real-time Admin updates
app.get('/api/admin/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Add to active clients
  sseClients.push(res);
  
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

app.get('/api/admin/dashboard', (req, res) => {
  const certs = getAllCertificates();
  const students = getAllUsers().filter((u: any) => u.role === 'student');
  const verifications = getVerificationRecords();
  
  const stats = {
    totalCertificates: certs.length,
    verified: certs.filter((c: any) => c.certificateStatus === 'active').length,
    pending: certs.filter((c: any) => c.certificateStatus === 'pending').length,
    revoked: certs.filter((c: any) => c.certificateStatus === 'revoked').length,
    totalStudents: students.length,
    activeStudents: students.filter((s: any) => s.status === 'active').length,
    integrityAlerts: verifications.filter((v: any) => v.result === 'tampered').length,
    blockchainRecords: getBlockchainRecords().length
  };
  
  res.json(stats);
});

app.get('/api/admin/users', (req, res) => {
  res.json(getAllUsers().map(({ passwordHash, ...user }) => user));
});

app.get('/api/admin/students', (req, res) => {
  const students = getAllUsers().filter((u: any) => u.role === 'student').map(({ passwordHash, ...user }) => user);
  const certs = getAllCertificates();
  
  // Attach certificate counts to students
  const studentsWithMeta = students.map((s: any) => ({
    ...s,
    certificatesCount: certs.filter((c: any) => c.registerNumber === s.studentId).length
  }));
  
  res.json(studentsWithMeta);
});

app.get('/api/admin/activity', (req, res) => {
  res.json(getActivityLogs());
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

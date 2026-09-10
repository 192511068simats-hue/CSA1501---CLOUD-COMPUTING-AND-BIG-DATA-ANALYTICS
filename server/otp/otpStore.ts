import crypto from 'crypto';

interface OtpChallenge {
  challengeId: string;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  used: boolean;
  createdAt: Date;
}

const challengeStore = new Map<string, OtpChallenge>();

// Clean up expired challenges periodically
setInterval(() => {
  const now = new Date();
  for (const [id, challenge] of challengeStore.entries()) {
    if (challenge.expiresAt < now) {
      challengeStore.delete(id);
    }
  }
}, 60000);

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function createChallenge(email: string, otp: string): string {
  const challengeId = crypto.randomUUID();
  const otpHash = hashOtp(otp);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

  challengeStore.set(challengeId, {
    challengeId,
    email,
    otpHash,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt: new Date(),
  });

  return challengeId;
}

export function getChallenge(challengeId: string): OtpChallenge | undefined {
  return challengeStore.get(challengeId);
}

export function verifyChallenge(challengeId: string, otp: string): { success: boolean; message?: string } {
  const challenge = challengeStore.get(challengeId);

  if (!challenge) {
    return { success: false, message: 'Invalid or expired session.' };
  }

  if (challenge.used) {
    return { success: false, message: 'This code has already been used.' };
  }

  if (challenge.expiresAt < new Date()) {
    return { success: false, message: 'This verification code has expired. Please request a new code.' };
  }

  if (challenge.attempts >= 5) {
    return { success: false, message: 'Too many incorrect attempts. Please request a new code.' };
  }

  const inputHash = hashOtp(otp);
  
  if (inputHash === challenge.otpHash) {
    challenge.used = true; // Mark as used
    return { success: true };
  } else {
    challenge.attempts += 1;
    return { success: false, message: 'Incorrect verification code. Please try again.' };
  }
}

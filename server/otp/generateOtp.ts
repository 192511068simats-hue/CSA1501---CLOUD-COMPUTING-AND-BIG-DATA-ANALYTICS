import crypto from 'crypto';

export function generateOtp(): string {
  // Generates a random number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
}

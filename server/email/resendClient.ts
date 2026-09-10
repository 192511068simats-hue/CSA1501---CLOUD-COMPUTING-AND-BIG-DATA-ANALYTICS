import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendOtpEmail(to: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
  // If running without real API key, just mock it (helpful for initial setup without the key).
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn(`[MOCK MODE] Pretending to send OTP ${otp} to ${to}`);
    // Delay to simulate network
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, messageId: 'mock-id' };
  }

  const fromEmail = process.env.OTP_FROM_EMAIL || 'AcademicVerify <no-reply@academicverify.com>';

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: 'leoleenas811@gmail.com', // Routed for testing purposes due to Resend free tier limits
      subject: `Your AcademicVerify Student Login OTP (Intended for ${to})`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>AcademicVerify (Test Mode)</h2>
          <p><em>Note: This email was intended for <strong>${to}</strong> but was routed to you for testing.</em></p>
          <h3>Student Authentication Code</h3>
          <p>Your one-time verification code is:</p>
          <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center;">
            ${otp}
          </div>
          <p>This code expires in 5 minutes.</p>
          <hr />
          <p><strong>For your security:</strong></p>
          <ul>
            <li>Never share this code with anyone.</li>
            <li>AcademicVerify will never ask for your OTP by phone.</li>
            <li>This code can only be used once.</li>
          </ul>
          <p style="color: #666; font-size: 12px;">If you did not request this code, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px;">AcademicVerify<br/>Secure Academic Certificate Verification</p>
        </div>
      `
    });

    if (data.error) {
      console.error('Resend API error:', data.error);
      return { success: false };
    }

    return { success: true, messageId: data.data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
}

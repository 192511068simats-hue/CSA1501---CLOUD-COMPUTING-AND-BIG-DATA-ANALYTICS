import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../../services/authService';

interface OtpVerificationProps {
  email: string;
  challengeId: string;
  onVerify: (challengeId: string, otp: string) => Promise<void>;
  onCancel: () => void;
  onNewChallenge: (newChallengeId: string) => void;
}

export function OtpVerification({ email, challengeId, onVerify, onCancel, onNewChallenge }: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [cooldown, setCooldown] = useState(60); // 60 seconds resend cooldown
  const [resending, setResending] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOTPIndex]);

  // Timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [challengeId]); // Reset on new challenge

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [challengeId]);

  const handleOnChange = ({ target }: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = target;
    const newOTP: string[] = [...otp];
    newOTP[index] = value.substring(value.length - 1);
    
    if (!value) setActiveOTPIndex(index - 1);
    else setActiveOTPIndex(index + 1);

    setOtp(newOTP);
    setError('');
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOTP = [...otp];
      newOTP[index] = '';
      setOtp(newOTP);
      setActiveOTPIndex(index - 1 >= 0 ? index - 1 : 0);
      setError('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').slice(0, 6).replace(/[^0-9]/g, '');
    if (pasteData) {
      const newOTP = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOTP[i] = pasteData[i];
      }
      setOtp(newOTP);
      setActiveOTPIndex(Math.min(pasteData.length, 5));
      setError('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    if (timeLeft === 0) {
      setError('This verification code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(challengeId, otpValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect verification code. Please try again.');
      setOtp(Array(6).fill(''));
      setActiveOTPIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    
    setResending(true);
    setError('');
    
    try {
      const res = await authService.requestStudentOtp(email);
      if (res.success) {
        onNewChallenge(res.challengeId);
        setOtp(Array(6).fill(''));
        setActiveOTPIndex(0);
        setTimeLeft(300);
        setCooldown(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn\'t send your verification code right now. Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, '$1*******$3');

  return (
    <div className="w-full max-w-md animate-fade-in">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>

      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Verify Your Student Account</h1>
        <p className="text-sm text-navy-500 mt-2">
          We've sent a 6-digit verification code to:<br/>
          <span className="font-medium text-navy-800">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((_, index) => (
            <React.Fragment key={index}>
              <input
                ref={index === activeOTPIndex ? inputRef : null}
                type="text"
                inputMode="numeric"
                className="w-12 h-14 border-2 rounded-lg text-center text-xl font-semibold text-navy-900 bg-white border-navy-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                value={otp[index]}
                onChange={(e) => handleOnChange(e, index)}
                onKeyDown={(e) => handleOnKeyDown(e, index)}
                onPaste={handlePaste}
                maxLength={1}
                disabled={loading || timeLeft === 0}
              />
            </React.Fragment>
          ))}
        </div>

        <div className="text-center">
          {error && (
            <p className="text-sm font-medium text-red-500 mt-2 animate-shake">
              {error}
            </p>
          )}
          
          <div className="mt-4 text-sm font-medium">
            {timeLeft > 0 ? (
              <span className="text-navy-500">
                Code expires in <span className="text-navy-800 font-mono">{formatTime(timeLeft)}</span>
              </span>
            ) : (
              <span className="text-red-500">This code has expired.</span>
            )}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          loading={loading}
          disabled={otp.join('').length !== 6 || timeLeft === 0}
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-navy-500">
          Didn't receive the code?{' '}
          <button 
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className={`font-semibold ${
              cooldown > 0 
                ? 'text-navy-300 cursor-not-allowed' 
                : 'text-primary-600 hover:text-primary-700'
            } transition-colors`}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </p>
        {cooldown > 0 && (
          <p className="text-xs text-navy-400 mt-1">
            You can request a new code in {cooldown} seconds.
          </p>
        )}
      </div>
    </div>
  );
}

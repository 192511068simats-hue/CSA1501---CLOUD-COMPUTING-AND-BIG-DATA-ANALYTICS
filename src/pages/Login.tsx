import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Shield, Blocks, Cloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, UserRole } from '../types/user';
import { OtpVerification } from '../components/auth/OtpVerification';

export function Login() {
  const navigate = useNavigate();
  const { login, register, error, clearError, verifyOtp, user } = useAuth();

  // Navigate to dashboard once auth state is fully established in React
  // This avoids a race condition where navigate() fires before setUser() is flushed
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpChallenge, setOtpChallenge] = useState<{ id: string; user: User } | null>(null);

  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setLoading(true);

    try {
      let response;
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setValidationError('Passwords do not match');
          setLoading(false);
          return;
        }
        response = await register(name, email, password, institution);
      } else {
        response = await login(email, password, role);
      }

      if (response.requiresOtp && response.challengeId && response.tempUser) {
        setOtpChallenge({ id: response.challengeId, user: response.tempUser });
        setStep('otp');
      }
      // Non-OTP login: navigation is handled by the useEffect watching `user`
    } catch {
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setStep('credentials');
    setOtpChallenge(null);
    setRole('student');
    clearError();
    setValidationError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setInstitution('');
  };

  const handleOtpVerify = async (challengeId: string, otp: string) => {
    if (!otpChallenge?.user) return;
    await verifyOtp(challengeId, otp, otpChallenge.user);
    // Navigation is handled by the useEffect watching `user`
  };

  const handleRoleSelect = (r: UserRole) => {
    if (r === 'admin' || r === 'institution') {
      const passcode = window.prompt(`Enter passcode for ${r} access:`);
      if (passcode !== '020608') {
        alert('Incorrect passcode!');
        return;
      }
    }
    setRole(r);
    clearError();
    setValidationError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-navy-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 right-16 w-48 h-48 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 border border-white/10 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AcademicVerify</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Secure Academic<br />
            Certificate Verification
          </h2>
          <p className="text-primary-200 max-w-md leading-relaxed">
            A cloud-based blockchain framework that ensures the integrity and authenticity
            of academic credentials through cryptographic verification.
          </p>

          <div className="space-y-4">
            {[
              { icon: Cloud, label: 'Secure Cloud Storage' },
              { icon: Shield, label: 'SHA-256 Protected' },
              { icon: Blocks, label: 'Blockchain Verified' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary-200" />
                </div>
                <span className="text-sm text-primary-100 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-300">
          © {new Date().getFullYear()} AcademicVerify — Capstone Project
        </p>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        {step === 'otp' && otpChallenge ? (
          <OtpVerification 
            email={email} 
            challengeId={otpChallenge.id} 
            onVerify={handleOtpVerify} 
            onCancel={() => { setStep('credentials'); setOtpChallenge(null); }}
            onNewChallenge={(newId) => setOtpChallenge({ id: newId, user: otpChallenge.user })}
          />
        ) : (
          <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900">AcademicVerify</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              {mode === 'login' ? 'Sign In to AcademicVerify' : 'Create Student Account'}
            </h1>
            <p className="text-sm text-navy-500 mt-1.5">
              {mode === 'login' 
                ? 'Select your role and sign in to access your dashboard.'
                : 'Register to access and verify your academic credentials.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'login' && (
              <div className="space-y-2 mb-2">
                <label className="block text-sm font-medium text-navy-700">Account Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['student', 'admin', 'institution'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors capitalize ${
                        role === r
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300 hover:bg-navy-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Institution"
                  type="text"
                  placeholder="e.g. SIMATS Engineering"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                />
              </>
            )}

            <div>
              <Input
                label="Email address"
                type="email"
                placeholder={role === 'student' || mode === 'register' ? '123456789.simats@saveetha.com' : `you@${role === 'admin' ? 'academicverify.com' : 'institution.edu'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {(role === 'student' || mode === 'register') && (
                <p className="text-xs text-navy-500 mt-1.5">
                  Use your official SIMATS student email. Format hint: <strong>123456789.simats@saveetha.com</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-navy-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-navy-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {(error || validationError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{validationError || error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading} loadingText={mode === 'login' ? "Signing in..." : "Creating account..."}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-navy-600">
              {mode === 'login' ? "Student without an account? " : "Already have an account? "}
              <button onClick={toggleMode} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                {mode === 'login' ? 'Create Student Account' : 'Sign In'}
              </button>
            </p>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

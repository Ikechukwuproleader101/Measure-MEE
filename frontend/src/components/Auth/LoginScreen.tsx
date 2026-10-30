import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, X, Check, Lock, Eye, EyeOff, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { PillSpinner } from '../common/PillLoader';
import './signupMotion.css';

interface LoginScreenProps {
  onBack?: () => void;
  onSuccess: () => void;
  onCreateAccountClick?: () => void;
}

type AuthMode = 'entry' | 'email-signin' | 'email-signup' | 'forgot-password';
type LegalModal = 'terms' | 'privacy' | null;

// 11 Foreground Tailoring Illustrations with percentage layout and specific CSS animation classes
const ILLUSTRATION_ITEMS = [
  {
    name: 'sewing-machine',
    src: '/images/signup/sewing-machine.png',
    alt: 'Sewing machine',
    style: { left: '0.00%', top: '5.42%', width: '26.10%' },
    className: 'anim-float-machine',
  },
  {
    name: 'yarn-ball',
    src: '/images/signup/yarn-ball.png',
    alt: 'Yarn ball',
    style: { left: '33.84%', top: '4.51%', width: '21.27%' },
    className: 'anim-rotate-yarn',
  },
  {
    name: 'needle-thread',
    src: '/images/signup/needle-thread.png',
    alt: 'Needle and thread',
    style: { left: '58.70%', top: '3.61%', width: '22.51%' },
    className: 'anim-sway-needle',
  },
  {
    name: 'pincushion',
    src: '/images/signup/pincushion.png',
    alt: 'Pincushion',
    style: { left: '85.64%', top: '16.25%', width: '13.67%' },
    className: 'anim-pulse-pincushion',
  },
  {
    name: 'scissors',
    src: '/images/signup/scissors.png',
    alt: 'Scissors',
    style: { left: '3.45%', top: '34.30%', width: '29.70%' },
    className: 'anim-sway-scissors',
  },
  {
    name: 'mannequin',
    src: '/images/signup/mannequin.png',
    alt: 'Tailor mannequin',
    style: { left: '41.44%', top: '29.78%', width: '12.98%' },
    className: 'anim-float-mannequin',
  },
  {
    name: 'safety-pin',
    src: '/images/signup/safety-pin.png',
    alt: 'Safety pin',
    style: { left: '62.15%', top: '37.91%', width: '16.02%' },
    className: 'anim-sway-safetypin',
  },
  {
    name: 'measuring-tape',
    src: '/images/signup/measuring-tape.png',
    alt: 'Measuring tape',
    style: { left: '0.00%', top: '68.59%', width: '28.45%' },
    className: 'anim-drift-tape',
  },
  {
    name: 'thimble',
    src: '/images/signup/thimble.png',
    alt: 'Thimble',
    style: { left: '35.91%', top: '69.49%', width: '13.54%' },
    className: 'anim-float-thimble',
  },
  {
    name: 'dress',
    src: '/images/signup/dress.png',
    alt: 'Tailored dress',
    style: { left: '65.61%', top: '60.47%', width: '16.85%' },
    className: 'anim-sway-dress',
  },
  {
    name: 'button',
    src: '/images/signup/button.png',
    alt: 'Button',
    style: { left: '88.40%', top: '49.64%', width: '10.91%' },
    className: 'anim-rotate-button',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack: _onBack,
  onSuccess,
  onCreateAccountClick,
}) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModal>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Google OAuth Flow
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      triggerToast(message);
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  // Email Sign In Flow
  const handleEmailSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      triggerToast('Please enter a valid email address');
      setErrorMsg('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    if (!password) {
      triggerToast('Please enter your password');
      setErrorMsg('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const { session } = await signIn({
        email: email.trim(),
        password,
      });

      if (session) {
        onSuccess();
      }
    } catch {
      const genericError = 'Invalid email or password';
      setErrorMsg(genericError);
      triggerToast(genericError);
    } finally {
      setIsLoading(false);
    }
  };

  // Email Registration Flow
  const handleEmailSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      triggerToast('Please enter a valid email address');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      triggerToast('Password must be at least 8 characters');
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const { session } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      if (session) {
        onSuccess();
      } else {
        triggerToast('Account created! Please check your email to verify.');
        setAuthMode('email-signin');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMsg(message);
      triggerToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Flow
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim() || !email.includes('@')) {
      triggerToast('Please enter your email to receive reset instructions');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      triggerToast(`Password reset link sent to ${email.trim()}`);
      setAuthMode('email-signin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send reset email';
      triggerToast(message);
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E24] text-white border border-[#C69AF3]/30 px-5 py-2.5 rounded-full text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-[#C69AF3]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* VIEW 1: Primary Authentication Entry Screen (Matching Reference Mockup) */}
      {authMode === 'entry' && (
        <div className="flex-1 flex flex-col justify-between items-center w-full max-w-md mx-auto pt-16 sm:pt-24 pb-0 px-6 animate-fade-in">
          {/* Top Header: Measure Me */}
          <header className="w-full text-center">
            <h1 className="text-[32px] sm:text-[36px] font-bold text-white tracking-normal font-sans">
              Measure Me
            </h1>
          </header>

          {/* Centerpiece: Animated Tailoring Illustration Stage */}
          <div className="w-full max-w-[390px] my-auto py-2 relative flex items-center justify-center">
            <div className="illustration-stage">
              {/* Static Tailoring Doodle Strip (Layer 2) */}
              <img
                src="/images/signup/doodle-strip.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
              />

              {/* Foreground Animated Tailoring Icons (Layer 3) */}
              {ILLUSTRATION_ITEMS.map((item) => (
                <div
                  key={item.name}
                  className={`illustration-item z-10 ${item.className}`}
                  style={item.style}
                  aria-hidden="true"
                >
                  <img
                    src={item.src}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-auto object-contain select-none pointer-events-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions Section */}
          <div className="w-full max-w-[340px] flex flex-col items-center gap-4 z-10 mb-2">
            {/* Legal Copy */}
            <p className="text-center text-[15px] sm:text-[16px] text-[#EDEDED] leading-snug font-normal">
              By continuing, you agree with
              <br />
              our{' '}
              <button
                type="button"
                onClick={() => setActiveLegalModal('terms')}
                className="text-[#C69AF3] hover:underline font-medium cursor-pointer"
              >
                Terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setActiveLegalModal('privacy')}
                className="text-[#C69AF3] hover:underline font-medium cursor-pointer"
              >
                Privacy Policy
              </button>
            </p>

            {/* Lavender Pill Authentication Buttons */}
            <div className="w-full flex flex-col gap-3">
              {/* Continue with Google */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full h-[56px] sm:h-[60px] rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-semibold text-[17px] sm:text-[18px] flex items-center justify-center gap-3 transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-70"
                aria-label="Continue with Google"
              >
                {isLoading ? (
                  <PillSpinner className="border-black border-t-transparent" />
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current text-[#080808] shrink-0" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    <span>Continue with google</span>
                  </>
                )}
              </button>

              {/* Continue with Email */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setErrorMsg(null);
                  setAuthMode('email-signin');
                }}
                className="w-full h-[56px] sm:h-[60px] rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-semibold text-[17px] sm:text-[18px] flex items-center justify-center gap-3 transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-70"
                aria-label="Continue with email"
              >
                <Mail className="w-5 h-5 text-[#080808] stroke-[2.2] shrink-0" />
                <span>Continue with email</span>
              </button>
            </div>

            {/* Signup Prompt */}
            <div className="text-center text-[16px] sm:text-[17px] pt-1">
              <span className="text-white">New User? </span>
              <button
                type="button"
                onClick={() => {
                  if (onCreateAccountClick) {
                    onCreateAccountClick();
                  } else {
                    setErrorMsg(null);
                    setAuthMode('email-signup');
                  }
                }}
                className="text-[#C69AF3] font-medium hover:underline cursor-pointer"
              >
                signup
              </button>
            </div>
          </div>

          {/* Bottom Static Pattern Detail (Matching Reference Edge) */}
          <div className="w-full pointer-events-none select-none overflow-hidden h-[16px]">
            <img
              src="/images/signup/bottom-doodle.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-top opacity-40"
            />
          </div>
        </div>
      )}

      {/* VIEW 2: Email Sign In Screen */}
      {authMode === 'email-signin' && (
        <div className="flex-1 flex flex-col justify-between items-center w-full max-w-md mx-auto pt-6 pb-6 px-6 animate-fade-in">
          {/* Top Bar */}
          <header className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('entry');
              }}
              className="w-10 h-10 rounded-full bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
              aria-label="Back to main screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[20px] font-bold text-white">Measure Me</span>
            <div className="w-10" />
          </header>

          {/* Form Content */}
          <div className="w-full max-w-[340px] my-auto py-6 flex flex-col gap-5">
            <div className="text-center mb-1">
              <h2 className="text-[26px] font-bold text-white">Welcome Back</h2>
              <p className="text-[14px] text-[#A1A1AA] mt-1">
                Enter your credentials to access your measurements
              </p>
            </div>

            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3.5 w-full">
              {/* Email Input */}
              <div className="auth-input-container">
                <Mail className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="auth-input-field"
                />
                {email.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Password Input */}
              <div className="auth-input-container">
                <Lock className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="auth-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#71717A] hover:text-white cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-bold text-[17px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2 disabled:opacity-70"
              >
                {isLoading ? <PillSpinner className="border-black border-t-transparent" /> : 'Sign in'}
              </button>

              {/* Forgot Password */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthMode('forgot-password');
                  }}
                  className="text-[13px] text-[#A1A1AA] hover:text-[#C69AF3] transition-colors cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center text-[14px]">
            <span className="text-[#A1A1AA]">Don't have an account? </span>
            <button
              type="button"
              onClick={() => {
                if (onCreateAccountClick) {
                  onCreateAccountClick();
                } else {
                  setErrorMsg(null);
                  setAuthMode('email-signup');
                }
              }}
              className="text-[#C69AF3] font-medium hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: Email Sign Up Screen */}
      {authMode === 'email-signup' && (
        <div className="flex-1 flex flex-col justify-between items-center w-full max-w-md mx-auto pt-6 pb-6 px-6 animate-fade-in">
          {/* Top Bar */}
          <header className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('entry');
              }}
              className="w-10 h-10 rounded-full bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
              aria-label="Back to main screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[20px] font-bold text-white">Measure Me</span>
            <div className="w-10" />
          </header>

          {/* Form Content */}
          <div className="w-full max-w-[340px] my-auto py-6 flex flex-col gap-5">
            <div className="text-center mb-1">
              <h2 className="text-[26px] font-bold text-white">Create Account</h2>
              <p className="text-[14px] text-[#A1A1AA] mt-1">
                Start your bespoke digital fitting profile
              </p>
            </div>

            <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3.5 w-full">
              {/* Full Name */}
              <div className="auth-input-container">
                <User className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name (optional)"
                  autoComplete="name"
                  className="auth-input-field"
                />
              </div>

              {/* Email */}
              <div className="auth-input-container">
                <Mail className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="auth-input-field"
                />
              </div>

              {/* Password */}
              <div className="auth-input-container">
                <Lock className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  autoComplete="new-password"
                  className="auth-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#71717A] hover:text-white cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-bold text-[17px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2 disabled:opacity-70"
              >
                {isLoading ? <PillSpinner className="border-black border-t-transparent" /> : 'Sign up'}
              </button>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center text-[14px]">
            <span className="text-[#A1A1AA]">Already have an account? </span>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('email-signin');
              }}
              className="text-[#C69AF3] font-medium hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: Forgot Password Screen */}
      {authMode === 'forgot-password' && (
        <div className="flex-1 flex flex-col justify-between items-center w-full max-w-md mx-auto pt-6 pb-6 px-6 animate-fade-in">
          {/* Top Bar */}
          <header className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('email-signin');
              }}
              className="w-10 h-10 rounded-full bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
              aria-label="Back to sign in"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[20px] font-bold text-white">Measure Me</span>
            <div className="w-10" />
          </header>

          {/* Form Content */}
          <div className="w-full max-w-[340px] my-auto py-6 flex flex-col gap-5">
            <div className="text-center mb-1">
              <h2 className="text-[26px] font-bold text-white">Reset Password</h2>
              <p className="text-[14px] text-[#A1A1AA] mt-1">
                Enter your email address and we'll send you a password recovery link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3.5 w-full">
              <div className="auth-input-container">
                <Mail className="w-4 h-4 text-[#C69AF3] shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="auth-input-field"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-bold text-[17px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2 disabled:opacity-70"
              >
                {isLoading ? <PillSpinner className="border-black border-t-transparent" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>

          <div className="text-center text-[14px]">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('email-signin');
              }}
              className="text-[#C69AF3] font-medium hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Accessible Terms & Privacy Policy Modal */}
      {activeLegalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="w-full max-w-md bg-[#111111] border border-white/15 rounded-3xl p-6 text-white shadow-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {activeLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 text-sm text-[#D4D4D8] leading-relaxed space-y-3 pr-2">
              {activeLegalModal === 'terms' ? (
                <>
                  <p>
                    Welcome to <strong>Measure Me</strong>. By accessing or using our bespoke 3D
                    body contour and measurement application, you agree to comply with and be bound
                    by these terms.
                  </p>
                  <p>
                    <strong>1. Use of Service:</strong> Measure Me provides computer vision-assisted
                    tailoring measurements to assist clients and tailors in creating bespoke
                    garments.
                  </p>
                  <p>
                    <strong>2. Account Security:</strong> You are responsible for maintaining the
                    confidentiality of your login credentials and for all activities that occur under
                    your account.
                  </p>
                  <p>
                    <strong>3. Content & Data:</strong> Measurements, photos, and project notes are
                    processed securely and used solely for tailoring analysis and garment fitting.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Your privacy is essential to us at <strong>Measure Me</strong>. We are committed
                    to protecting your personal information and body measurement data.
                  </p>
                  <p>
                    <strong>1. On-Device Processing:</strong> Pose tracking and pose evaluation
                    occur directly on your local device hardware using MediaPipe vision models.
                  </p>
                  <p>
                    <strong>2. Data Usage:</strong> Measurement captures are encrypted in transit and
                    stored in secure cloud infrastructure solely to deliver your bespoke tailor
                    dimensions.
                  </p>
                  <p>
                    <strong>3. No Sale of Personal Data:</strong> We never sell, rent, or monetize
                    your personal photos or anatomical metrics to third parties.
                  </p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="w-full h-11 rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] text-[#080808] font-bold text-sm transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;

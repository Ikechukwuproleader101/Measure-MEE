import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, EyeOff, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface CreateAccountScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onLoginClick: () => void;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ 
  onBack,
  onSuccess,
  onLoginClick 
}) => {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
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
        setConfirmationRequired(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-white text-neutral-900 flex flex-col justify-between px-6 py-5 overflow-y-auto max-w-lg mx-auto">
      {/* Subtle atmospheric glow matching Onboarding */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#6C47FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-neutral-950 transition-all cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <img 
              src="/images/measureme-logo-purple.png" 
              alt="Measure Me Logo" 
              className="w-6 h-auto object-contain"
            />
            <span className="font-display font-bold text-base tracking-tight text-[#161839]">
              Measure <span className="text-[#6C3EE0]">me</span>
            </span>
          </div>

          <div className="w-10" /> {/* Balancer */}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-950 font-display">
            Create your account
          </h1>
          <p className="text-sm text-neutral-500 mt-2 font-medium leading-relaxed">
            Sign up now to start your bespoke digital fitting profile.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Full name</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="w-full h-13 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 focus:border-[#6C47FF] focus:ring-2 focus:ring-[#6C47FF]/20 rounded-2xl px-4 text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:outline-hidden"
              />
              <User className="absolute right-4 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Email address</label>
            <div className="relative flex items-center">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="w-full h-13 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 focus:border-[#6C47FF] focus:ring-2 focus:ring-[#6C47FF]/20 rounded-2xl px-4 text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:outline-hidden"
              />
              <Mail className="absolute right-4 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password (min. 8 characters)"
                className="w-full h-13 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 focus:border-[#6C47FF] focus:ring-2 focus:ring-[#6C47FF]/20 rounded-2xl px-4 pr-11 text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-600 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation Required Banner */}
          {confirmationRequired && (
            <div className="p-3 bg-[#6C47FF]/10 border border-[#6C47FF]/25 rounded-2xl flex items-center gap-2 text-xs text-[#6C47FF] animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6C47FF]" />
              <span>Check your email to confirm your account before logging in.</span>
            </div>
          )}

          {/* Submit CTA */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 mt-4 rounded-full bg-[#6C47FF] hover:bg-[#5C37EF] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6C47FF]/25 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creating account...</span>
              </span>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="relative z-10 pt-8 pb-4 text-center">
        <button 
          onClick={onLoginClick}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-[#6C47FF] font-bold">Log in</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { PillSpinner } from '../common/PillLoader';
import './signupMotion.css';

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
    if (isLoading) return;
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
    <div className="relative w-full h-full min-h-screen bg-[#050505] text-white flex flex-col justify-between px-6 py-6 overflow-y-auto max-w-md mx-auto select-none font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between z-10 w-full">
        <button 
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="font-bold text-[20px] text-white">Measure Me</span>

        <div className="w-10" />
      </header>

      {/* Center Form Section */}
      <div className="my-auto py-6 w-full max-w-[340px] mx-auto z-10 flex flex-col gap-5">
        <div className="text-center mb-1">
          <h1 className="text-[28px] font-bold tracking-tight text-white font-sans">
            Create Account
          </h1>
          <p className="text-[14px] text-[#A1A1AA] mt-1 font-medium">
            Start your bespoke digital fitting profile
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full">
          {/* Full Name */}
          <div className="auth-input-container">
            <User className="w-4 h-4 text-[#C69AF3] shrink-0" />
            <input 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (e.g. Ada Lovelace)"
              autoComplete="name"
              className="auth-input-field"
            />
          </div>

          {/* Email Address */}
          <div className="auth-input-container">
            <Mail className="w-4 h-4 text-[#C69AF3] shrink-0" />
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
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
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation Required Banner */}
          {confirmationRequired && (
            <div className="p-3 bg-[#C69AF3]/20 border border-[#C69AF3]/40 rounded-2xl flex items-center gap-2 text-xs text-[#C69AF3] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C69AF3]" />
              <span>Check your email to confirm your account before logging in.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[56px] mt-2 rounded-full bg-[#C69AF3] hover:bg-[#ba89eb] active:scale-[0.98] text-[#080808] font-bold text-[17px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-70"
          >
            {isLoading ? <PillSpinner className="border-black border-t-transparent" /> : 'Sign up'}
          </button>
        </form>
      </div>

      {/* Bottom Switch Link */}
      <div className="z-10 pt-4 pb-2 text-center">
        <button 
          type="button"
          onClick={onLoginClick}
          className="text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-[#C69AF3] font-bold hover:underline">Log in</span>
        </button>
      </div>

      {/* Subtle Bottom Doodle Strip */}
      <div className="w-full pointer-events-none select-none overflow-hidden h-[16px]">
        <img
          src="/images/signup/bottom-doodle.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-top opacity-40"
        />
      </div>
    </div>
  );
};

export default CreateAccountScreen;

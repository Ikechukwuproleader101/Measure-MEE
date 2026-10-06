import React, { useState } from 'react';
import { Mascot } from '../common/Mascot';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';

interface LoginScreenProps {
  onBack?: () => void;
  onSuccess: () => void;
  onCreateAccountClick: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
  onCreateAccountClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 600);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between px-6 py-5 overflow-y-auto max-w-lg mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#1E1E2E] transition-all cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex items-center gap-2">
            <Mascot size={22} color="green" />
            <span className="font-display font-bold text-base tracking-tight text-white">
              Measure <span className="text-[#27D07F]">Me</span>
            </span>
          </div>

          <div className="w-10" />
        </div>

        {/* Mascot Center Branding matching App onboarding 3.png */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6">
          <div className="w-20 h-20 rounded-3xl bg-[#161626] border border-white/5 flex items-center justify-center shadow-lg shadow-[#B69EFF]/10">
            <Mascot size={46} color="purple" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display mt-4">
            Welcome back
          </h1>
          <p className="text-sm text-[#8E8CA3] mt-1.5 text-center">
            Sign in to access your fitting profile and tailor projects.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B4B1C9]">Email address</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-12 bg-[#14141E] border border-white/10 rounded-xl px-4 pr-11 text-sm text-white placeholder-[#5A586D] focus:outline-hidden focus:border-[#27D07F] focus:ring-1 focus:ring-[#27D07F] transition-all"
              />
              <Mail className="absolute right-3.5 w-4 h-4 text-[#5A586D]" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#B4B1C9]">Password</label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to demo email.')}
                className="text-xs font-medium text-[#27D07F] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 bg-[#14141E] border border-white/10 rounded-xl px-4 pr-11 text-sm text-white placeholder-[#5A586D] focus:outline-hidden focus:border-[#27D07F] focus:ring-1 focus:ring-[#27D07F] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#5A586D] hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            variant="default"
            className="w-full h-13 mt-3 rounded-2xl bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base cursor-pointer shadow-lg shadow-[#27D07F]/15"
          >
            {isLoading ? 'Signing in...' : 'Log in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 text-xs uppercase tracking-wider text-[#5A586D]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Create Account Alternate Button */}
        <Button
          type="button"
          onClick={onCreateAccountClick}
          variant="secondary"
          className="w-full h-12 rounded-2xl bg-[#14141E] border border-white/10 text-white font-medium hover:bg-[#1C1C2A] flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#27D07F]" />
          <span>Create an account</span>
        </Button>
      </div>

      {/* Footer Info */}
      <div className="pt-6 pb-2 text-center text-xs text-[#5A586D]">
        Protected by on-device privacy encryption.
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Mascot } from '../common/Mascot';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, EyeOff, User, Mail, CheckCircle2 } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSuccess();
    }, 700);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0E] text-white flex flex-col justify-between px-6 py-5 overflow-y-auto max-w-lg mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#161622] border border-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#1E1E2E] transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Mascot size={22} color="green" />
            <span className="font-display font-bold text-base tracking-tight text-white">
              Measure <span className="text-[#27D07F]">Me</span>
            </span>
          </div>

          <div className="w-10" /> {/* Balancer */}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Create your account
          </h1>
          <p className="text-sm text-[#8E8CA3] mt-2">
            Sign up now to start your bespoke digital fitting profile.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B4B1C9]">Full name</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="w-full h-12 bg-[#14141E] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-[#5A586D] focus:outline-hidden focus:border-[#27D07F] focus:ring-1 focus:ring-[#27D07F] transition-all"
              />
              <User className="absolute right-3.5 w-4 h-4 text-[#5A586D]" />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B4B1C9]">Email address</label>
            <div className="relative flex items-center">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="w-full h-12 bg-[#14141E] border border-white/10 rounded-xl px-4 text-sm text-white placeholder-[#5A586D] focus:outline-hidden focus:border-[#27D07F] focus:ring-1 focus:ring-[#27D07F] transition-all"
              />
              <Mail className="absolute right-3.5 w-4 h-4 text-[#5A586D]" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B4B1C9]">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
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

          {/* Success Banner if submitted */}
          {submitted && (
            <div className="p-3 bg-[#27D07F]/10 border border-[#27D07F]/30 rounded-xl flex items-center gap-2 text-xs text-[#27D07F] mt-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Creating your profile and preparing dashboard...</span>
            </div>
          )}

          {/* Submit CTA */}
          <Button
            type="submit"
            disabled={submitted}
            variant="default"
            className="w-full h-13 mt-4 rounded-2xl bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15"
          >
            {submitted ? 'Setting up...' : 'Create account'}
          </Button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="pt-8 pb-4 text-center">
        <button 
          onClick={onLoginClick}
          className="text-xs font-medium text-[#8E8CA3] hover:text-white transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-[#27D07F] font-semibold">Log in</span>
        </button>
      </div>
    </div>
  );
};

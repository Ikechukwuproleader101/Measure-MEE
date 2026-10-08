import React, { useState } from 'react';
import { Mascot } from '../common/Mascot';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, UserPlus, ArrowRight, Sun, Moon } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light onboarding color scheme

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 600);
  };

  return (
    <div 
      className={`relative w-full h-full min-h-screen flex flex-col justify-between px-6 py-5 overflow-y-auto max-w-lg mx-auto transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-[#0A0A0E] text-white' 
          : 'bg-white text-neutral-900'
      }`}
    >
      {/* Subtle atmospheric glow matching Onboarding */}
      <div 
        className={`absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDarkMode ? 'bg-[#6C47FF]/20' : 'bg-[#6C47FF]/10'
        }`} 
      />

      {/* Main Content Area */}
      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button
              onClick={onBack}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-950'
              }`}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          {/* Logo matching Onboarding Header */}
          <div className="flex items-center gap-2">
            <Mascot size={22} color="#6C47FF" />
            <span className={`font-display font-bold text-base tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>
              Measure <span className="text-[#6C47FF]">Me</span>
            </span>
          </div>

          {/* Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Onboarding Light Theme" : "Switch to Dark Theme"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-[#B69EFF] hover:bg-white/10'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Mascot Center Branding matching Onboarding Hero */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6">
          <div className="relative group">
            <div className={`absolute -inset-4 rounded-full blur-xl transition-transform duration-500 ${
              isDarkMode ? 'bg-[#6C47FF]/25' : 'bg-[#6C47FF]/15'
            }`} />
            <div className="relative flex items-center justify-center py-2 animate-bounce-subtle">
              <Mascot size={64} color="#6C47FF" />
            </div>
          </div>

          <h1 className={`text-3xl font-black tracking-tight font-display mt-3 ${
            isDarkMode ? 'text-white' : 'text-neutral-950'
          }`}>
            Welcome back
          </h1>
          <p className={`text-sm mt-1 text-center max-w-xs font-medium leading-relaxed ${
            isDarkMode ? 'text-[#8E8CA3]' : 'text-neutral-500'
          }`}>
            Sign in to access your fitting profile and tailor projects.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#A5A2BE]' : 'text-neutral-600'
            }`}>
              Email address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full h-13 rounded-2xl px-4 pr-11 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[#6C47FF]/25 focus:border-[#6C47FF] ${
                  isDarkMode
                    ? 'bg-[#14141E] border border-white/10 text-white placeholder-[#5A586D]'
                    : 'bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              <Mail className={`absolute right-4 w-4 h-4 ${isDarkMode ? 'text-[#75728F]' : 'text-neutral-400'}`} />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-[#A5A2BE]' : 'text-neutral-600'
              }`}>
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to demo email.')}
                className="text-xs font-semibold text-[#6C47FF] hover:underline cursor-pointer transition-colors"
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
                className={`w-full h-13 rounded-2xl px-4 pr-11 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[#6C47FF]/25 focus:border-[#6C47FF] ${
                  isDarkMode
                    ? 'bg-[#14141E] border border-white/10 text-white placeholder-[#5A586D]'
                    : 'bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 transition-colors cursor-pointer ${
                  isDarkMode ? 'text-[#75728F] hover:text-white' : 'text-neutral-400 hover:text-neutral-700'
                }`}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button matching Onboarding Slide 1 CTA */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 mt-3 rounded-full bg-[#6C47FF] hover:bg-[#5C37EF] text-white font-bold text-base cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#6C47FF]/25"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-neutral-200'}`} />
          <span className={`px-3 text-xs uppercase tracking-wider font-semibold ${
            isDarkMode ? 'text-[#69677E]' : 'text-neutral-400'
          }`}>
            or
          </span>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-neutral-200'}`} />
        </div>

        {/* Create Account Alternate Button */}
        <Button
          type="button"
          onClick={onCreateAccountClick}
          className={`w-full h-13 rounded-full font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] transition-all border ${
            isDarkMode
              ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
              : 'bg-neutral-100 hover:bg-neutral-200/80 border-neutral-200 text-neutral-800'
          }`}
        >
          <UserPlus className="w-4 h-4 text-[#6C47FF]" />
          <span>Create an account</span>
        </Button>
      </div>

      {/* Footer Info */}
      <div className={`relative z-10 pt-6 pb-2 text-center text-xs flex items-center justify-center gap-1.5 ${
        isDarkMode ? 'text-[#6C6A82]' : 'text-neutral-400'
      }`}>
        <Lock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#8885A4]' : 'text-neutral-400'}`} />
        <span>End-to-end encrypted biometric privacy</span>
      </div>
    </div>
  );
};

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
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between px-6 py-5 overflow-y-auto max-w-lg mx-auto">
      {/* Subtle atmospheric glow matching Onboarding */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-secondary-foreground transition-all cursor-pointer active:scale-95"
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
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              Measure <span className="text-primary">me</span>
            </span>
          </div>

          <div className="w-10" /> {/* Balancer */}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground font-display">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
            Sign up now to start your bespoke digital fitting profile.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full name</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="w-full h-13 bg-card hover:bg-card/90 focus:bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-hidden"
              />
              <User className="absolute right-4 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email address</label>
            <div className="relative flex items-center">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="w-full h-13 bg-card hover:bg-card/90 focus:bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-hidden"
              />
              <Mail className="absolute right-4 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password (min. 8 characters)"
                className="w-full h-13 bg-card hover:bg-card/90 focus:bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-2xl flex items-center gap-2 text-xs text-destructive animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation Required Banner */}
          {confirmationRequired && (
            <div className="p-3 bg-primary/10 border border-primary/25 rounded-2xl flex items-center gap-2 text-xs text-primary animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              <span>Check your email to confirm your account before logging in.</span>
            </div>
          )}

          {/* Submit CTA */}
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            className="w-full h-13 mt-4"
          >
            Create account
          </Button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="relative z-10 pt-8 pb-4 text-center">
        <button 
          onClick={onLoginClick}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-primary font-bold">Log in</span>
        </button>
      </div>
    </div>
  );
};

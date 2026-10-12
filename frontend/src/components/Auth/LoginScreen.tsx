import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, X, Check, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { PillSpinner } from '../common/PillLoader';

interface LoginScreenProps {
  onBack?: () => void;
  onSuccess: () => void;
  onCreateAccountClick?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
  onCreateAccountClick,
}) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Trigger feedback toast
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  const handleClearEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmail('');
    inputRef.current?.focus();
  };

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      triggerToast('Please enter a valid email address');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      triggerToast('Please enter your password');
      setErrorMsg('Please enter your password.');
      passwordRef.current?.focus();
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
      // Per brief: On failure, show a single generic message. Do not reveal whether email exists.
      const genericError = 'Invalid email or password';
      setErrorMsg(genericError);
      triggerToast(genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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

  const handleAppleSignIn = () => {
    triggerToast('Apple sign-in is coming soon. Please sign in with Email or Google.');
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      triggerToast('Enter your email above first to receive reset instructions');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      triggerToast(`Password reset link sent to ${email.trim()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send reset email';
      triggerToast(message);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden select-none font-sans pb-8">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-popover/95 text-popover-foreground px-4 py-2.5 rounded-full text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-2 border-0 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-primary" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Header Navigation (Battery indicator and fake status bar removed) */}
      <header className="w-full pt-5 pb-2 px-6 flex items-center justify-between z-20">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer active:scale-95 border-0"
            title="Back to Onboarding"
            aria-label="Back to Onboarding"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="w-10" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-6 py-4 max-w-md mx-auto w-full z-10">
        {/* Brand Icon & Wordmark Section */}
        <div className="flex flex-col items-center justify-center text-center pb-6">
          {/* Logo Tape Ribbon Mascot */}
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <img
              src="/images/measureme-logo-purple.png"
              alt="Measure Me Logo"
              className="w-[72px] h-auto object-contain drop-shadow-sm select-none pointer-events-none"
            />
          </div>

          {/* Title: Measure me */}
          <h1 className="mt-3 text-[30px] font-extrabold tracking-tight text-foreground font-display flex items-center justify-center gap-1.5">
            <span>Measure</span>
            <span className="text-primary">me</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-1.5 text-[14px] leading-snug text-muted-foreground font-medium tracking-normal text-center">
            Your body. Perfectly measured.
            <br />
            Anywhere.
          </p>
        </div>

        {/* Input & Form Controls - Clean Flat, Zero Outline */}
        <form onSubmit={handleContinue} className="flex flex-col gap-3.5 w-full">
          {/* Email Input Field */}
          <div 
            onClick={() => {
              inputRef.current?.focus();
              setIsFocused(true);
            }}
            className={`relative w-full h-[54px] rounded-2xl px-4 flex items-center gap-3 transition-all duration-200 cursor-text border-0 ${
              isFocused 
                ? 'bg-card shadow-md shadow-primary/10' 
                : 'bg-card shadow-sm'
            }`}
          >
            {/* Mail Icon in circular badge */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Mail className="w-4 h-4 stroke-[2]" />
            </div>

            {/* Real Editable Input - Guaranteed No Outline */}
            <div className="relative flex-1 flex items-center overflow-hidden">
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full bg-transparent text-foreground text-[15px] font-normal tracking-normal border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 shadow-none placeholder:text-muted-foreground select-text"
              />
            </div>

            {/* Clear Button (Circle with X) */}
            {email.length > 0 && (
              <button
                type="button"
                onClick={handleClearEmail}
                className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 border-0"
                aria-label="Clear email"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Password Input Field */}
          <div 
            onClick={() => {
              passwordRef.current?.focus();
            }}
            className="relative w-full h-[54px] rounded-2xl px-4 flex items-center gap-3 bg-card shadow-sm border-0 focus-within:shadow-md focus-within:shadow-primary/10 transition-all duration-200 cursor-text"
          >
            {/* Lock Icon in circular badge */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Lock className="w-4 h-4 stroke-[2]" />
            </div>

            <div className="relative flex-1 flex items-center overflow-hidden">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full bg-transparent text-foreground text-[15px] font-normal tracking-normal border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 shadow-none placeholder:text-muted-foreground pr-2 select-text"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 p-1 border-0"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Banner if error exists */}
          {errorMsg && (
            <div className="p-3 bg-destructive/10 rounded-2xl flex items-center gap-2 text-xs text-destructive animate-fade-in font-medium border-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Continue Button */}
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className={`w-full h-[52px] rounded-full font-semibold text-[15px] tracking-tight flex items-center justify-center gap-1.5 transition-all duration-150 select-none border-0 ${
              isLoading
                ? 'bg-muted text-muted-foreground shadow-sm cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 active:bg-primary/95 text-primary-foreground shadow-md shadow-primary/25 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <PillSpinner />
            ) : (
              <>
                <span>Sign in</span>
                <span className="text-base font-normal leading-none ml-0.5">→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider: "or" */}
        <div className="flex items-center my-4 px-1">
          <div className="flex-1 h-[1px] bg-border/40" />
          <span className="px-3 text-[13px] text-muted-foreground font-normal lowercase tracking-normal">
            or
          </span>
          <div className="flex-1 h-[1px] bg-border/40" />
        </div>

        {/* Social Authentication Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Continue with Google */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-[52px] rounded-full bg-card hover:bg-muted active:bg-muted text-foreground font-semibold text-[14px] sm:text-[15px] flex items-center justify-center gap-3 shadow-sm border-0 transition-all duration-150 cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            {/* Google colored G icon inside circular badge */}
            <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <span>Continue with Google</span>
          </button>

          {/* Continue with Apple */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            className="w-full h-[52px] rounded-full bg-card hover:bg-muted active:bg-muted text-foreground font-semibold text-[14px] sm:text-[15px] flex items-center justify-center gap-3 shadow-sm border-0 transition-all duration-150 cursor-pointer active:scale-[0.99]"
          >
            {/* Apple icon inside circular badge */}
            <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-current text-foreground shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.89-12-14.43-6.19-9.47-10.9-20.48-14.13-33.03-3.23-12.56-4.85-24.3-4.85-35.24 0-14.61 3.69-26.79 11.07-36.54 7.39-9.76 16.63-14.77 27.72-15.03 4.58 0 9.87 1.25 15.87 3.75 6 2.5 10.22 3.82 12.66 3.97 1.9-.27 6.25-1.63 13.06-4.09 6.81-2.46 12.35-3.56 16.63-3.3 12.28.64 22.18 5.22 29.7 13.74-10.84 6.59-16.14 15.67-15.91 27.24.23 9.4 3.93 17.26 11.11 23.59 7.18 6.33 15.67 10.05 25.48 11.15-2.23 6.94-4.87 13.68-7.91 20.22zM119.22 31.84c0-7.39 2.63-14.14 7.89-20.25 5.26-6.12 11.75-9.98 19.46-11.59.34 1.12.51 2.37.51 3.75 0 7.39-2.73 14.28-8.19 20.67-5.46 6.39-11.95 10.15-19.46 11.27-.07-1.28-.21-2.56-.21-3.85z" />
              </svg>
            </div>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Forgot password link */}
        <div className="pt-3 pb-3 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-[13px] font-normal text-muted-foreground hover:text-primary transition-colors cursor-pointer border-0"
          >
            Forgot your password?
          </button>
        </div>

        {/* Sign up link */}
        {onCreateAccountClick && (
          <div className="text-center pb-2">
            <button
              type="button"
              onClick={onCreateAccountClick}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-0"
            >
              Don't have an account? <span className="text-primary font-semibold">Sign up</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LoginScreen;

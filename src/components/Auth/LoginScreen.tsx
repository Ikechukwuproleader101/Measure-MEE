import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, Mic, Smile, X, Check } from 'lucide-react';

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
  const [email, setEmail] = useState('ikechukwu@gmail.com');
  const [isFocused, setIsFocused] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isNumberPad, setIsNumberPad] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger feedback toast
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleClearEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmail('');
    inputRef.current?.focus();
  };

  const handleContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      triggerToast('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    triggerToast(`Welcome back, ${email.split('@')[0]}! Signing in...`);
    
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 900);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    triggerToast('Connecting to Google...');
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 700);
  };

  const handleAppleSignIn = () => {
    setIsLoading(true);
    triggerToast('Authenticating with Apple ID...');
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 700);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerToast(`Password reset link sent to ${email || 'your email'}`);
  };

  // Virtual keyboard interaction
  const handleVirtualKeyPress = (char: string) => {
    setEmail((prev) => prev + (isShiftActive ? char.toUpperCase() : char.toLowerCase()));
    if (isShiftActive) setIsShiftActive(false);
  };

  const handleVirtualBackspace = () => {
    setEmail((prev) => prev.slice(0, -1));
  };

  const handleVirtualSpace = () => {
    setEmail((prev) => prev + ' ');
  };

  // Keyboard layout definitions
  const row1Letters = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2Letters = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3Letters = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const row1Numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row2Numbers = ['-', '/', ':', ';', '(', ')', '$', '&', '@'];
  const row3Numbers = ['.', ',', '?', '!', "'", '"', '_'];

  return (
    <div className="relative w-full h-full min-h-screen bg-[#F8F9FD] text-[#121625] flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#161839]/95 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/10 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-[#27D07F]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top iOS Status Bar */}
      <div className="w-full pt-3 pb-1 px-7 flex items-center justify-between text-neutral-900 z-20">
        <div className="font-semibold text-[15px] tracking-tight text-[#161839]">
          9:41
        </div>

        {/* Back navigation button if available */}
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-[#868CA8] hover:text-[#161839] flex items-center gap-1 transition-colors cursor-pointer"
            title="Back to Onboarding"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Onboarding</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[#161839]">
          {/* Cellular Signal (4 bars) */}
          <div className="flex items-end gap-[1.5px] h-3">
            <span className="w-[3px] h-1 bg-[#161839] rounded-[0.5px]" />
            <span className="w-[3px] h-1.5 bg-[#161839] rounded-[0.5px]" />
            <span className="w-[3px] h-2.2 bg-[#161839] rounded-[0.5px]" />
            <span className="w-[3px] h-3 bg-[#161839] rounded-[0.5px]" />
          </div>

          {/* Wi-Fi Icon */}
          <svg className="w-3.5 h-3.5 fill-current ml-1" viewBox="0 0 24 24">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.5 0 6.69 1.41 9 3.7l-9 9-9-9c2.31-2.29 5.5-3.7 9-3.7z" />
          </svg>

          {/* Battery Indicator */}
          <div className="w-5 h-2.5 border-[1.2px] border-[#161839] rounded-[3px] p-[1px] ml-0.5 flex items-center">
            <div className="w-full h-full bg-[#161839] rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-start px-6 pt-4 pb-2 max-w-md mx-auto w-full z-10">
        {/* Brand Icon & Wordmark Section matching the exact image */}
        <div className="flex flex-col items-center justify-center text-center pt-2 pb-6">
          {/* Logo Tape Ribbon Mascot */}
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <img
              src="/images/measureme-logo-purple.png"
              alt="Measure Me Logo"
              className="w-[72px] h-auto object-contain drop-shadow-sm select-none pointer-events-none"
            />
          </div>

          {/* Title: Measure me */}
          <h1 className="mt-3 text-[30px] font-extrabold tracking-tight text-[#161839] font-display flex items-center justify-center gap-1.5">
            <span>Measure</span>
            <span className="text-[#6C3EE0]">me</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-1.5 text-[14px] leading-snug text-[#868CA8] font-medium tracking-normal text-center">
            Your body. Perfectly measured.
            <br />
            Anywhere.
          </p>
        </div>

        {/* Input & Form Controls */}
        <form onSubmit={handleContinue} className="flex flex-col gap-3.5 w-full">
          {/* Email Input Field */}
          <div 
            onClick={() => {
              inputRef.current?.focus();
              setIsFocused(true);
            }}
            className={`relative w-full h-[54px] rounded-2xl px-4 flex items-center gap-3 transition-all duration-200 cursor-text ${
              isFocused 
                ? 'bg-[#EAE7F6] ring-2 ring-[#6C3EE0]/30 border border-[#DCD7F0]' 
                : 'bg-[#EEEBF8] border border-[#E4E0F4]'
            }`}
          >
            {/* Mail Icon in purple */}
            <div className="shrink-0 text-[#6C3EE0]">
              <Mail className="w-5 h-5 stroke-[2]" />
            </div>

            {/* Real Editable Input with simulated blinking cursor */}
            <div className="relative flex-1 flex items-center overflow-hidden">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full bg-transparent text-[#161839] text-[15px] font-normal tracking-normal focus:outline-hidden placeholder-[#868CA8]/70"
              />
            </div>

            {/* Clear Button (Circle with X) */}
            {email.length > 0 && (
              <button
                type="button"
                onClick={handleClearEmail}
                className="w-5 h-5 rounded-full bg-[#BDB9D6] hover:bg-[#A9A4C6] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Clear email"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Primary Continue Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] rounded-full bg-[#6C3EE0] hover:bg-[#5E32D0] active:bg-[#552ABE] text-white font-semibold text-[15px] tracking-tight flex items-center justify-center gap-1.5 shadow-md shadow-[#6C3EE0]/25 transition-all duration-150 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Continuing...</span>
              </span>
            ) : (
              <>
                <span>Continue</span>
                <span className="text-base font-normal leading-none ml-0.5">→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider: "or" */}
        <div className="flex items-center my-4 px-1">
          <div className="flex-1 h-px bg-[#E8E6F0]" />
          <span className="px-3 text-[13px] text-[#9298B6] font-normal lowercase tracking-normal">
            or
          </span>
          <div className="flex-1 h-px bg-[#E8E6F0]" />
        </div>

        {/* Social Authentication Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-[52px] rounded-full bg-white hover:bg-neutral-50/90 active:bg-neutral-100 border border-[#E5E3EE] text-[#121625] font-semibold text-[14px] sm:text-[15px] flex items-center justify-center gap-2.5 shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.99]"
          >
            {/* Google colored G icon */}
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          {/* Continue with Apple */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            className="w-full h-[52px] rounded-full bg-white hover:bg-neutral-50/90 active:bg-neutral-100 border border-[#E5E3EE] text-[#121625] font-semibold text-[14px] sm:text-[15px] flex items-center justify-center gap-2.5 shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.99]"
          >
            {/* Apple black icon */}
            <svg className="w-4.5 h-4.5 fill-black shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.89-12-14.43-6.19-9.47-10.9-20.48-14.13-33.03-3.23-12.56-4.85-24.3-4.85-35.24 0-14.61 3.69-26.79 11.07-36.54 7.39-9.76 16.63-14.77 27.72-15.03 4.58 0 9.87 1.25 15.87 3.75 6 2.5 10.22 3.82 12.66 3.97 1.9-.27 6.25-1.63 13.06-4.09 6.81-2.46 12.35-3.56 16.63-3.3 12.28.64 22.18 5.22 29.7 13.74-10.84 6.59-16.14 15.67-15.91 27.24.23 9.4 3.93 17.26 11.11 23.59 7.18 6.33 15.67 10.05 25.48 11.15-2.23 6.94-4.87 13.68-7.91 20.22zM119.22 31.84c0-7.39 2.63-14.14 7.89-20.25 5.26-6.12 11.75-9.98 19.46-11.59.34 1.12.51 2.37.51 3.75 0 7.39-2.73 14.28-8.19 20.67-5.46 6.39-11.95 10.15-19.46 11.27-.07-1.28-.21-2.56-.21-3.85z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Forgot password link */}
        <div className="pt-3 pb-3 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-[13px] font-normal text-[#73779C] hover:text-[#6C3EE0] transition-colors cursor-pointer"
          >
            Forgot your password?
          </button>
        </div>

        {/* Optional Sign up link if user needs to create brand new account */}
        {onCreateAccountClick && (
          <div className="text-center pb-2">
            <button
              type="button"
              onClick={onCreateAccountClick}
              className="text-[12px] font-medium text-[#868CA8] hover:text-[#161839] transition-colors cursor-pointer"
            >
              Don't have an account? <span className="text-[#6C3EE0] font-semibold">Sign up</span>
            </button>
          </div>
        )}
      </div>

      {/* Realistic Simulated iOS Virtual Keyboard matching the reference mockup */}
      <div className="w-full flex flex-col justify-end bg-[#E2E1EB] pt-1.5 pb-2 border-t border-[#D7D5E4] shadow-inner select-none transition-all">
        {/* Keyboard Header bar with Dismiss/Toggle controls */}
        <div className="px-4 py-1 flex items-center justify-between text-[11px] text-[#73779C]">
          <span className="font-medium tracking-wide">English (US)</span>
          <button
            type="button"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="px-2 py-0.5 rounded-md hover:bg-black/5 font-semibold text-[#6C3EE0] cursor-pointer transition-colors"
          >
            {showKeyboard ? 'Hide keyboard ▾' : 'Show keyboard ▴'}
          </button>
        </div>

        {showKeyboard && (
          <div className="w-full max-w-md mx-auto px-1 flex flex-col gap-2 pt-1">
            {/* Keyboard Row 1: q w e r t y u i o p */}
            <div className="flex justify-center gap-1.5 px-0.5">
              {(isNumberPad ? row1Numbers : row1Letters).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="flex-1 h-[42px] max-w-[34px] bg-white active:bg-neutral-200 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[19px] font-normal text-black cursor-pointer transition-transform active:scale-95"
                >
                  {isShiftActive ? key.toUpperCase() : key}
                </button>
              ))}
            </div>

            {/* Keyboard Row 2: a s d f g h j k l */}
            <div className="flex justify-center gap-1.5 px-3">
              {(isNumberPad ? row2Numbers : row2Letters).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="flex-1 h-[42px] max-w-[34px] bg-white active:bg-neutral-200 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[19px] font-normal text-black cursor-pointer transition-transform active:scale-95"
                >
                  {isShiftActive ? key.toUpperCase() : key}
                </button>
              ))}
            </div>

            {/* Keyboard Row 3: Shift / Numbers, z x c v b n m, Backspace */}
            <div className="flex justify-between items-center gap-1.5 px-0.5">
              {/* Shift Key */}
              <button
                type="button"
                onClick={() => setIsShiftActive(!isShiftActive)}
                className={`w-[42px] h-[42px] rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center transition-colors cursor-pointer ${
                  isShiftActive ? 'bg-white text-black' : 'bg-[#B7B5C7] text-neutral-800'
                }`}
                aria-label="Shift"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4l-6.5 8h4.5v8h4v-8h4.5L12 4z" />
                </svg>
              </button>

              {/* Row 3 letters */}
              <div className="flex-1 flex justify-center gap-1.5">
                {(isNumberPad ? row3Numbers : row3Letters).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleVirtualKeyPress(key)}
                    className="flex-1 h-[42px] max-w-[34px] bg-white active:bg-neutral-200 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[19px] font-normal text-black cursor-pointer transition-transform active:scale-95"
                  >
                    {isShiftActive ? key.toUpperCase() : key}
                  </button>
                ))}
              </div>

              {/* Backspace Key */}
              <button
                type="button"
                onClick={handleVirtualBackspace}
                className="w-[42px] h-[42px] bg-[#B7B5C7] active:bg-neutral-300 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-neutral-800 cursor-pointer transition-colors active:scale-95"
                aria-label="Backspace"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
                </svg>
              </button>
            </div>

            {/* Keyboard Row 4: 123, space, return */}
            <div className="flex justify-between items-center gap-1.5 px-0.5 mt-0.5">
              {/* 123 toggle key */}
              <button
                type="button"
                onClick={() => setIsNumberPad(!isNumberPad)}
                className="w-[74px] h-[42px] bg-[#B7B5C7] active:bg-neutral-300 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[15px] font-medium text-black cursor-pointer"
              >
                {isNumberPad ? 'ABC' : '123'}
              </button>

              {/* Space Bar */}
              <button
                type="button"
                onClick={handleVirtualSpace}
                className="flex-1 h-[42px] bg-white active:bg-neutral-200 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[15px] font-normal text-black cursor-pointer active:scale-98"
              >
                space
              </button>

              {/* Return Key */}
              <button
                type="button"
                onClick={() => handleContinue()}
                className="w-[74px] h-[42px] bg-[#B7B5C7] hover:bg-[#A8A6B8] active:bg-neutral-300 rounded-[5px] shadow-[0_1px_1px_rgba(0,0,0,0.25)] flex items-center justify-center text-[15px] font-normal text-black cursor-pointer transition-colors"
              >
                return
              </button>
            </div>

            {/* Bottom Row: Emoji Smiley, Home indicator bar, Microphone */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[#4A475A]">
              {/* Emoji Icon */}
              <button
                type="button"
                onClick={() => triggerToast('Emoji keyboard')}
                className="w-8 h-8 flex items-center justify-center hover:text-black cursor-pointer"
                aria-label="Emoji"
              >
                <Smile className="w-6 h-6 stroke-[1.6]" />
              </button>

              {/* iOS Home Indicator Bar */}
              <div className="w-34 h-1 bg-[#1A1A1A] rounded-full mx-auto" />

              {/* Microphone Icon */}
              <button
                type="button"
                onClick={() => triggerToast('Dictation activated')}
                className="w-8 h-8 flex items-center justify-center hover:text-black cursor-pointer"
                aria-label="Dictation"
              >
                <Mic className="w-6 h-6 stroke-[1.6]" />
              </button>
            </div>
          </div>
        )}

        {!showKeyboard && (
          <div className="w-full flex justify-center py-2">
            <div className="w-34 h-1 bg-[#1A1A1A] rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

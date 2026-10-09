import React, { useState, useEffect, useCallback } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from '../ui/carousel';
import { Button } from '../ui/button';
import { Mascot } from '../common/Mascot';
import { ArrowRight, ArrowLeft, Sparkles, Users, Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface OnboardingCarouselProps {
  onComplete: () => void;
  onLoginClick?: () => void;
}

interface SlideData {
  id: number;
  badge: string;
  badgeIcon: React.ReactNode;
  titlePrimary: string;
  titleAccent: string;
  titleSecondary: string;
  accentColor: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  illustrationFallbackText: string;
  theme: 'light' | 'dark';
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ 
  onComplete,
  onLoginClick
}) => {
  const { completeOnboarding, session } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const slides: SlideData[] = [
    {
      id: 1,
      badge: "Tailoring Made Easy",
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-[#6C47FF]" />,
      titlePrimary: "Get your clothes",
      titleAccent: "done with ease.",
      titleSecondary: "",
      accentColor: "text-[#6C47FF]",
      description: "You can now get your bodily measurements to your tailor from wherever you with ease. just a click away.",
      imageSrc: "/images/illustrations/onboarding-slide1-transparent.png",
      imageAlt: "Get your clothes done with ease - Tailoring Made Easy",
      illustrationFallbackText: "Tailoring Made Easy Illustration",
      theme: 'light',
    },
    {
      id: 2,
      badge: "All with your phone",
      badgeIcon: <Smartphone className="w-3.5 h-3.5 text-[#6C47FF]" />,
      titlePrimary: "All with",
      titleAccent: "your phone.",
      titleSecondary: "",
      accentColor: "text-[#6C47FF]",
      description: "By just standing in front of your door frame and holding up your phone.",
      imageSrc: "/images/illustrations/onboarding-slide2-transparent.png",
      imageAlt: "All with your phone - Door frame reference calibration",
      illustrationFallbackText: "Phone Measurement Scan Illustration",
      theme: 'light',
    },
    {
      id: 3,
      badge: "Manage Clients",
      badgeIcon: <Users className="w-3.5 h-3.5 text-[#6C47FF]" />,
      titlePrimary: "Manage Clients",
      titleAccent: "Body measurements",
      titleSecondary: "",
      accentColor: "text-[#6C47FF]",
      description: "You can manage clients body measurement in a well organised and structure.",
      imageSrc: "/images/illustrations/onboarding-slide3-transparent.png",
      imageAlt: "Manage Clients Body measurements - Tailoring Client Measurement Suite",
      illustrationFallbackText: "Manage Clients Body Measurements Illustration",
      theme: 'light',
    },
    {
      id: 4,
      badge: "Gen-Z Tailoring",
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-[#6C47FF]" />,
      titlePrimary: "Become that",
      titleAccent: "Genz tailor",
      titleSecondary: "",
      accentColor: "text-[#6C47FF]",
      description: "Take away the hassle of booking physical appointments from you clients who just want to be dressed nice.",
      imageSrc: "/images/illustrations/onboarding-slide4-transparent.png",
      imageAlt: "Become that Genz tailor - Take away the hassle of booking physical appointments",
      illustrationFallbackText: "Modern Gen-Z Tailor Illustration",
      theme: 'light',
    }
  ];

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  const handleFinishOnboarding = async () => {
    if (isCompleting) return;
    setCompleteError(null);

    if (session) {
      setIsCompleting(true);
      try {
        await completeOnboarding();
        onComplete();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not save onboarding progress. Please try again.';
        setCompleteError(message);
      } finally {
        setIsCompleting(false);
      }
    } else {
      onComplete();
    }
  };

  const handleNext = () => {
    if (!api) return;
    if (currentIndex < slides.length - 1) {
      api.scrollNext();
    } else {
      handleFinishOnboarding();
    }
  };

  const handlePrev = () => {
    if (!api || isCompleting) return;
    api.scrollPrev();
  };

  const handleSkip = () => {
    handleFinishOnboarding();
  };

  const currentTheme = slides[currentIndex]?.theme || 'dark';
  const isLight = currentTheme === 'light';

  return (
    <div 
      className={`relative w-full h-full min-h-screen flex flex-col justify-between select-none overflow-hidden transition-colors duration-500 ${
        isLight ? 'bg-white text-neutral-900' : 'bg-[#0A0A0E] text-white'
      }`}
    >
      {/* Top Bar Header */}
      <header className="px-6 pt-5 pb-1 flex items-center justify-between z-20 max-w-lg mx-auto w-full">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2">
          <Mascot size={24} color={isLight ? "purple" : "green"} />
          <span className={`font-display font-bold text-lg tracking-tight ${isLight ? 'text-neutral-950' : 'text-white'}`}>
            Measure <span className={isLight ? 'text-[#6C47FF]' : 'text-[#27D07F]'}>Me</span>
          </span>
        </div>

        {/* Top Progress Dots Indicator */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
            isLight 
              ? 'bg-neutral-100 border-neutral-200' 
              : 'bg-[#14141E] border-white/5'
          }`}
          role="tablist"
          aria-label="Carousel pagination"
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              aria-selected={idx === currentIndex}
              className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                idx === currentIndex 
                  ? isLight ? 'w-6 bg-[#6C47FF]' : 'w-6 bg-[#27D07F]' 
                  : isLight ? 'w-1.5 bg-neutral-300 hover:bg-neutral-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Skip Action */}
        <button 
          onClick={handleSkip}
          disabled={isCompleting}
          className={`text-xs font-semibold transition-colors px-2 py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isLight ? 'text-neutral-500 hover:text-neutral-950' : 'text-[#8E8CA3] hover:text-white'
          }`}
        >
          {isCompleting ? 'Saving...' : 'Skip'}
        </button>
      </header>

      {/* Main shadcn Carousel Area */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden w-full max-w-lg mx-auto px-4">
        <Carousel 
          setApi={setApi} 
          opts={{ loop: false }} 
          className="w-full h-full flex flex-col justify-center"
        >
          <CarouselContent className="h-full items-center">
            {slides.map((slide) => {
              const isSlideLight = slide.theme === 'light';

              return (
                <CarouselItem key={slide.id} className="flex flex-col justify-between py-1 h-full">
                  {/* Clean Light Theme Slides (Slides 1 & 2): Matching exact artwork size and proportion */}
                  {isSlideLight ? (
                    <div className="flex flex-col justify-between h-full px-2 py-1">
                      {/* Generous Illustration Area - Exactly matching the proportions of the original mockup */}
                      <div className="w-full h-[50vh] min-h-[310px] max-h-[480px] flex items-center justify-center relative overflow-hidden my-auto">
                        <img
                          src={slide.imageSrc}
                          alt={slide.imageAlt}
                          className="h-full w-auto max-w-full object-contain relative z-10 transition-transform duration-500 select-none pointer-events-none"
                        />
                      </div>

                      {/* Text Section matching original mockup design */}
                      <div className="text-center pt-2 pb-4 px-2">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 leading-tight font-display">
                          {slide.titlePrimary}{' '}
                          <span className="text-[#6C47FF] block">{slide.titleAccent}</span>
                        </h1>

                        <p className="mt-3 text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-xs sm:max-w-sm mx-auto font-normal">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Dark Theme Slides (Slides 3 & 4) */
                    <div className="flex flex-col justify-between h-full px-2 py-1">
                      {/* Top Feature Tag & Headline */}
                      <div className="pt-2 text-left">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#161622] border border-white/5 text-[#A19EBB]">
                          {slide.badgeIcon}
                          {slide.badge}
                        </span>

                        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
                          {slide.titlePrimary}{' '}
                          <span className={slide.accentColor}>{slide.titleAccent}</span>{' '}
                          {slide.titleSecondary}
                        </h2>

                        <p className="mt-2 text-xs sm:text-sm text-[#8E8CA3] leading-relaxed max-w-sm">
                          {slide.description}
                        </p>
                      </div>

                      {/* Central Illustration Area with backgroundless transparent image */}
                      <div className="w-full h-[44vh] min-h-[280px] max-h-[400px] flex items-center justify-center relative my-auto">
                        <div className="relative w-full h-full flex items-center justify-center p-2 group">
                          {/* Ambient Glow */}
                          <div 
                            className={`absolute w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none ${
                              slide.id === 3 ? 'bg-[#B69EFF]' : 'bg-[#27D07F]'
                            }`} 
                          />

                          <img
                            src={slide.imageSrc}
                            alt={slide.imageAlt}
                            className="max-h-full max-w-full object-contain relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="h-1" />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Bottom Sticky Action Area */}
      <footer className="px-6 pb-8 pt-2 max-w-lg mx-auto w-full z-20 flex flex-col gap-3">
        {completeError && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-between text-xs text-red-400 font-medium animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{completeError}</span>
            </div>
            <button 
              type="button"
              onClick={handleFinishOnboarding}
              className="text-[#27D07F] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {isLight ? (
          /* Light Footer matching the provided screens: [← Back]  [ • • • • ]  [Next →] */
          <div className="flex flex-col gap-2 w-full pt-1">
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0 || isCompleting}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  currentIndex === 0 ? 'text-transparent pointer-events-none opacity-0' : 'text-neutral-700 hover:text-neutral-950'
                }`}
              >
                <ArrowLeft className="w-4 h-4 stroke-[2]" />
                <span>Back</span>
              </button>

              {/* Bottom 4 Dots matching exact mockup positioning */}
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => !isCompleting && api?.scrollTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-2.5 h-2.5 bg-[#6C47FF]'
                        : 'w-2 h-2 bg-[#E5E0FF] hover:bg-[#D5CEFC]'
                    }`}
                  />
                ))}
              </div>

              {/* Purple Pill Button matching mockup */}
              <Button
                onClick={handleNext}
                disabled={isCompleting}
                className="h-12 px-6 rounded-full bg-[#6C47FF] hover:bg-[#5C37EF] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6C47FF]/25 transition-all disabled:opacity-60"
              >
                {isCompleting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Saving...</span>
                  </span>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </Button>
            </div>

            {currentIndex === slides.length - 1 && (
              <button 
                onClick={onLoginClick || onComplete}
                className="text-center text-xs font-medium text-neutral-500 hover:text-[#6C47FF] transition-colors pt-1 cursor-pointer"
              >
                Already have an account? <span className="underline decoration-neutral-300 text-[#6C47FF] font-semibold">Log in</span>
              </button>
            )}
          </div>
        ) : (
          /* Dark Footer for subsequent slides */
          <>
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              variant="default"
              className="w-full h-13 rounded-full bg-[#27D07F] hover:bg-[#22BD73] text-neutral-950 font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#27D07F]/15 disabled:opacity-60"
            >
              {isCompleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-neutral-950" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                <>
                  <span>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </Button>

            <button 
              onClick={onLoginClick || onComplete}
              className="text-center text-xs font-medium text-[#8E8CA3] hover:text-[#B69EFF] transition-colors py-1 cursor-pointer"
            >
              Already have an account? <span className="underline decoration-white/20 text-[#27D07F] font-semibold">Log in</span>
            </button>
          </>
        )}
      </footer>
    </div>
  );
};

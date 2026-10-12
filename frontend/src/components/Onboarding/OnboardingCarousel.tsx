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
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
      titlePrimary: "Get your clothes",
      titleAccent: "done with ease.",
      titleSecondary: "",
      accentColor: "text-primary",
      description: "You can now get your bodily measurements to your tailor from wherever you with ease. just a click away.",
      imageSrc: "/images/illustrations/onboarding-slide1-transparent.png",
      imageAlt: "Get your clothes done with ease - Tailoring Made Easy",
      illustrationFallbackText: "Tailoring Made Easy Illustration",
      theme: 'light',
    },
    {
      id: 2,
      badge: "All with your phone",
      badgeIcon: <Smartphone className="w-3.5 h-3.5 text-primary" />,
      titlePrimary: "All with",
      titleAccent: "your phone.",
      titleSecondary: "",
      accentColor: "text-primary",
      description: "By just standing in front of your door frame and holding up your phone.",
      imageSrc: "/images/illustrations/onboarding-slide2-transparent.png",
      imageAlt: "All with your phone - Door frame reference calibration",
      illustrationFallbackText: "Phone Measurement Scan Illustration",
      theme: 'light',
    },
    {
      id: 3,
      badge: "Manage Clients",
      badgeIcon: <Users className="w-3.5 h-3.5 text-primary" />,
      titlePrimary: "Manage Clients",
      titleAccent: "Body measurements",
      titleSecondary: "",
      accentColor: "text-primary",
      description: "You can manage clients body measurement in a well organised and structure.",
      imageSrc: "/images/illustrations/onboarding-slide3-transparent.png",
      imageAlt: "Manage Clients Body measurements - Tailoring Client Measurement Suite",
      illustrationFallbackText: "Manage Clients Body Measurements Illustration",
      theme: 'light',
    },
    {
      id: 4,
      badge: "Gen-Z Tailoring",
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
      titlePrimary: "Become that",
      titleAccent: "Genz tailor",
      titleSecondary: "",
      accentColor: "text-primary",
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
      className="relative w-full h-full min-h-screen flex flex-col justify-between select-none overflow-hidden transition-colors duration-500 bg-background text-foreground"
    >
      {/* Top Bar Header */}
      <header className="px-6 pt-5 pb-1 flex items-center justify-between z-20 max-w-lg mx-auto w-full">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2">
          <Mascot size={24} color={isLight ? "purple" : "green"} />
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            Measure <span className="text-primary">Me</span>
          </span>
        </div>

        {/* Top Progress Dots Indicator */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card transition-colors"
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
                  ? 'w-6 bg-primary' 
                  : 'w-1.5 bg-muted hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        {/* Skip Action */}
        <button 
          onClick={handleSkip}
          disabled={isCompleting}
          className="text-xs font-semibold transition-colors px-2 py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
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
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight font-display">
                          {slide.titlePrimary}{' '}
                          <span className="text-primary block">{slide.titleAccent}</span>
                        </h1>

                        <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs sm:max-w-sm mx-auto font-normal">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Dark Theme Slides (Slides 3 & 4) */
                    <div className="flex flex-col justify-between h-full px-2 py-1">
                      {/* Top Feature Tag & Headline */}
                      <div className="pt-2 text-left">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-secondary border border-border text-secondary-foreground">
                          {slide.badgeIcon}
                          {slide.badge}
                        </span>

                        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight font-display">
                          {slide.titlePrimary}{' '}
                          <span className={slide.accentColor}>{slide.titleAccent}</span>{' '}
                          {slide.titleSecondary}
                        </h2>

                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                          {slide.description}
                        </p>
                      </div>

                      {/* Central Illustration Area with backgroundless transparent image */}
                      <div className="w-full h-[44vh] min-h-[280px] max-h-[400px] flex items-center justify-center relative my-auto">
                        <div className="relative w-full h-full flex items-center justify-center p-2 group">
                          {/* Ambient Glow */}
                          <div 
                            className={`absolute w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none ${
                              slide.id === 3 ? 'bg-primary' : 'bg-accent'
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
          <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-2xl flex items-center justify-between text-xs text-destructive font-medium animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{completeError}</span>
            </div>
            <button 
              type="button"
              onClick={handleFinishOnboarding}
              className="text-primary hover:underline font-semibold cursor-pointer shrink-0 ml-2"
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
                  currentIndex === 0 ? 'text-transparent pointer-events-none opacity-0' : 'text-muted-foreground hover:text-foreground'
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
                        ? 'w-2.5 h-2.5 bg-primary'
                        : 'w-2 h-2 bg-muted hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              {/* Pill Button */}
              <Button
                onClick={handleNext}
                disabled={isCompleting}
                isLoading={isCompleting}
                className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 transition-all"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Button>
            </div>

            {currentIndex === slides.length - 1 && (
              <button 
                onClick={onLoginClick || onComplete}
                className="text-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors pt-1 cursor-pointer"
              >
                Already have an account? <span className="underline decoration-border text-primary font-semibold">Log in</span>
              </button>
            )}
          </div>
        ) : (
          /* Dark Footer for subsequent slides */
          <>
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              isLoading={isCompleting}
              variant="default"
              className="w-full h-13 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
            >
              <span>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Button>

            <button 
              onClick={onLoginClick || onComplete}
              className="text-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
            >
              Already have an account? <span className="underline decoration-border text-primary font-semibold">Log in</span>
            </button>
          </>
        )}
      </footer>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Camera } from 'lucide-react';

export interface BannerSlide {
  id: number | string;
  lineOne: string;
  lineTwo: string;
  image: string;
  imageAlt: string;
}

const slides: BannerSlide[] = [
  {
    id: 1,
    lineOne: 'Want to get your dress done with',
    lineTwo: "BIGGIE's?",
    image: '/images/banner/banner-1.png',
    imageAlt: 'Woman with afro and colourful floral shirt',
  },
  {
    id: 2,
    lineOne: 'No need to go see that tailor. Just',
    lineTwo: 'SNAP!',
    image: '/images/banner/banner-2.png',
    imageAlt: 'Man with patterned glasses, tall black hat and black-and-white print shirt',
  },
];

interface DashboardBannerProps {
  onStartMeasurement: () => void;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({ onStartMeasurement }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Monitor tab visibility to pause autoplay when tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Autoplay: advance every 5s, resets on index change (manual click) or pause/resume
  useEffect(() => {
    if (isPaused || !isTabVisible) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, isTabVisible]);

  const handleSelectSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <div
      className="relative rounded-3xl bg-[#C8A6F9] text-black overflow-hidden shadow-md shadow-primary/20 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional announcements"
    >
      {/* Fixed Background Tonal Pattern */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-0 opacity-10 mix-blend-multiply"
        style={{
          backgroundImage: `url('/images/banner/banner-pattern.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* Carousel Track: slides move together (text + image) */}
      <div
        className={`flex w-full ${
          prefersReducedMotion ? 'transition-none' : 'transition-transform duration-500 ease-in-out'
        }`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full min-w-full relative px-6 pt-6 pb-20 sm:pb-22 flex items-start justify-between min-h-[220px] sm:min-h-[250px]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={currentIndex !== index}
          >
            {/* Headline Block (Line 1 black, Line 2 large white bold) */}
            <div className="relative z-10 max-w-[58%] sm:max-w-[55%] flex flex-col justify-start">
              <p className="font-bold text-black text-base sm:text-lg md:text-xl leading-snug tracking-tight max-w-[210px] sm:max-w-[260px]">
                {slide.lineOne}
              </p>
              <p className="font-black text-white text-3xl sm:text-4xl md:text-5xl leading-none tracking-tight mt-1 drop-shadow-xs">
                {slide.lineTwo}
              </p>
            </div>

            {/* Cutout Image (Right aligned, bottom-aligned, cropped by card bottom) */}
            <div className="absolute right-0 bottom-0 h-full max-h-[220px] sm:max-h-[250px] w-[50%] sm:w-[46%] flex items-end justify-end pointer-events-none z-10">
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="h-full w-auto max-h-[220px] sm:max-h-[250px] object-contain object-bottom pointer-events-none select-none"
                loading="eager"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fixed "Launch Scan" Button (bottom-left, does not move with track) */}
      <div className="absolute bottom-5 left-6 z-20">
        <button
          type="button"
          onClick={onStartMeasurement}
          className="h-11 bg-black hover:bg-neutral-900 active:scale-95 text-white rounded-full text-xs sm:text-sm font-bold px-5 py-2.5 flex items-center gap-2.5 shadow-md cursor-pointer transition-all border-0"
          aria-label="Launch Scan"
        >
          <Camera className="w-4 h-4 text-white stroke-[2.2]" />
          <span>Launch Scan</span>
        </button>
      </div>

      {/* Fixed Indicator Dots (bottom-right, clickable, resets autoplay) */}
      <div
        className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/15 backdrop-blur-xs"
        role="tablist"
        aria-label="Slide navigation"
      >
        {slides.map((slide, index) => {
          const isActive = currentIndex === index;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleSelectSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isActive ? 'w-5 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};

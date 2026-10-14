import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/Splash/SplashScreen';
import { OnboardingCarousel } from './components/Onboarding/OnboardingCarousel';
import { CreateAccountScreen } from './components/Auth/CreateAccountScreen';
import { LoginScreen } from './components/Auth/LoginScreen';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { ProjectsScreen } from './components/Projects/ProjectsScreen';
import { ProjectDetailsScreen } from './components/Projects/ProjectDetailsScreen';
import { MeasurementGuideScreen } from './components/Measurement/MeasurementGuideScreen';
import { CameraCaptureScreen } from './components/Measurement/CameraCaptureScreen';
import { ProcessingScreen } from './components/Measurement/ProcessingScreen';
import { ResultsScreen } from './components/Measurement/ResultsScreen';
import { GarmentCanvasScreen } from './components/Measurement/GarmentCanvasScreen';
import { CommentsScreen } from './components/Comments/CommentsScreen';
import { ShareLinkScreen } from './components/Share/ShareLinkScreen';
import { Layers, X, LogOut, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from './auth/useAuth';
import { PillLoader } from './components/common/PillLoader';

export type ScreenState = 
  | 'splash'
  | 'onboarding'
  | 'create-account'
  | 'login'
  | 'dashboard'
  | 'projects'
  | 'project-details'
  | 'measurement-guide'
  | 'camera-capture'
  | 'processing'
  | 'results'
  | 'garment-canvas'
  | 'comments'
  | 'share-link';

const PRE_LOGIN_SCREENS: ScreenState[] = ['splash', 'create-account', 'login'];

export function App() {
  const { 
    session, 
    user, 
    profile, 
    loading, 
    profileLoading, 
    profileError, 
    retryLoadProfile, 
    signOut 
  } = useAuth();
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean>(() => {
    try {
      return localStorage.getItem('measure_me_has_seen_splash') === 'true';
    } catch {
      return false;
    }
  });
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    try {
      if (localStorage.getItem('measure_me_has_seen_splash') === 'true') {
        return 'login';
      }
    } catch {
      // ignore
    }
    return 'splash';
  });
  const [intendedScreen, setIntendedScreen] = useState<ScreenState | null>(null);
  const [showNavDrawer, setShowNavDrawer] = useState(false);

  const isAuthed = !!session;
  const hasCompletedOnboarding = !!profile?.onboarding_completed;
  const isAppLoading = loading || (isAuthed && profileLoading);

  // Single central decision point based on Section 5 routing table:
  // - Loading: show app loading screen (no login/onboarding flash)
  // - Logged out: pre-login flow only. Protected screens redirect to login.
  // - Logged in + onboarding_completed = false: onboarding screen only.
  // - Logged in + onboarding_completed = true: main app. Pre-login/onboarding redirect to dashboard.
  const getCanonicalScreen = useCallback((screen: ScreenState): ScreenState => {
    if (!hasSeenSplash && screen === 'splash') {
      return 'splash';
    }

    if (!isAuthed) {
      if (screen === 'splash') {
        return hasSeenSplash ? 'login' : 'splash';
      }
      if (!PRE_LOGIN_SCREENS.includes(screen)) {
        return 'login';
      }
      return screen;
    }

    if (!hasCompletedOnboarding) {
      return 'onboarding';
    }

    if (PRE_LOGIN_SCREENS.includes(screen) || screen === 'onboarding') {
      return intendedScreen || 'dashboard';
    }

    return screen;
  }, [hasSeenSplash, isAuthed, hasCompletedOnboarding, intendedScreen]);

  const activeScreen = getCanonicalScreen(currentScreen);

  // Synchronize internal state with canonical route decision
  useEffect(() => {
    if (isAppLoading || (session && profileError)) return;

    const canonical = getCanonicalScreen(currentScreen);
    if (canonical !== currentScreen) {
      if (!session && !PRE_LOGIN_SCREENS.includes(currentScreen)) {
        setIntendedScreen(currentScreen);
      }
      setCurrentScreen(canonical);
    }
  }, [session, isAppLoading, profileError, currentScreen, getCanonicalScreen]);

  const screens: { id: ScreenState; label: string; num: string }[] = [
    { id: 'splash', label: '1. Splash Screen', num: '1' },
    { id: 'onboarding', label: '2. Onboarding Carousel', num: '2' },
    { id: 'create-account', label: '3. Sign Up / Create Account', num: '3' },
    { id: 'login', label: '4. Login / Onboarding Auth (Ref Mockup)', num: '4' },
    { id: 'dashboard', label: '5. Dashboard Home', num: '5' },
    { id: 'projects', label: '6. Projects List', num: '6' },
    { id: 'project-details', label: '7. Project Details', num: '7' },
    { id: 'measurement-guide', label: '8. Measurement Guide', num: '8' },
    { id: 'camera-capture', label: '9. Camera Scanner', num: '9' },
    { id: 'processing', label: '10. Processing Animation', num: '10' },
    { id: 'results', label: '11. Measurement Results', num: '11' },
    { id: 'garment-canvas', label: '12. Croquis Canvas & Pins', num: '12' },
    { id: 'comments', label: '13. Comments Screen', num: '13' },
    { id: 'share-link', label: '15. Share 48h Link', num: '15' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIntendedScreen(null);
    setCurrentScreen('login');
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Ada';

  // 1. Loading state: Session check or Profile loading (neutral spinner without mascot icon)
  if (isAppLoading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center text-foreground p-4">
        <PillLoader />
      </div>
    );
  }

  // 2. Profile fetch failed (network or server error): Show retry state without dropping into onboarding
  if (session && profileError) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center text-foreground p-4 font-sans">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-destructive/15 border border-destructive/25 flex items-center justify-center text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Connection Error</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{profileError}</p>
          </div>
          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button
              onClick={() => retryLoadProfile()}
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md"
            >
              Retry Connection
            </button>
            <button
              onClick={handleSignOut}
              className="w-full h-10 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-medium text-xs transition-all cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans flex justify-center">
      {/* Centered mobile-first container */}
      <div className="w-full max-w-md min-h-screen bg-card text-card-foreground relative shadow-2xl overflow-x-hidden border-x border-border/40">
        {/* Floating Screen Switcher Drawer for quick demo and testing */}
        <aside aria-label="Screen switcher" className="fixed top-3 right-4 z-50">
          <button
            onClick={() => setShowNavDrawer(!showNavDrawer)}
            className="px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur-md border border-border text-xs font-semibold text-secondary-foreground hover:bg-secondary hover:border-primary/40 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Switch Screen"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Screens</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/50 text-foreground/80">
              {screens.find((s) => s.id === activeScreen)?.num}
            </span>
          </button>

          {showNavDrawer && (
            <div className="absolute right-0 top-10 w-72 max-h-[82vh] overflow-y-auto bg-popover/95 text-popover-foreground backdrop-blur-xl border border-border rounded-2xl p-3 shadow-2xl flex flex-col gap-1 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-popover-foreground">
                  Mobile Screens
                </span>
                <button
                  onClick={() => setShowNavDrawer(false)}
                  className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User session status in drawer */}
              {session && (
                <div className="p-2 my-1 rounded-xl bg-muted border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs text-foreground truncate font-medium">{displayName}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowNavDrawer(false);
                    }}
                    className="text-[11px] text-destructive hover:opacity-80 flex items-center gap-1 font-semibold cursor-pointer shrink-0 ml-2"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1 mt-1">
                {screens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => {
                      if (!session) {
                        if (!PRE_LOGIN_SCREENS.includes(screen.id)) {
                          setIntendedScreen(screen.id);
                          setCurrentScreen('login');
                        } else {
                          setCurrentScreen(screen.id);
                        }
                      } else if (!hasCompletedOnboarding) {
                        setCurrentScreen('onboarding');
                      } else {
                        if (PRE_LOGIN_SCREENS.includes(screen.id) || screen.id === 'onboarding') {
                          setCurrentScreen('dashboard');
                        } else {
                          setCurrentScreen(screen.id);
                        }
                      }
                      setShowNavDrawer(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      activeScreen === screen.id
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{screen.label}</span>
                    <span className="text-[10px] opacity-70">#{screen.num}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Screens Flow */}
        <main className="w-full min-h-screen">
          {activeScreen === 'splash' && (
            <SplashScreen 
              onContinue={() => {
                try {
                  localStorage.setItem('measure_me_has_seen_splash', 'true');
                } catch {
                  // ignore
                }
                setHasSeenSplash(true);
                setCurrentScreen(isAuthed ? (hasCompletedOnboarding ? 'dashboard' : 'onboarding') : 'login');
              }} 
            />
          )}

          {activeScreen === 'onboarding' && (
            <OnboardingCarousel
              onComplete={() => {
                const target = intendedScreen || 'dashboard';
                setIntendedScreen(null);
                setCurrentScreen(target);
              }}
              onLoginClick={() => setCurrentScreen(session ? 'dashboard' : 'login')}
            />
          )}

          {activeScreen === 'create-account' && (
            <CreateAccountScreen
              onBack={() => setCurrentScreen('login')}
              onSuccess={() => {
                // Central router handles landing in onboarding or dashboard
              }}
              onLoginClick={() => setCurrentScreen('login')}
            />
          )}

          {activeScreen === 'login' && (
            <LoginScreen
              onBack={() => setCurrentScreen('splash')}
              onSuccess={() => {
                // Central router handles landing in onboarding or dashboard
              }}
              onCreateAccountClick={() => setCurrentScreen('create-account')}
            />
          )}

          {/* Protected Screens */}
          {activeScreen === 'dashboard' && (
            <DashboardScreen
              userName={displayName}
              onStartMeasurement={() => setCurrentScreen('measurement-guide')}
              onOpenProjects={() => setCurrentScreen('projects')}
              onOpenProjectDetails={(_id) => setCurrentScreen('project-details')}
              onShareLink={() => setCurrentScreen('share-link')}
              onSignOut={handleSignOut}
            />
          )}

          {activeScreen === 'projects' && (
            <ProjectsScreen
              onBackToHome={() => setCurrentScreen('dashboard')}
              onOpenProject={(_id) => setCurrentScreen('project-details')}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {activeScreen === 'project-details' && (
            <ProjectDetailsScreen
              onBack={() => setCurrentScreen('projects')}
              onSelectGarment={(_id) => setCurrentScreen('garment-canvas')}
              onAddMeasurement={() => setCurrentScreen('measurement-guide')}
              onOpenComments={() => setCurrentScreen('comments')}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {activeScreen === 'measurement-guide' && (
            <MeasurementGuideScreen
              onBack={() => setCurrentScreen('dashboard')}
              onStartCapture={() => setCurrentScreen('camera-capture')}
            />
          )}

          {activeScreen === 'camera-capture' && (
            <CameraCaptureScreen
              onBack={() => setCurrentScreen('measurement-guide')}
              onCaptured={() => setCurrentScreen('processing')}
            />
          )}

          {activeScreen === 'processing' && (
            <ProcessingScreen
              onComplete={() => setCurrentScreen('results')}
            />
          )}

          {activeScreen === 'results' && (
            <ResultsScreen
              onBack={() => setCurrentScreen('dashboard')}
              onSaveToProject={() => setCurrentScreen('project-details')}
              onViewDetails={() => setCurrentScreen('garment-canvas')}
            />
          )}

          {activeScreen === 'garment-canvas' && (
            <GarmentCanvasScreen
              onBack={() => setCurrentScreen('project-details')}
              onOpenComments={() => setCurrentScreen('comments')}
            />
          )}

          {activeScreen === 'comments' && (
            <CommentsScreen
              onBack={() => setCurrentScreen('project-details')}
            />
          )}

          {activeScreen === 'share-link' && (
            <ShareLinkScreen
              onBack={() => setCurrentScreen('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

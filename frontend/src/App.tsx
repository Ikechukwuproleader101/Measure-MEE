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
import { AlertCircle } from 'lucide-react';
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

function getProjectIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/projects\/([a-zA-Z0-9_-]+)/);
  if (match && match[1] && match[1] !== 'new') {
    return match[1];
  }
  const params = new URLSearchParams(window.location.search);
  const qId = params.get('projectId') || params.get('id');
  return qId || null;
}

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getProjectIdFromLocation());
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean>(() => {
    try {
      return localStorage.getItem('measure_me_has_seen_splash') === 'true';
    } catch {
      return false;
    }
  });
  const [intendedScreen, setIntendedScreen] = useState<ScreenState | null>(() => {
    const initialId = getProjectIdFromLocation();
    if (initialId) {
      return 'project-details';
    }
    if (typeof window !== 'undefined' && window.location.pathname === '/projects') {
      return 'projects';
    }
    return null;
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

  useEffect(() => {
    const handlePopState = () => {
      const id = getProjectIdFromLocation();
      setSelectedProjectId(id);
      if (id) {
        setCurrentScreen('project-details');
      } else if (window.location.pathname === '/projects' || window.location.pathname.startsWith('/projects/')) {
        setCurrentScreen('projects');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAuthed = !!session;
  const hasCompletedOnboarding = !!profile?.onboarding_completed;
  const isAppLoading = loading || (isAuthed && !profile && profileLoading);

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
              onStartMeasurement={() => setCurrentScreen('camera-capture')}
              onOpenProjects={() => {
                window.history.pushState(null, '', '/projects');
                setCurrentScreen('projects');
              }}
              onOpenProjectDetails={(id) => {
                if (id) {
                  setSelectedProjectId(id);
                  window.history.pushState(null, '', `/projects/${id}`);
                  setCurrentScreen('project-details');
                } else {
                  window.history.pushState(null, '', '/projects');
                  setCurrentScreen('projects');
                }
              }}
              onShareLink={() => setCurrentScreen('share-link')}
              onSignOut={handleSignOut}
            />
          )}

          {activeScreen === 'projects' && (
            <ProjectsScreen
              onBackToHome={() => {
                window.history.pushState(null, '', '/');
                setCurrentScreen('dashboard');
              }}
              onOpenProject={(id) => {
                setSelectedProjectId(id);
                window.history.pushState(null, '', `/projects/${id}`);
                setCurrentScreen('project-details');
              }}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {activeScreen === 'project-details' && (
            <ProjectDetailsScreen
              projectId={selectedProjectId || getProjectIdFromLocation() || undefined}
              onBack={() => {
                setSelectedProjectId(null);
                window.history.pushState(null, '', '/projects');
                setCurrentScreen('projects');
              }}
              onSelectGarment={(_id) => setCurrentScreen('garment-canvas')}
              onAddMeasurement={() => setCurrentScreen('camera-capture')}
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

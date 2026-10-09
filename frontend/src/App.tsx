import { useState } from 'react';
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
import { Layers, X } from 'lucide-react';

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

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [showNavDrawer, setShowNavDrawer] = useState(false);

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

  return (
    <div className="w-full min-h-screen bg-[#060608] text-white font-sans flex justify-center">
      {/* Centered mobile-first container */}
      <div className="w-full max-w-md min-h-screen bg-[#0A0A0E] relative shadow-2xl overflow-x-hidden">
        {/* Floating Screen Switcher Drawer for quick demo and testing */}
        <aside aria-label="Screen switcher" className="fixed top-3 right-4 z-50">
          <button
            onClick={() => setShowNavDrawer(!showNavDrawer)}
            className="px-3 py-1.5 rounded-full bg-[#181824]/90 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/80 hover:text-white hover:border-[#27D07F]/40 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Switch Screen"
          >
            <Layers className="w-3.5 h-3.5 text-[#27D07F]" />
            <span>Screens</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
              {screens.find((s) => s.id === currentScreen)?.num}
            </span>
          </button>

          {showNavDrawer && (
            <div className="absolute right-0 top-10 w-72 max-h-[82vh] overflow-y-auto bg-[#12121C]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Mobile Screens
                </span>
                <button
                  onClick={() => setShowNavDrawer(false)}
                  className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                {screens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => {
                      setCurrentScreen(screen.id);
                      setShowNavDrawer(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      currentScreen === screen.id
                        ? 'bg-[#27D07F] text-neutral-950 font-bold'
                        : 'text-[#B4B1C9] hover:bg-white/5 hover:text-white'
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
          {currentScreen === 'splash' && (
            <SplashScreen 
              onContinue={() => setCurrentScreen('onboarding')} 
            />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingCarousel
              onComplete={() => setCurrentScreen('login')}
              onLoginClick={() => setCurrentScreen('login')}
            />
          )}

          {currentScreen === 'create-account' && (
            <CreateAccountScreen
              onBack={() => setCurrentScreen('onboarding')}
              onSuccess={() => setCurrentScreen('dashboard')}
              onLoginClick={() => setCurrentScreen('login')}
            />
          )}

          {currentScreen === 'login' && (
            <LoginScreen
              onBack={() => setCurrentScreen('onboarding')}
              onSuccess={() => setCurrentScreen('dashboard')}
              onCreateAccountClick={() => setCurrentScreen('create-account')}
            />
          )}

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              onStartMeasurement={() => setCurrentScreen('measurement-guide')}
              onOpenProjects={() => setCurrentScreen('projects')}
              onOpenProjectDetails={(_id) => setCurrentScreen('project-details')}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {currentScreen === 'projects' && (
            <ProjectsScreen
              onBackToHome={() => setCurrentScreen('dashboard')}
              onOpenProject={(_id) => setCurrentScreen('project-details')}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {currentScreen === 'project-details' && (
            <ProjectDetailsScreen
              onBack={() => setCurrentScreen('projects')}
              onSelectGarment={(_id) => setCurrentScreen('garment-canvas')}
              onAddMeasurement={() => setCurrentScreen('measurement-guide')}
              onOpenComments={() => setCurrentScreen('comments')}
              onShareLink={() => setCurrentScreen('share-link')}
            />
          )}

          {currentScreen === 'measurement-guide' && (
            <MeasurementGuideScreen
              onBack={() => setCurrentScreen('dashboard')}
              onStartCapture={() => setCurrentScreen('camera-capture')}
            />
          )}

          {currentScreen === 'camera-capture' && (
            <CameraCaptureScreen
              onBack={() => setCurrentScreen('measurement-guide')}
              onCaptured={() => setCurrentScreen('processing')}
            />
          )}

          {currentScreen === 'processing' && (
            <ProcessingScreen
              onComplete={() => setCurrentScreen('results')}
            />
          )}

          {currentScreen === 'results' && (
            <ResultsScreen
              onBack={() => setCurrentScreen('dashboard')}
              onSaveToProject={() => setCurrentScreen('project-details')}
              onViewDetails={() => setCurrentScreen('garment-canvas')}
            />
          )}

          {currentScreen === 'garment-canvas' && (
            <GarmentCanvasScreen
              onBack={() => setCurrentScreen('project-details')}
              onOpenComments={() => setCurrentScreen('comments')}
            />
          )}

          {currentScreen === 'comments' && (
            <CommentsScreen
              onBack={() => setCurrentScreen('garment-canvas')}
            />
          )}

          {currentScreen === 'share-link' && (
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

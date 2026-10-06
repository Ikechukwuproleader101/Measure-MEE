# Measure Me — Web App

A remote bespoke digital measurement and tailoring collaboration platform built web-first with **React 19**, **Tailwind CSS v4**, and **shadcn/ui-inspired primitives**.

---

## 🌟 Overview & Feature Suite

The application solves remote tailoring fit accuracy by combining **on-device 3D camera contour extraction** with **tailor-client collaboration tools**.

### Implemented Screen Flow (`Ap ui flow.jpg` Specification)

1. **Splash Screen (`#B69EFF`)**:
   - Branded ghost mascot, wordmark, tagline ("Tailored Fit, Anywhere")
   - Auto-advancing timer + tap to skip
2. **Onboarding Carousel (3 Slides)**:
   - Embla-powered shadcn `Carousel` with custom pill pagination dots
   - Integrated illustration assets (`/images/illustrations/`) with graceful dashed-slot fallbacks
   - Slides: AI-Powered Capture, Triple-Signal Calibration, Real-Time Tailor Sync
3. **Sign-Up Screen (`CreateAccountScreen`)**:
   - Full name, email, password with toggle, instant feedback banner
4. **Login Screen (`LoginScreen`)**:
   - Email/password authentication, forgot password trigger, quick create-account link
5. **Dashboard Home (`DashboardScreen`)**:
   - "Hello, Ada 👋" personalized greeting
   - "Start a new measurement" hero card
   - Pending reviews count & 48h active link monitor
   - Active project tracker with 4-step progress stepper
6. **Projects Screen (`ProjectsScreen`)**:
   - Active vs. Archived filters, project cards with status indicators
7. **Project Details (`ProjectDetailsScreen`)**:
   - "Wedding Suit" garment breakdown (Jacket, Trousers, Waistcoat)
   - Progress stages: Review → Cutting → Fitting → Done
8. **Measurement Calibration Guide (`MeasurementGuideScreen`)**:
   - In-frame distance gating, door frame reference, LiDAR check, on-device privacy guarantee
9. **Camera Scanner Viewfinder (`CameraCaptureScreen`)**:
   - Pose landmark alignment guidelines, interactive countdown shutter
10. **On-Device Processing Animation (`ProcessingScreen`)**:
    - Gyroscopic orbit ring animation, multi-signal verification steps
11. **Measurement Results (`ResultsScreen`)**:
    - High Confidence 98% badge, croquis silhouette with pinned metric callouts
12. **Garment Croquis Canvas (`GarmentCanvasScreen`)**:
    - Dark background croquis with white outline and construction grid (Prêt-à-Template style)
    - Interactive two-way comment pins (brand purple accent `#B69EFF` for pending, muted gray-purple for resolved)
    - Canvas vs. Metrics Table toggle
13. **Comments Screen (`CommentsScreen`)**:
    - Tailor and client 2-way conversation feed, filterable by status, instant message composer
14. **Share Your Link (`ShareLinkScreen`)**:
    - 48-hour expiring link generator, one-click copy, regenerate and revocation controls

---

## 🛠️ Tech Stack & Architecture

- **React 19** + **TypeScript**
- **Vite 8** + **Tailwind CSS v4**
- **Embla Carousel React**
- **Lucide Icons**
- **Components**: shadcn/ui inspired (`Button`, `Carousel`, `Card`, `Badge`)

---

## 🚀 Getting Started

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

# Measure Me

A remote bespoke digital measurement and tailoring collaboration platform built with **React 19**, **Tailwind CSS v4**, and **shadcn/ui-inspired primitives**.

---

## 📁 Repository Structure

```text
Measure Me/
├── .vscode/                    # Workspace editor settings and recommended extensions
├── frontend/                   # React 19 + Vite + TypeScript frontend web application
│   ├── App images/             # Onboarding and reference image assets
│   ├── public/                 # Static public assets (icons, illustrations, logos)
│   ├── scripts/                # Asset processing & crop/transparency utility scripts
│   ├── src/                    # Frontend source code (screens, components, UI primitives)
│   ├── .env.example            # Frontend environment variable template
│   ├── .oxlintrc.json          # Oxlint configuration
│   ├── index.html              # HTML entry point
│   ├── package.json            # Frontend dependencies and npm scripts
│   ├── package-lock.json       # Frontend dependency lockfile
│   ├── tsconfig*.json          # TypeScript configurations
│   └── vite.config.ts          # Vite bundler configuration
├── backend/                    # Node.js + Express API backend (placeholder, to be implemented)
│   ├── .env.example            # Backend environment variable template
│   └── README.md               # Backend API overview
├── services/                   # Independent specialized services
│   ├── README.md               # Service architecture and guidelines
│   └── cv-service/             # Python service for Open3D geometric processing (placeholder)
├── external/                   # Third-party code, vendored libraries, and model files
│   └── README.md               # Third-party code intake and licensing rules
├── docs/                       # Project documentation, specifications, and briefs
│   ├── briefs/                 # Feature & onboarding briefs
│   └── specs/                  # Technical specifications (architecture, auth, restructure)
├── .gitignore                  # Global git ignore configuration
├── IDE_PROMPT.md               # Agentic IDE workflow prompt definitions
├── README.md                   # Repository documentation
└── start-dev.bat               # Windows batch launcher for development servers
```

### Folder Purposes & Overview

- **`frontend/`**: The client-side web application. Interacts exclusively with Supabase Auth for client authentication and with the backend API for data persistence. Never contains backend secrets.
- **`backend/`**: Node.js + Express API service (defined in `docs/specs/backend-architecture-and-user-db-spec.md` and `docs/specs/backend-auth-spec.md`).
- **`services/`**: Standalone services running outside the Node API runtime, such as `cv-service/` for Open3D mesh generation.
- **`external/`**: Cloned repositories, vendored modules, and borrowed third-party code. Strictly separated from our codebase with explicit provenance (`SOURCE.md`) and license tracking.
- **`docs/`**: Architecture specifications, authentication blueprints, and implementation briefs.

### Restructure Decisions & Notes

1. **`scripts/` Location**: The scripts in `scripts/` (`analyze-pixels.mjs`, `clean-transparent-images.mjs`, `inspect-images.mjs`, `process-slide4.mjs`, etc.) process onboarding image assets and illustration transparency specifically for the frontend. They have been relocated to `frontend/scripts/`.
2. **Test Artifacts**: `test_err.txt` and `test_out.txt` were inspected, determined to be empty 0-byte scratch outputs, deleted from tracking, and added to the root `.gitignore` (`test_*.txt`).
3. **Computer Vision & Privacy Note**: In alignment with project privacy requirements, user measurement photos remain strictly on-device. The `services/cv-service/` placeholder is designed to handle landmark, point cloud, or derived mathematical coordinates rather than raw imagery.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ or v24+)
- npm (v10+)

### Quick Start (Windows)

Double-click `start-dev.bat` from the repository root, or run it from the command line:

```bat
start-dev.bat
```

### Manual Development Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
npm run dev
```

Build for production:

```bash
cd frontend
npm run build
```

Run linter:

```bash
cd frontend
npm run lint
```

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

## 🛠️ Frontend Tech Stack & Architecture

- **React 19** + **TypeScript**
- **Vite 8** + **Tailwind CSS v4**
- **Embla Carousel React**
- **Lucide Icons**
- **Components**: shadcn/ui inspired (`Button`, `Carousel`, `Card`, `Badge`)

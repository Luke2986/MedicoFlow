# MedicoFlow - Gestione Ambulatorio Medico

## Overview
MedicoFlow is a comprehensive management system for Italian medical clinics, designed to streamline operations, manage patients, appointments, and medical records. It ensures full compliance with Italian regulations and GDPR, offering features like AI-powered search, interactive scheduling, and advanced AI-driven documentation tools. The project aims to enhance efficiency, improve data management, and support future scalability for medical practices.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The system uses Tailwind CSS and shadcn/ui for a consistent, modern, and medically-themed interface. It features a Blue-600 primary color, 'Inter' typography, a fixed left sidebar for navigation, and a sticky top header. Interactive elements include custom elevation effects and clear empty states. Dark/light mode is fully supported.

### Technical Implementations
The frontend is built with React 18, TypeScript, Wouter for routing, and TanStack Query v5 for data management. The backend uses Express.js with TypeScript, providing a RESTful API. PostgreSQL with Drizzle ORM handles database operations. Key features include full Italian localization, `react-hook-form` with Zod for robust form validation, and modular separation of frontend, backend, and shared schemas.

### Feature Specifications
- **Dashboard**: Displays real-time statistics on patients and appointments.
- **Patient Management**: Full CRUD operations for patient records, including intelligent debounced search with advanced filters (age, sex, city, province), fuzzy search using Fuse.js, and comprehensive Italian fiscal code validation.
- **Appointment Management**: Full CRUD for appointments with an interactive weekly calendar (7 days, 8:00-20:00, 30min slots), server-side conflict detection, and color-coded statuses.
- **Digital Medical Record (Cartella Clinica)**: Structured forms for medical visits including anamnesis, objective examination, diagnosis, therapy, vital parameters, and chronological visit history. Medical alerts and allergies are prominently displayed.
- **AI Voice-to-Clinical-Note**: Integrates Groq (Whisper Large v3) for audio transcription, converting voice recordings into editable text for clinical notes. Features high-quality audio capture and quota-based access.
- **AI-Powered Brand Color Customization**: Allows medical practices to extract brand colors from their website URLs using Groq (llama-3.3-70b-versatile) for dynamic theme generation, ensuring WCAG AA accessibility compliance with automatic text color selection based on contrast.
- **Settings Menu**: Comprehensive settings for clinic data, billing, team management, notifications, and privacy.
- **Subscription & Pricing Tiers**: Implemented with feature flags for BASE, PROFESSIONAL, and ENTERPRISE access levels, including a lead capture system for pricing validation.

### System Design Choices
The architecture is modular, separating frontend (`client/`), backend (`server/`), and shared schemas (`shared/`). PostgreSQL is used for data persistence with Drizzle ORM. APIs are RESTful with Zod validation. TanStack Query handles client-side caching. The system is designed for scalability and future expansion. Robust SSRF protection is implemented for external URL processing.

## External Dependencies
- **React**: Frontend UI library.
- **TypeScript**: For type safety across the application.
- **Wouter**: Lightweight client-side router.
- **Express.js**: Backend web framework.
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: TypeScript ORM for database interaction.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Reusable UI components.
- **TanStack Query v5**: Data fetching and state management.
- **Fuse.js**: Lightweight fuzzy-search library.
- **react-hook-form**: Forms management library.
- **Zod**: Schema declaration and validation.
- **Google Fonts**: For 'Inter' typeface.
- **Groq API**: Used for Whisper Large v3 (audio transcription) and llama-3.3-70b-versatile (AI color extraction).
- **Multer**: Multipart/form-data handling.
- **ipaddr.js**: IP address validation for SSRF protection.

## Recent Updates (October 14, 2025)

### Onboarding System Implementation (Latest - Oct 14, 2025)
- **Feature**: Complete intelligent onboarding wizard for first-time users with auto-progress tracking
- **Implementation**:
  - **Database**: Added `onboarding_progress` table with tracking fields (profileCompleted, firstPatientAdded, firstAppointmentAdded, themeCustomized, onboardingCompleted)
  - **Backend API**: 
    - GET `/api/onboarding`: Auto-updates progress based on real data (patient count, appointment count, theme settings)
    - POST `/api/onboarding`: Manual step completion
    - Logic auto-detects completion: if pazienti count > 0 → firstPatientAdded=TRUE
  - **React Components**:
    - **OnboardingWizard**: 4-step interactive wizard with progress bar (0-100%), dismissible with localStorage persistence
    - **EmptyState**: Reusable component for empty lists with CTA buttons
    - **QuickActions**: Context-aware action suggestions (prioritizes missing steps)
  - **Dashboard Integration**: Wizard appears on first login, auto-updates without reload via TanStack Query invalidation
  - **Cache Fix**: Added `queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] })` after patient/appointment mutations for real-time progress updates
- **Testing**: E2E test passed ✅ - verified wizard display, step completion, auto-progress update (3/4→4/4), dismiss persistence
- **Files Created**: `client/src/components/EmptyState.tsx`, `OnboardingWizard.tsx`, `QuickActions.tsx`
- **Files Modified**: `shared/schema.ts`, `server/routes.ts`, `client/src/pages/dashboard/index.tsx`, `pazienti.tsx`, `appuntamenti.tsx`

### Interactive Plan Switching UI (Oct 14, 2025)
- **Feature**: Added interactive Tabs for plan comparison in billing page
- **Implementation**: 
  - Tabs component (BASE, PROFESSIONAL, ENTERPRISE) for dynamic plan switching
  - Real-time feature updates when switching plans
  - Patient/user limits display (with "Illimitati" for unlimited plans)
  - FEATURE_NAMES integration for readable feature names
- **Routes**: Added `/billing` route alongside `/dashboard/impostazioni/billing`
- **Fix**: Resolved React Hooks ordering issue (moved useState before conditional returns)
- **Testing**: E2E test passed ✅ - verified tab switching, feature updates, limits display
- **Files Modified**: `client/src/pages/dashboard/billing.tsx`, `client/src/App.tsx`

### AI Color Extraction - Groq Model Migration (Oct 14, 2025)
- **Issue**: Groq deprecated `llama-3.1-70b-versatile` model → extraction failing with "model_decommissioned" error
- **Fix #1 - Model Update**: Migrated to `llama-3.3-70b-versatile` (production model, 280 T/sec)
- **Issue**: Token limit exceeded → "Request too large, 15152 tokens requested, limit 12000"  
- **Fix #2 - Token Optimization**: Reduced HTML snippet from 50KB → 30KB (~7.5K tokens, safely under 12K limit)
- **Result**: ✅ Successfully extracts Stripe colors (Primary: #0A2540, Accent: #635bff)
- **Files Modified**: `server/ai/color-extractor.ts`

### Theme Persistence Bug Fix (Oct 14, 2025)
- **Issue**: Custom theme saves to database but doesn't persist after page reload
- **Cause**: `applyPalette()` only updated CSS DOM, not React state
- **Fix**: Created new `applyPalette()` function that calls BOTH:
  - `applyTheme()` - Updates CSS variables in DOM
  - `setPalette()` - Updates React context state
- **Result**: ✅ Themes now persist correctly after reload
- **Files Modified**: `client/src/contexts/ThemeContext.tsx`

### Database Cleanup & Seed Fix (Oct 14, 2025)
- **Issue**: 186 duplicate empty ambulatori in database
- **Cleanup**: Removed duplicates via SQL, kept only 3 with real data
- **Prevention**: Fixed `server/seed.ts` to check `ambulatori.length` (not `pazienti.length`)
- **Result**: Database clean, no future duplicates

### Patient List Enhancement - Pagination, Status Badges & CSV Export (Oct 14, 2025)
- **Feature**: Enhanced patient list with pagination, visual status indicators, and data export capabilities
- **Implementation**:
  - **Backend Pagination**: Route `/api/pazienti` now returns paginated results (20 items/page) with metadata (total, totalPages, page, limit)
  - **Status Calculation**: Server-side logic calculates patient status based on last visit:
    - **Nuovo** (green badge): No visits recorded
    - **Attivo** (default badge): Last visit within 3 months
    - **Recente** (secondary badge): Last visit 3-6 months ago
    - **Inattivo** (outline badge): Last visit over 6 months ago
  - **Age Display**: Calculated age displayed alongside patient info (e.g., "25 anni")
  - **CSV Export**: New route `/api/pazienti/export/csv` generates downloadable CSV with UTF-8 BOM for Excel compatibility
  - **Route Ordering Fix**: Corrected Express route order - specific routes (`/export/csv`, `/codice-fiscale/:cf`) now placed BEFORE parametric route (`/:id`) to prevent route matching conflicts
  - **Frontend UI**: 
    - Pagination controls (Precedente/Successiva buttons) with page indicator
    - Visual status badges using shadcn Badge component
    - Export CSV button in header with download icon
    - Total patient count display
    - Auto page reset when search/filters change
- **Testing**: E2E test passed ✅ - verified pagination (26 patients → 2 pages: 20+6), badge display, CSV download with proper headers
- **Performance Note**: For large datasets, consider optimizing per-patient visit lookups (potential N+1 queries)
- **Files Modified**: `server/routes.ts`, `client/src/pages/dashboard/pazienti.tsx`

### PDF Export for Complete Medical Records (Latest - Oct 14, 2025) ✅ PRODUCTION-READY
- **Feature**: Professional PDF export for **complete patient medical record** (Cartella Clinica) with ALL visits, clinical data, watermark, and digital signature
- **Implementation**:
  - **PDF Component**: Enhanced `CartellaClinicaPDF` using @react-pdf/renderer for full cartella export
    - **Header**: Ambulatorio details (nome, indirizzo, telefono, P.IVA, specializzazione)
    - **Patient Info**: Nome, cognome, codice fiscale, data nascita, **total visits count**
    - **All Visits Chronologically**: Each visit rendered with dedicated section:
      - Date header with 📅 icon
      - Motivo visita, Diagnosi, Anamnesi, Esame Obiettivo
      - Parametri Vitali (peso, altezza, PA, FC, temperatura)
      - Terapia, Prescrizioni, Esami, Note Cliniche
    - **Watermark**: "COPIA CONFORME" rotated 45° with low opacity
    - **Footer**: Doctor signature, generation timestamp, adaptive metadata
      - Shows "Cartella Clinica Completa - X visite" for multiple visits
      - Shows "ID Visita: X" for single visit (safe optional access)
    - **Styling**: Professional blue color scheme (#2563eb) with page breaks between visits
  - **Backend Routes**:
    - `GET /api/pazienti/:id/cartella-pdf` - Generates **complete cartella PDF** with all patient visits
      - Loads patient, ambulatorio, ALL visite (chronologically sorted)
      - Content-Disposition: `CartellaClinica_{Cognome}_{Nome}_{Date}.pdf`
    - `GET /api/visite/:id/pdf` - Single visit PDF (legacy route, maintained for compatibility)
  - **Frontend UI (Responsive Layout)**: 
    - **Button "Esporta PDF Cartella"** in patient header card (next to "+ Nuova Visita")
      - Emerald/green border (`border-emerald-600`) to differentiate from primary action
      - Download icon, data-testid: `button-esporta-cartella-pdf`
      - Responsive: stacks vertically on mobile (`flex-col`), horizontal on desktop (`sm:flex-row`)
      - `shrink-0` and `whitespace-nowrap` for consistent visibility
    - **Removed** individual PDF buttons from visit cards (only Modifica and Elimina remain)
  - **Type Safety**: Strongly typed props with optional `visite?: Visita[]` for multi-visit support
  - **Defensive Programming**: `safeFormatDate()` helper for robust date parsing with fallbacks
- **Architecture**:
  - PDF component supports both single visit (legacy) and multiple visits (new cartella completa)
  - Uses `visiteDaRenderizzare` array to safely iterate over all visits
  - Route ordering: specific routes (`/cartella-pdf`, `/codice-fiscale/:cf`) BEFORE parametric `/:id`
- **Critical Bug Fixes**:
  - ✅ **Footer Null Reference**: Fixed crash when `visita` was null in cartella completa mode - footer now uses `visiteDaRenderizzare` array with optional chaining
  - ✅ **Missing Style**: Added `sectionHeader` style definition (was referenced but undefined)
  - ✅ **Button Visibility**: Fixed responsive layout - buttons now always visible (flex-col on mobile, flex-row on desktop)
  - ✅ **LSP Errors**: All TypeScript errors resolved
  - Fixed `pazienti.find is not a function` - cartella-clinica.tsx now handles paginated API response `{ pazienti: [...], pagination: {...} }`
  - Fixed `React is not defined` - added explicit `import React from 'react'` for server-side PDF rendering
- **Testing**: 
  - ✅ E2E test passed - verified complete cartella PDF (6990 bytes for 3 visite), emerald button styling, download trigger for Marco Bianchi
  - ✅ Architect review passed - production-ready, type-safe, defensive programming verified
  - ✅ No server errors, consistent downloads across multiple requests
- **Files Created**: `client/src/lib/pdf/cartella-pdf.tsx`
- **Files Modified**: `server/routes.ts`, `client/src/pages/dashboard/cartella-clinica.tsx`
- **Dependencies Added**: `@react-pdf/renderer`, `qrcode`, `@types/qrcode`
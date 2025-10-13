# MedicoFlow - Gestionale Ambulatorio Medico

## Overview
MedicoFlow is a modern management system designed for Italian medical clinics. Its primary purpose is to provide comprehensive management of patients, appointments, and medical records, ensuring full compliance with Italian regulations and GDPR. The project aims to streamline clinic operations, improve patient data management, and offer advanced features like AI-powered search and interactive scheduling.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
- **Design System**: Utilizes Tailwind CSS and shadcn/ui components for a consistent, modern, and medically-themed interface.
- **Color Scheme**: Primary color is Blue-600, reflecting a medical aesthetic. Supports full dark/light mode.
- **Typography**: Uses 'Inter' from Google Fonts for clear readability.
- **Layout**: Features a fixed left sidebar (240px wide) for navigation, a sticky top header, and content areas with responsive padding and max-width.
- **Interactive Elements**: Custom elevation effects (hover-elevate, active-elevate-2) for interactive cards and components, along with clear empty states featuring icons and call-to-actions.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, and TanStack Query v5 for data fetching and state management.
- **Backend**: Express.js with TypeScript, exposing a RESTful API.
- **Database**: PostgreSQL managed with Drizzle ORM for type-safe and efficient data interaction.
- **Localization**: Full Italian localization including date formats (dd/mm/yyyy), 24h time, fiscal code validation, and Italian provinces/regions.
- **Form Handling**: `react-hook-form` combined with Zod for robust form validation.

### Feature Specifications
- **Dashboard**: Real-time statistics including total patients, appointments for today/week, and activity rates.
- **Patient Management**: Complete CRUD operations for patient records.
    - **Intelligent Search**: Debounced search with advanced filters (age, sex, city, province) and full-text search.
    - **Fuzzy Search**: Typo-tolerant search using Fuse.js with real-time autocomplete, match highlighting, and keyboard navigation.
    - **Fiscal Code Validation**: Comprehensive Italian fiscal code checksum algorithm and province validation.
    - **Sorting**: Dynamic sorting by last name, birth date, and city with ASC/DESC toggles.
- **Appointment Management**: Comprehensive CRUD for appointments.
    - **Interactive Weekly Calendar**: Grid view (7 days, 8:00-20:00, 30min slots).
    - **Conflict Detection**: Server-side prevention of overlapping appointments.
    - **Color Coding**: Appointments are color-coded by status (confirmed, completed, canceled, no-show).
- **Digital Medical Record (Cartella Clinica)**: Structured form for medical visits including anamnesis, objective examination, diagnosis, therapy, vital parameters, and chronological visit history.
- **AI Voice-to-Clinical-Note**: Groq-powered audio transcription (Whisper Large v3) that converts voice recordings into raw text. The transcribed text appears in a dedicated editable box for verification before manual data entry. Features high-quality audio capture (Opus codec, 44.1kHz, echo cancellation, noise suppression) and quota-based access control with usage tracking per plan (PROFESSIONAL: 150/month, ENTERPRISE: unlimited, BASE: disabled).
- **Settings Menu**: Comprehensive settings with sections for clinic data, billing, team management, notifications, privacy, and support.
- **Subscription & Pricing Tiers**: Implemented with `subscriptions` table and feature flags (`hasFeature`) for different access levels (BASE, PROFESSIONAL, ENTERPRISE). Includes paywall implementation for premium features like AI Agent Search and Voice-to-Clinical-Note.

### System Design Choices
- **Modular Structure**: Clear separation of frontend (`client/`), backend (`server/`), and shared schemas (`shared/`).
- **Data Persistence**: PostgreSQL as the relational database, Drizzle ORM for schema definition and queries.
- **API Design**: RESTful API endpoints with Zod validation for all requests.
- **Caching**: TanStack Query for client-side data caching and cache invalidation.
- **Scalability**: Designed with a layered architecture to facilitate future expansions like multi-clinic management and advanced reporting.

## External Dependencies
- **React**: Frontend UI library.
- **TypeScript**: Superset of JavaScript for type safety.
- **Wouter**: Lightweight client-side router.
- **Express.js**: Backend web application framework.
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: TypeScript ORM for database interaction.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Reusable UI components.
- **TanStack Query v5**: Data fetching and state management library.
- **Fuse.js**: Lightweight fuzzy-search library.
- **react-hook-form**: Forms management library for React.
- **Zod**: TypeScript-first schema declaration and validation library.
- **Google Fonts**: For 'Inter' typeface.
- **Groq API**: Whisper Large v3 for audio transcription.
- **Multer**: Multipart/form-data handling for file uploads.

## Recent Updates (October 13, 2025)

### Medical Alerts & Allergie Management (Latest - October 13, 2025)
- **Allergie Field Integration**: Added `allergie` field (text array) to patients schema for critical medical alerts
  - **Edit Patient Dialog** (`/dashboard/pazienti`): Textarea input with AlertTriangle icon for entering comma-separated allergies
  - **Cartella Clinica** (`/dashboard/cartella-clinica`): Prominent red alert box displays allergies when present, empty state when none recorded
  - **Data Flow**: Frontend converts comma-separated string → array before API submission, backend stores as text[]
- **Schema Validation Improvements**:
  - **Update Schema**: `updatePazienteSchema` uses `.omit()` + `.partial()` + `.extend()` pattern to handle legacy data
  - **Codice Fiscale**: Update validation skips checksum verification (format & length only) to accept existing test data
  - **Telefono**: Backend normalizes by stripping spaces/dashes/parentheses before validation in PATCH route handler
  - **Rationale**: Insert operations maintain strict validation; updates accept legacy formats while preserving data integrity
- **Cartella Clinica Enhanced**:
  - Fixed patient header with demographics (nome, cognome, CF, age calculated from birthdate)
  - Clickable contact links (tel: and mailto:) for immediate communication
  - Medical alert box for allergies with red background and warning icon
  - Expanded visit cards with multi-section preview (Diagnosi highlighted in blue, Terapia, Anamnesi)
  - Italian date formatting with relative time ("2 giorni fa")
  - Edit/Delete actions per visit with confirmation dialogs
- **Clinical Workflow**: Patient list → Edit patient → Add allergies → View cartella clinica → Alert box displays prominently

### Voice Notes Integration in Cartella Clinica (Latest - October 13, 2025)
- **Voice-to-Clinical-Notes Workflow**: Complete integration of AI transcription into clinical documentation
  - **VoiceRecorder in Create Dialog**: Audio capture → Groq transcription → editable textarea → copy to Note Cliniche field
  - **VoiceRecorder in Edit Dialog**: Same workflow available when modifying existing visits for addendum notes
  - **Separate Transcription States**: Independent state management (`transcriptionText` for create, `editTranscriptionText` for edit)
  - **Copy-to-Notes Button**: One-click transfer from transcription textarea to noteCliniche field with toast confirmation (data-testid: button-copy-transcription, button-copy-edit-transcription)
  - **Preview Display**: Note Cliniche section added to visit preview cards with FileText icon, conditional rendering (hidden if empty)
- **Technical Implementation**:
  - Transcription persists through form textarea values (noteCliniche)
  - Dialog close resets transcription state to prevent unintended carryover
  - Submit handlers rely on textarea value for persistence
  - All clinical sections use conditional rendering to hide empty fields
- **User Flow**: Record audio → Review/edit transcription → Copy to Note Cliniche → Fill other fields → Save → Preview shows notes
- **E2E Tested**: Create visit with voice notes → Save → Edit with additional notes → Preview updated successfully

### Smoke Test Pricing System (Lead Capture)
- **Strategy**: Smoke testing pricing before implementing payment system to validate market fit
- **Pricing Model**: Monthly subscription tiers
  - BASE plan: €189/month - Essential features for single practices
  - PROFESSIONAL plan: €249/month - AI features + team collaboration (marked as "Più Popolare")
  - ENTERPRISE plan: €599/month - Unlimited everything + dedicated support
- **Lead Capture System**: Form-based lead generation instead of immediate payment
  - Collects: nome, email (required), ambulatorio, telefono, note
  - Stores leads in `pricing_leads` table with plan selection and status tracking
  - Lead statuses: NUOVO, CONTATTATO, CONVERTITO, PERSO
- **Database Schema**: 
  - Table: `pricing_leads` (id, email, nome, ambulatorio, telefono, piano, note, status, createdAt)
  - Note: `subscriptions` table still contains Stripe fields (nullable) for potential future integration
- **Frontend Pages**: 
  - `/pricing` - Public pricing page with demo request forms
  - `/dashboard/impostazioni/billing` - Billing page with upgrade demo request forms
- **API Endpoints**:
  - `POST /api/pricing-leads` - Create new pricing lead
  - `GET /api/pricing-leads` - Get all leads with statistics (byPlan, byStatus)
  - `PATCH /api/pricing-leads/:id/status` - Update lead status
- **UX Flow**: User clicks "Richiedi Demo Gratuita" → fills form → receives confirmation → sales team follow-up within 24h
- **Future Plans**: After validating pricing, may implement Stripe or alternative payment processor
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
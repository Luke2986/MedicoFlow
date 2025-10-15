# MedicoFlow - Gestione Ambulatorio Medico

## Overview
MedicoFlow is a comprehensive management system for Italian medical clinics, designed to streamline operations, manage patients, appointments, and medical records. It ensures full compliance with Italian regulations and GDPR, offering features like AI-powered search, interactive scheduling, advanced AI-driven documentation, and dynamic theme generation. The project aims to enhance efficiency, improve data management, and support future scalability for medical practices.

## User Preferences
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The system utilizes Tailwind CSS and shadcn/ui for a modern, medically-themed interface with a Blue-600 primary color and 'Inter' typography. It features a fixed left sidebar (Sheet/drawer on mobile), sticky top header, custom elevation effects, clear empty states, and full dark/light mode support. **Mobile-first responsive design** with conditional rendering using `useIsMobile()` hook for optimal UX across all devices.

### Technical Implementations
The frontend is built with React 18, TypeScript, Wouter for routing, and TanStack Query v5 for data management. The backend uses Express.js with TypeScript, providing a RESTful API. PostgreSQL with Drizzle ORM handles database operations. Key features include full Italian localization, `react-hook-form` with Zod for robust form validation, and a modular architecture separating frontend, backend, and shared schemas.

### Feature Specifications
- **Dashboard**: Real-time statistics with responsive typography (`text-2xl sm:text-3xl`) and spacing.
- **Patient Management**: CRUD operations with intelligent debounced search, fuzzy search (Fuse.js), advanced filters, and Italian fiscal code validation. Includes pagination, status indicators, and CSV export. **Mobile-optimized** with conditional button rendering (PDF/Edit only on mobile, all actions on desktop).
- **Appointment Management**: CRUD for appointments with an interactive weekly calendar, server-side conflict detection, and color-coded statuses.
- **Digital Medical Record**: Structured forms for medical visits (anamnesis, objective exam, diagnosis, therapy, vital parameters) with chronological history, medical alerts, and allergies. Supports PDF export of complete medical records with production-ready formatting.
- **AI Voice-to-Clinical-Note**: Integrates Groq (Whisper Large v3) for transcribing voice recordings into editable clinical notes.
- **AI-Powered Brand Color Customization**: Extracts brand colors from website URLs using Groq (llama-3.3-70b-versatile) for dynamic, WCAG AA compliant theme generation.
- **Settings Menu**: Manages clinic data, billing, team, notifications, and privacy.
- **Subscription & Pricing Tiers**: Feature-flagged BASE, PROFESSIONAL, and ENTERPRISE access levels with a lead capture system and interactive plan switching UI.
- **Onboarding System**: Intelligent wizard with auto-progress tracking and context-aware quick actions.
- **Mobile Responsiveness**: Full mobile optimization using `useIsMobile()` hook for conditional rendering, responsive layouts (`flex-col sm:flex-row`), shortened button labels, and mobile-first spacing/typography across all pages.

### System Design Choices
The architecture is modular, separating `client/`, `server/`, and `shared/` components. PostgreSQL with Drizzle ORM provides data persistence. APIs are RESTful with Zod validation. TanStack Query manages client-side caching. The system is designed for scalability, and includes robust SSRF protection.

## External Dependencies
- **React**: Frontend UI library.
- **TypeScript**: For type safety.
- **Wouter**: Client-side router.
- **Express.js**: Backend web framework.
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: TypeScript ORM.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Reusable UI components.
- **TanStack Query v5**: Data fetching and state management.
- **Fuse.js**: Lightweight fuzzy-search library.
- **react-hook-form**: Forms management.
- **Zod**: Schema declaration and validation.
- **Google Fonts**: For 'Inter' typeface.
- **Groq API**: For Whisper Large v3 (audio transcription) and llama-3.3-70b-versatile (AI color extraction).
- **Multer**: Multipart/form-data handling.
- **ipaddr.js**: IP address validation.
- **@react-pdf/renderer**: PDF generation.
- **qrcode**: QR code generation.
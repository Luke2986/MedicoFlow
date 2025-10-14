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
- **AI-Powered Brand Color Customization**: Allows medical practices to extract brand colors from their website URLs using Groq (llama-3.1-70b-versatile) for dynamic theme generation, ensuring WCAG AA accessibility compliance with automatic text color selection based on contrast.
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
- **Groq API**: Used for Whisper Large v3 (audio transcription) and llama-3.1-70b-versatile (AI color extraction).
- **Multer**: Multipart/form-data handling.
- **ipaddr.js**: IP address validation for SSRF protection.
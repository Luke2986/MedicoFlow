# MedicoFlow - Design Guidelines

## Design Approach
**Selected Approach:** Design System (Professional Medical Application)  
**System Foundation:** shadcn/ui with Material Design principles for medical environments  
**Justification:** Medical management applications prioritize clarity, efficiency, trust, and data legibility. A systematic approach ensures consistency across complex workflows while maintaining professional credibility essential for healthcare software.

## Core Design Principles
1. **Clinical Clarity:** Information hierarchy optimized for rapid comprehension of medical data
2. **Professional Trust:** Visual design that conveys reliability and medical professionalism
3. **Efficient Workflows:** Minimize clicks and cognitive load for daily medical tasks
4. **Italian Medical Context:** Localized patterns respecting Italian healthcare conventions

## Color Palette

**Light Mode:**
- Primary: 221 83% 53% (blue-600 base)
- Primary Hover: 221 83% 45%
- Background: 0 0% 100% (white)
- Surface: 214 32% 97% (slate-50)
- Border: 214 32% 91% (slate-200)
- Text Primary: 222 47% 11% (slate-900)
- Text Secondary: 215 16% 47% (slate-600)
- Success: 142 76% 36% (green-600)
- Warning: 38 92% 50% (amber-500)
- Danger: 0 84% 60% (red-500)

**Dark Mode:**
- Primary: 221 83% 53%
- Primary Hover: 221 83% 60%
- Background: 222 47% 11% (slate-900)
- Surface: 217 33% 17% (slate-800)
- Border: 215 28% 25% (slate-700)
- Text Primary: 210 20% 98% (slate-50)
- Text Secondary: 215 20% 65% (slate-400)

## Typography
**Font Family:** Inter (Google Fonts)  
**Scale:**
- Hero/Display: text-4xl (36px) font-bold tracking-tight
- Page Title: text-3xl (30px) font-semibold
- Section Heading: text-2xl (24px) font-semibold
- Card Title: text-lg (18px) font-semibold
- Body: text-base (16px) font-normal
- Small/Meta: text-sm (14px) font-normal
- Table Data: text-sm (14px) font-medium (for readability)

## Layout System
**Spacing Primitives:** Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16 (e.g., p-4, gap-6, mt-8)

**Grid Structure:**
- Sidebar: Fixed 240px width on desktop, collapsible to 64px (icon-only) on tablet, drawer on mobile
- Main Content: max-w-7xl container with px-6 lg:px-8
- Dashboard Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Forms: max-w-2xl for optimal readability
- Tables: Full width with horizontal scroll on mobile

**Responsive Breakpoints:**
- Mobile: < 768px (single column, drawer navigation)
- Tablet: 768px - 1024px (reduced sidebar, 2-column grids)
- Desktop: > 1024px (full sidebar, multi-column layouts)

## Component Library

**Navigation:**
- Sidebar: Fixed left navigation with logo, menu items with icons (lucide-react), active state indicator (blue-600 bg with white text)
- Top Header: Breadcrumbs, user menu, notification bell, search bar (on relevant pages)

**Data Display:**
- Cards: Elevated with shadow-sm, rounded-lg, border border-slate-200, p-6
- Tables: Striped rows (alternate bg-slate-50), sticky headers, hover states, sortable columns
- Stats Cards: Large number display, trend indicators (↑↓ icons), comparison text
- Patient Cards: Avatar/initials, name bold, CF and contact info secondary text

**Forms & Inputs:**
- Input Fields: border-slate-300, focus:ring-2 ring-blue-600, rounded-md, h-10
- Labels: text-sm font-medium text-slate-700, mb-2
- Select/Dropdown: Chevron icon, custom styling matching inputs
- Date Picker: Italian format (gg/mm/aaaa), calendar overlay
- File Upload: Drag-drop zone with dashed border, file type indicators

**Actions:**
- Primary Button: bg-blue-600 text-white, hover:bg-blue-700, rounded-md px-4 py-2
- Secondary Button: border-slate-300 text-slate-700, hover:bg-slate-50
- Ghost Button: text-blue-600, hover:bg-blue-50
- Danger Button: bg-red-600 text-white for delete actions
- Icon Buttons: w-9 h-9, rounded-md, centered icon

**Feedback:**
- Toast Notifications: Top-right, auto-dismiss, color-coded (success: green, error: red, info: blue)
- Loading States: Skeleton screens for tables/cards, spinner for buttons
- Empty States: Centered icon, heading, description, CTA button
- Validation: Inline error messages below fields, red border on error inputs

**Medical-Specific Components:**
- Appointment Calendar: Week/day view, color-coded by status, drag-to-reschedule
- Patient Timeline: Vertical timeline with visit history, documents, notes
- Medical Form Templates: Pre-structured fields for anamnesi, diagnosi, terapia
- Quick Actions: Floating action button for "Nuovo Appuntamento" on relevant pages

## Visual Hierarchy
- Use white space generously (min spacing between sections: py-8)
- Status indicators: Colored badges (green: confermato, amber: in attesa, red: cancellato)
- Critical info: Highlighted with bg-blue-50 border-l-4 border-blue-600
- Dividers: border-slate-200 to separate sections clearly

## Animations
**Minimal & Purposeful:**
- Sidebar collapse: transition-all duration-200
- Card hover: scale-[1.01] subtle lift
- Modal/Dialog: Fade in with scale-95 to scale-100
- No loading animations on data tables (use skeleton instead)

## Italian Localization
- Date format: gg/mm/aaaa (e.g., 25/01/2024)
- Time: 24-hour format (14:30)
- All labels, buttons, messages in Italian
- Phone format: +39 or Italian mobile format
- Codice Fiscale validation and formatting
- Region/Province dropdowns with Italian data

## Accessibility
- WCAG AA compliance minimum
- All form inputs with proper labels and aria-labels
- Keyboard navigation for all interactive elements
- Focus indicators visible (ring-2 ring-blue-600)
- Color contrast ratio 4.5:1 minimum for text
- Screen reader announcements for dynamic content updates

## Images
**Hero Section (Homepage):**
- Clean, professional medical imagery: Modern ambulatory interior or doctor-patient interaction
- Image overlay: bg-gradient-to-r from-blue-900/90 to-blue-700/80 for text legibility
- Placement: Full-width hero with centered content overlaid

**Dashboard:**
- No hero images needed
- Optional: Small illustration/icon in empty states
- Avatar placeholders: Initials in colored circles for users/patients
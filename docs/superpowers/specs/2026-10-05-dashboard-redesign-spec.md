# Source.io Dashboard Redesign Specification

**Date:** 2026-10-05  
**Topic:** Aligning Tactile Dashboard with Real Source.io Study Features

---

## 1. Context & Problem Statement

The Source.io dashboard currently implements a tactile, pill-based aesthetic inspired by modern study platforms. However, several elements represent generic placeholders that conflict with Source.io's actual data model and study workflows:
1. **Placeholder Cards:** "Select a course", "Homework", and "Friends Score" refer to school/course concepts rather than Source.io's multimodal source ingestion and AI synthesis.
2. **Disconnected Dashboard Pills:** Top navigation pills ("Flashcards", "Quizzes") render isolated mock components when no document is open, whereas in Source.io, study lenses belong strictly to specific ingested documents.
3. **Left Dock Clutter:** Placeholder dock items ("Speaking", "Schedule", "Courses", "Messages") do not map to real system routes.

## 2. Agreed Architectural Decisions (from `/grill-me` Review)

1. **Dashboard Layout (2-Section Hierarchy):**
   - **Top Section (Two columns):**
     - **Performance & Retention Chart:** Smooth cubic Bézier retention curve tracking Flashcards Mastery, Quiz Accuracy, and Study Activity across Weekly/Monthly timeframes.
     - **Weekly Goals Progress:** Target hours studied, target documents completed, and weekly retention target with interactive progress completion toggles.
   - **Bottom Section (Full Width):**
     - **Study Sources Grid:** Real documents from Supabase (`documents` table) with title search, format filters (`All Formats`, `PDF`, `AUDIO`, `YOUTUBE`, `TEXT`), document reading time & status badges, and working `+ Upload` button opening `UploadDialog`. Clicking any document routes to `/app/doc/[docId]`.
2. **Left Capsule Dock:**
   - Streamlined strictly to:
     - **Dashboard** (`/app`) — Overview mode
     - **Library** (Folder icon) — Toggles full-screen Study Sources grid view
     - **Settings** (`/app/settings`)
     - **Theme Toggle** (Sun/Moon)
     - **Expand/Collapse Arrow**
3. **Top Bar Contextual Separation:**
   - **On Dashboard (`/app`):** Minimal top bar containing only Global Search, Notifications bell, and User Avatar / Profile Menu. No disconnected center lens pills.
   - **On Document Workspace (`/app/doc/[docId]`):** The top bar dynamically houses the **5 Study Lenses** floating pills:
     - `Notes` (Cornell notes with KaTeX & sentence-level citations)
     - `Flashcards (N)` (Leitner spaced repetition deck)
     - `Quiz` (Adaptive assessment with score tracking in `quiz_attempts`)
     - `Podcast 🎧` (2-host Socratic audio recap player)
     - `Ask AI` (Slide-over citations copilot)

## 3. Data Model & Schema Integration

- **Documents:** `supabase.from("documents").select("id, title, source_type, status, error_code, created_at")`
- **Quizzes & Attempts:** `supabase.from("quiz_attempts").select("id, quiz_id, score, total, created_at")`
- **Flashcards:** `supabase.from("flashcards").select("id, document_id, front, back, order_index")`
- **Goals & Retention:** Saved in `localStorage` for responsive client state, synced to active study sessions.

## 4. Component Architecture & File Plan

- `src/features/dashboard/components/TactileTopBar.tsx`: Strip center pills when in dashboard mode; retain search, notifications, profile.
- `src/features/dashboard/components/TactileLeftDock.tsx`: Remove "Speaking", "Schedule", "Courses", "Messages". Maintain Dashboard, Library (full-screen toggle), Settings.
- `src/features/dashboard/components/TactileDashboard.tsx`: Restructure grid into 2 sections (Top: Chart + Goals; Bottom: Full Sources Grid). Remove "Homework" and fake "Friends Score".
- `src/features/dashboard/components/TactileWeeklyGoals.tsx`: New component replacing DailyGoals/Homework with weekly study targets (hours, documents, retention).
- `src/features/dashboard/components/TactileSourceCards.tsx`: Expand to full-width card with responsive grid, format filters, and direct `UploadDialog` wiring.
- `src/features/documents/pages/DocumentWorkspace.tsx`: Enhance document header to display tactile lens switcher pills matching the design system.

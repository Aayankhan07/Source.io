# Implementation Plan: Redesign & Full Functionality for Flashcards and Quiz Features

Upgrade the barebones Flashcards deck and Quiz player into high-craft, interactive learning experiences matching the charcoal grey zinc theme (`#18181B` / `#121214`), complete with 3D card flips, spaced-repetition mastery grading, stepped quiz flow with instant feedback, score review screen, and seamless handling for both Demo and real documents.

---

## 1. User Experience & Architecture

### A. Flashcards: Interactive 3D Runner (`FlashcardsDeck.tsx`)
- **Large Central Card:**
  - True 3D perspective flip (`transform-style: preserve-3d`, `rotateY(180deg)`) on click or <kbd>Space</kbd>.
  - Front: Concept prompt / question with tactile badge (e.g., `Card 1 of 8`), clean font-display typography, and KaTeX math support.
  - Back: Clear, formatted answer with proof steps or key definitions.
- **Review Controls:**
  - Spaced Repetition Buttons:
    - 🔴 **Hard / Again** (<kbd>1</kbd>): Keep in current review cycle.
    - 🟡 **Good** (<kbd>2</kbd>): Advance card.
    - 🟢 **Easy / Mastered** (<kbd>3</kbd>): Mark as mastered.
  - Prev / Next navigation arrows (<kbd>←</kbd> / <kbd>→</kbd>).
  - Shuffle and Flip toggle buttons.
- **Deck Mastery Progress Bar:**
  - Real-time progress bar tracking cards reviewed vs. mastered.
  - Completion celebration modal with "Review Again" or "Study Only Difficult Cards".
- **List / Grid Drawer:**
  - Collapsible drawer to view all cards in the deck at a glance.

### B. Quiz: Stepped Interactive Exam Mode (`QuizPlayer.tsx`)
- **Question Stage:**
  - Stepped navigation (e.g. `Question 3 of 10`) with top progress indicator.
  - Question title with formatted markdown/math and multiple-choice options (`A`, `B`, `C`, `D`).
- **Instant Pedagogical Feedback:**
  - Selecting an answer immediately reveals:
    - ✅ **Emerald border & glow** on the correct answer.
    - ❌ **Rose border & shake** if an incorrect option was picked.
    - 💡 **Diagnostic Explanation card** explaining *why* the answer is correct and citing lecture notes.
- **Completion & Score Summary:**
  - Visual Score Badge (e.g. `8/10 — 80% Mastery`).
  - Breakdown of missed questions with quick-review accordion.
  - "Retake Quiz" and "Regenerate Questions" buttons.

### C. Live & Demo Document Integration
- Works seamlessly on both real Supabase documents and demo documents (`demo-quantum`, `demo-linalg`).
- In demo mode, clicking **"Generate Flashcards"** or **"Generate Quiz"** creates realistic, high-quality domain content immediately.
- For real documents, triggers `generateDerivatives` edge function with loading state and query invalidation.

---

## 2. Proposed Changes & Components

### Component 1: `src/features/documents/components/FlashcardsDeck.tsx`
- Dedicated component replacing the 40-line placeholder in `DocumentWorkspace.tsx`.
- State management for `currentIndex`, `isFlipped`, `masteredIds`, `cardQueue`, and keyboard listeners.

### Component 2: `src/features/documents/components/QuizPlayer.tsx`
- Dedicated component replacing the placeholder in `DocumentWorkspace.tsx`.
- State management for `currentQuestionIndex`, `selectedOption`, `isAnswered`, `score`, and answer history.

### Component 3: Integration in `src/features/documents/pages/DocumentWorkspace.tsx`
- Import new modular `FlashcardsDeck` and `QuizPlayer`.
- Update `runDerivatives` handler to support demo mock synthesis fallback so demo users never encounter errors.

### Component 4: Design & Tokens in `app/globals.css`
- Add 3D perspective flip utilities:
  ```css
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  ```

---

## 3. Verification & Completion Status
- [x] **Type Safety & Build:** `next build` executed with exit code 0 and 0 TypeScript errors.
- [x] **Component 1 (`FlashcardsDeck.tsx`):**
  - Interactive 3D flip card runner (`perspective-1000`, `transform-style-3d`, `rotate-y-180`, `backface-hidden`).
  - Spaced repetition tracking ("Again" 🔴, "Mastered" 🟢) with keyboard shortcuts (<kbd>Space</kbd>, <kbd>←</kbd>, <kbd>→</kbd>, <kbd>1</kbd>, <kbd>2</kbd>).
  - Deck progress indicator, shuffle deck action, card grid drawer mode, and completion celebration screen with difficult-card review.
- [x] **Component 2 (`QuizPlayer.tsx`):**
  - Stepped question exam runner with animated question progress bar.
  - Instant tactile feedback upon option selection (emerald correct border/glow, rose wrong option feedback).
  - Diagnostic explanation drawer citing textbook / lecture notes.
  - Comprehensive results scoreboard with percentage grade, mastery tier, breakdown accordions, and "Retake Quiz" flow.
- [x] **Component 3 (`DocumentWorkspace.tsx`):**
  - Wired into derivatives tabs (`cards` and `quiz`).
  - Instant demo synthesis fallback for demo documents (`demo-quantum`, `demo-linalg`) so users can test immediately.
- [x] **Component 4 (`app/globals.css`):**
  - 3D perspective flip CSS utility classes registered and fully compiled.


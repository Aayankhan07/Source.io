-- Migration: 20261017120000_role_customization_schema.sql
-- Description: Adds user_role, onboarding_completed, and workspace_preferences JSONB to public.profiles

DO $$ 
BEGIN
  -- 1. Create User Academic Role Enum Type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_academic_role') THEN
    CREATE TYPE public.user_academic_role AS ENUM (
      'school_student',
      'high_school',
      'undergrad',
      'scholar',
      'researcher',
      'teacher',
      'custom'
    );
  END IF;
END $$;

-- 2. Upgrade public.profiles table with role, onboarding flag, and JSONB preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_role public.user_academic_role DEFAULT 'undergrad',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS workspace_preferences JSONB NOT NULL DEFAULT '{
    "enabledModes": ["notes", "flashcards", "quiz", "podcast", "ask"],
    "defaultMode": "notes",
    "noteFormat": "executive_proofs",
    "noteSections": {
      "executiveOverview": true,
      "mathProofs": true,
      "contrastTables": true,
      "misconceptions": true,
      "analogies": false,
      "discussionPrompts": false,
      "actionItems": false
    },
    "rigorLevel": 3,
    "citationStyle": "coordinate_pills",
    "quizStyle": "diagnostic_mcq",
    "flashcardAlgorithm": "leitner_5_box",
    "podcastStyle": "socratic_debate",
    "customSystemInstruction": ""
  }'::jsonb;

-- 3. Create GIN index for rapid JSONB query filtering on preferences
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_preferences 
ON public.profiles USING gin (workspace_preferences);

-- 4. Enable RLS policy allowing authenticated users to update their own profile and preferences
DROP POLICY IF EXISTS "Users can update their own profile and preferences" ON public.profiles;
CREATE POLICY "Users can update their own profile and preferences"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GeneralSettings,
  NotesViewSettings,
  SettingsContextType,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_NOTES_SETTINGS,
} from "../types";
import { UserRole, WorkspacePreferences, ROLE_PRESETS } from "@/types/customization";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

const GENERAL_SETTINGS_STORAGE_KEY = "source_io_general_settings_v1";
const NOTES_SETTINGS_STORAGE_KEY = "source_io_notes_settings_v1";
const ROLE_STORAGE_KEY = "source_io_user_role_v1";
const PREFERENCES_STORAGE_KEY = "source_io_workspace_preferences_v1";
const ONBOARDING_COMPLETED_KEY = "source_io_onboarding_completed_v1";

const DEFAULT_ROLE: UserRole = "undergrad";
const DEFAULT_PREFERENCES: WorkspacePreferences = ROLE_PRESETS.undergrad;

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadFromStorage<T>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (err) {
    console.warn(`[Settings] Failed to load ${key} from localStorage:`, err);
    return defaults;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[Settings] Failed to save ${key} to localStorage:`, err);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [notesSettings, setNotesSettings] = useState<NotesViewSettings>(DEFAULT_NOTES_SETTINGS);
  const [userRole, setUserRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [preferences, setPreferencesState] = useState<WorkspacePreferences>(DEFAULT_PREFERENCES);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage and sync with Supabase profiles
  useEffect(() => {
    const initialGeneral = loadFromStorage(GENERAL_SETTINGS_STORAGE_KEY, DEFAULT_GENERAL_SETTINGS);
    const initialNotes = loadFromStorage(NOTES_SETTINGS_STORAGE_KEY, DEFAULT_NOTES_SETTINGS);
    const initialRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRole) || DEFAULT_ROLE;
    const initialPreferences = loadFromStorage(
      PREFERENCES_STORAGE_KEY,
      ROLE_PRESETS[initialRole] || DEFAULT_PREFERENCES
    );
    const initialOnboarding = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";

    setSettings(initialGeneral);
    setNotesSettings(initialNotes);
    setUserRoleState(initialRole);
    setPreferencesState(initialPreferences);
    setOnboardingCompleted(initialOnboarding);
    setIsLoaded(true);

    // Sync from Supabase if logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        supabase
          .from("profiles")
          .select("user_role, onboarding_completed, workspace_preferences")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error && data) {
              const remoteRole = (data.user_role as UserRole) || initialRole;
              const remoteOnboarding = data.onboarding_completed ?? initialOnboarding;
              const remotePrefs = (data.workspace_preferences as unknown as WorkspacePreferences) || initialPreferences;

              setUserRoleState(remoteRole);
              setOnboardingCompleted(remoteOnboarding);
              setPreferencesState({ ...ROLE_PRESETS[remoteRole], ...remotePrefs });

              try {
                localStorage.setItem(ROLE_STORAGE_KEY, remoteRole);
                localStorage.setItem(ONBOARDING_COMPLETED_KEY, String(remoteOnboarding));
                saveToStorage(PREFERENCES_STORAGE_KEY, remotePrefs);
              } catch {
                // ignore
              }
            }
          });
      }
    });
  }, []);

  // Synchronize dynamic accent tint to HTML root
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-accent", settings.accentColor || "slate");
  }, [settings.accentColor]);

  const updateSettings = useCallback((partial: Partial<GeneralSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(GENERAL_SETTINGS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const updateNotesSettings = useCallback((partial: Partial<NotesViewSettings>) => {
    setNotesSettings((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(NOTES_SETTINGS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_GENERAL_SETTINGS);
    setNotesSettings(DEFAULT_NOTES_SETTINGS);
    saveToStorage(GENERAL_SETTINGS_STORAGE_KEY, DEFAULT_GENERAL_SETTINGS);
    saveToStorage(NOTES_SETTINGS_STORAGE_KEY, DEFAULT_NOTES_SETTINGS);
  }, []);

  // Update role and apply corresponding preset defaults
  const setUserRole = useCallback(async (role: UserRole) => {
    setUserRoleState(role);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // ignore
    }

    const newPreset = ROLE_PRESETS[role] || DEFAULT_PREFERENCES;
    setPreferencesState(newPreset);
    saveToStorage(PREFERENCES_STORAGE_KEY, newPreset);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      void supabase
        .from("profiles")
        .update({
          user_role: role,
          workspace_preferences: newPreset as unknown as Json,
        })
        .eq("id", session.user.id);
    }
  }, []);

  // Update individual customization preferences
  const updatePreferences = useCallback(async (partial: Partial<WorkspacePreferences>) => {
    let nextPrefs: WorkspacePreferences = DEFAULT_PREFERENCES;
    setPreferencesState((prev) => {
      nextPrefs = {
        ...prev,
        ...partial,
        noteSections: {
          ...prev.noteSections,
          ...(partial.noteSections || {}),
        },
      };
      saveToStorage(PREFERENCES_STORAGE_KEY, nextPrefs);
      return nextPrefs;
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      void supabase
        .from("profiles")
        .update({ workspace_preferences: nextPrefs as unknown as Json })
        .eq("id", session.user.id);
    }
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(
    async (role: UserRole, customPrefs?: Partial<WorkspacePreferences>) => {
      setUserRoleState(role);
      setOnboardingCompleted(true);

      const basePreset = ROLE_PRESETS[role] || DEFAULT_PREFERENCES;
      const mergedPrefs: WorkspacePreferences = {
        ...basePreset,
        ...customPrefs,
        noteSections: {
          ...basePreset.noteSections,
          ...(customPrefs?.noteSections || {}),
        },
      };

      setPreferencesState(mergedPrefs);

      try {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
        saveToStorage(PREFERENCES_STORAGE_KEY, mergedPrefs);
      } catch {
        // ignore
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from("profiles")
          .update({
            user_role: role,
            onboarding_completed: true,
            workspace_preferences: mergedPrefs as unknown as Json,
          })
          .eq("id", session.user.id);
      }
    },
    []
  );

  // Reset strictly to the selected role's presets
  const resetToRolePreset = useCallback(async (role: UserRole) => {
    const preset = ROLE_PRESETS[role] || DEFAULT_PREFERENCES;
    setUserRoleState(role);
    setPreferencesState(preset);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      saveToStorage(PREFERENCES_STORAGE_KEY, preset);
    } catch {
      // ignore
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      void supabase
        .from("profiles")
        .update({
          user_role: role,
          workspace_preferences: preset as unknown as Json,
        })
        .eq("id", session.user.id);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        notesSettings,
        updateNotesSettings,
        resetSettings,
        userRole,
        preferences,
        onboardingCompleted,
        setUserRole,
        updatePreferences,
        completeOnboarding,
        resetToRolePreset,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

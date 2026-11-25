"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
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

/**
 * Settings are stored per user: every localStorage key is suffixed with the
 * signed-in user's id so two accounts on one browser never see each other's
 * preferences or onboarding state. BYOK API keys are NOT stored here: they live
 * encrypted on the server (see src/lib/services/apiKeys.ts and useStoredApiKeys).
 */
const GENERAL_SETTINGS_STORAGE_KEY = "source_io_general_settings_v1";
const NOTES_SETTINGS_STORAGE_KEY = "source_io_notes_settings_v1";
const ROLE_STORAGE_KEY = "source_io_user_role_v1";
const PREFERENCES_STORAGE_KEY = "source_io_workspace_preferences_v1";
const ONBOARDING_COMPLETED_KEY = "source_io_onboarding_completed_v1";
/** Old per-user localStorage BYOK keys (pre server-side storage). Deleted on load, never read. */
const LEGACY_API_KEYS_STORAGE_KEY = "source_io_api_keys_v1";

/** Pre-namespacing global keys. They were shared by every account on the browser and are removed, not migrated. */
const LEGACY_GLOBAL_KEYS = [
  GENERAL_SETTINGS_STORAGE_KEY,
  NOTES_SETTINGS_STORAGE_KEY,
  ROLE_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  ONBOARDING_COMPLETED_KEY,
  "source_io_guest_session",
  LEGACY_API_KEYS_STORAGE_KEY,
  // Client-side provider rate-limit probe cache (removed with server-side BYOK).
  "source_io_provider_quota_cache_v1",
];

const DEFAULT_ROLE: UserRole = "undergrad";
const DEFAULT_PREFERENCES: WorkspacePreferences = ROLE_PRESETS.undergrad;

const SettingsContext = createContext<SettingsContextType | null>(null);

function userKey(base: string, userId: string): string {
  return `${base}:${userId}`;
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.error(`[Settings] Failed to save ${key} to localStorage:`, err);
  }
}

function removeRaw(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function loadFromStorage<T>(key: string, defaults: T): T {
  const raw = readRaw(key);
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch (err) {
    console.warn(`[Settings] Failed to parse ${key} from localStorage:`, err);
    return defaults;
  }
}

function saveToStorage<T>(key: string, data: T) {
  writeRaw(key, JSON.stringify(data));
}

/**
 * Removes API keys a previous version kept in localStorage for this user. Keys are now
 * stored server-side, so a raw key must never be left in the browser.
 */
export function clearLegacyStoredApiKeys(userId: string) {
  removeRaw(userKey(LEGACY_API_KEYS_STORAGE_KEY, userId));
}

/** Removes the pre-namespacing global settings keys (and any legacy API keys stored inside them). */
export function clearLegacySettingsStorage() {
  LEGACY_GLOBAL_KEYS.forEach(removeRaw);
}

/** Drops fields that older versions persisted but that no longer belong in settings (e.g. apiKeys). */
function sanitizeGeneral(raw: GeneralSettings & { apiKeys?: unknown }): GeneralSettings {
  const { apiKeys: _legacyKeys, ...rest } = raw;
  void _legacyKeys;
  return rest;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [notesSettings, setNotesSettings] = useState<NotesViewSettings>(DEFAULT_NOTES_SETTINGS);
  const [userRole, setUserRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [preferences, setPreferencesState] = useState<WorkspacePreferences>(DEFAULT_PREFERENCES);
  /** undefined = not known yet (auth or profile still loading). */
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | undefined>(undefined);
  /** undefined = auth state not known yet, null = signed out. */
  const [settingsUserId, setSettingsUserId] = useState<string | null | undefined>(undefined);
  const userIdRef = useRef<string | null | undefined>(undefined);

  const resetInMemory = useCallback(() => {
    setSettings(DEFAULT_GENERAL_SETTINGS);
    setNotesSettings(DEFAULT_NOTES_SETTINGS);
    setUserRoleState(DEFAULT_ROLE);
    setPreferencesState(DEFAULT_PREFERENCES);
    setOnboardingCompleted(undefined);
  }, []);

  // Track the signed-in user. Re-runs the load + profile sync whenever the account changes.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSettingsUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    userIdRef.current = settingsUserId;
    if (settingsUserId === undefined) return;

    clearLegacySettingsStorage();
    resetInMemory();
    if (settingsUserId === null) return;

    const uid = settingsUserId;
    clearLegacyStoredApiKeys(uid);
    let cancelled = false;

    const storedGeneral = loadFromStorage(userKey(GENERAL_SETTINGS_STORAGE_KEY, uid), DEFAULT_GENERAL_SETTINGS);
    const initialGeneral = sanitizeGeneral(storedGeneral);
    if ("apiKeys" in storedGeneral) saveToStorage(userKey(GENERAL_SETTINGS_STORAGE_KEY, uid), initialGeneral);
    const initialNotes = loadFromStorage(userKey(NOTES_SETTINGS_STORAGE_KEY, uid), DEFAULT_NOTES_SETTINGS);
    const initialRole = (readRaw(userKey(ROLE_STORAGE_KEY, uid)) as UserRole | null) || DEFAULT_ROLE;
    const initialPreferences = loadFromStorage(
      userKey(PREFERENCES_STORAGE_KEY, uid),
      ROLE_PRESETS[initialRole] || DEFAULT_PREFERENCES,
    );
    const cachedOnboarding = readRaw(userKey(ONBOARDING_COMPLETED_KEY, uid));

    setSettings(initialGeneral);
    setNotesSettings(initialNotes);
    setUserRoleState(initialRole);
    setPreferencesState(initialPreferences);
    // A cached "true" lets returning users skip the wait; anything else waits for the profile.
    setOnboardingCompleted(cachedOnboarding === "true" ? true : undefined);

    supabase
      .from("profiles")
      .select("user_role, onboarding_completed, workspace_preferences")
      .eq("user_id", uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Don't trap the user in onboarding because of a transient read failure.
          setOnboardingCompleted(cachedOnboarding === "false" ? false : true);
          return;
        }
        if (!data) {
          setOnboardingCompleted(false);
          return;
        }
        const remoteRole = (data.user_role as UserRole) || initialRole;
        const remoteOnboarding = data.onboarding_completed ?? false;
        const remotePrefs = (data.workspace_preferences as unknown as WorkspacePreferences) || initialPreferences;

        setUserRoleState(remoteRole);
        setOnboardingCompleted(remoteOnboarding);
        setPreferencesState({ ...ROLE_PRESETS[remoteRole], ...remotePrefs });

        writeRaw(userKey(ROLE_STORAGE_KEY, uid), remoteRole);
        writeRaw(userKey(ONBOARDING_COMPLETED_KEY, uid), String(remoteOnboarding));
        saveToStorage(userKey(PREFERENCES_STORAGE_KEY, uid), remotePrefs);
      });

    return () => {
      cancelled = true;
    };
  }, [settingsUserId, resetInMemory]);

  // Synchronize dynamic accent tint to HTML root
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-accent", settings.accentColor || "slate");
  }, [settings.accentColor]);

  /** Called by AuthContext.signOut: drops in-memory state, any legacy stored API keys and legacy global keys. */
  const clearForSignOut = useCallback(() => {
    const uid = userIdRef.current;
    if (uid) clearLegacyStoredApiKeys(uid);
    clearLegacySettingsStorage();
    userIdRef.current = null;
    setSettingsUserId(null);
    resetInMemory();
  }, [resetInMemory]);

  const updateSettings = useCallback((partial: Partial<GeneralSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      const uid = userIdRef.current;
      if (uid) {
        saveToStorage(userKey(GENERAL_SETTINGS_STORAGE_KEY, uid), next);
      }
      return next;
    });
  }, []);

  const updateNotesSettings = useCallback((partial: Partial<NotesViewSettings>) => {
    setNotesSettings((prev) => {
      const next = { ...prev, ...partial };
      const uid = userIdRef.current;
      if (uid) saveToStorage(userKey(NOTES_SETTINGS_STORAGE_KEY, uid), next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_GENERAL_SETTINGS);
    setNotesSettings(DEFAULT_NOTES_SETTINGS);
    const uid = userIdRef.current;
    if (uid) {
      saveToStorage(userKey(GENERAL_SETTINGS_STORAGE_KEY, uid), DEFAULT_GENERAL_SETTINGS);
      saveToStorage(userKey(NOTES_SETTINGS_STORAGE_KEY, uid), DEFAULT_NOTES_SETTINGS);
    }
  }, []);

  // Update role and apply corresponding preset defaults
  const setUserRole = useCallback(async (role: UserRole) => {
    setUserRoleState(role);
    const newPreset = ROLE_PRESETS[role] || DEFAULT_PREFERENCES;
    setPreferencesState(newPreset);

    const uid = userIdRef.current;
    if (!uid) return;
    writeRaw(userKey(ROLE_STORAGE_KEY, uid), role);
    saveToStorage(userKey(PREFERENCES_STORAGE_KEY, uid), newPreset);
    void supabase
      .from("profiles")
      .update({
        user_role: role,
        workspace_preferences: newPreset as unknown as Json,
      })
      .eq("user_id", uid);
  }, []);

  // Update individual customization preferences
  const updatePreferences = useCallback(async (partial: Partial<WorkspacePreferences>) => {
    let nextPrefs: WorkspacePreferences = DEFAULT_PREFERENCES;
    const uid = userIdRef.current;
    setPreferencesState((prev) => {
      nextPrefs = {
        ...prev,
        ...partial,
        noteSections: {
          ...prev.noteSections,
          ...(partial.noteSections || {}),
        },
      };
      if (uid) saveToStorage(userKey(PREFERENCES_STORAGE_KEY, uid), nextPrefs);
      return nextPrefs;
    });

    if (uid) {
      void supabase
        .from("profiles")
        .update({ workspace_preferences: nextPrefs as unknown as Json })
        .eq("user_id", uid);
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

      const uid = userIdRef.current;
      if (!uid) return;
      writeRaw(userKey(ROLE_STORAGE_KEY, uid), role);
      writeRaw(userKey(ONBOARDING_COMPLETED_KEY, uid), "true");
      saveToStorage(userKey(PREFERENCES_STORAGE_KEY, uid), mergedPrefs);

      await supabase
        .from("profiles")
        .update({
          user_role: role,
          onboarding_completed: true,
          workspace_preferences: mergedPrefs as unknown as Json,
        })
        .eq("user_id", uid);
    },
    []
  );

  // Reset strictly to the selected role's presets
  const resetToRolePreset = useCallback(async (role: UserRole) => {
    const preset = ROLE_PRESETS[role] || DEFAULT_PREFERENCES;
    setUserRoleState(role);
    setPreferencesState(preset);

    const uid = userIdRef.current;
    if (!uid) return;
    writeRaw(userKey(ROLE_STORAGE_KEY, uid), role);
    saveToStorage(userKey(PREFERENCES_STORAGE_KEY, uid), preset);
    void supabase
      .from("profiles")
      .update({
        user_role: role,
        workspace_preferences: preset as unknown as Json,
      })
      .eq("user_id", uid);
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
        settingsUserId,
        clearForSignOut,
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

/** Like useSettings, but returns null outside a SettingsProvider (used by AuthProvider). */
export function useOptionalSettings(): SettingsContextType | null {
  return useContext(SettingsContext);
}

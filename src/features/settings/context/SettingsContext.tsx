"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GeneralSettings,
  NotesViewSettings,
  SettingsContextType,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_NOTES_SETTINGS,
} from "../types";

const GENERAL_SETTINGS_STORAGE_KEY = "source_io_general_settings_v1";
const NOTES_SETTINGS_STORAGE_KEY = "source_io_notes_settings_v1";

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage on client mount
  useEffect(() => {
    const initialGeneral = loadFromStorage(GENERAL_SETTINGS_STORAGE_KEY, DEFAULT_GENERAL_SETTINGS);
    const initialNotes = loadFromStorage(NOTES_SETTINGS_STORAGE_KEY, DEFAULT_NOTES_SETTINGS);
    setSettings(initialGeneral);
    setNotesSettings(initialNotes);
    setIsLoaded(true);
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

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        notesSettings,
        updateNotesSettings,
        resetSettings,
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics/track";

const PREF_KEY = "source_io_due_reminder_enabled_v1";
const LAST_KEY = "source_io_due_reminder_last_day_v1";
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

type PermissionState = NotificationPermission | "unsupported";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the reminder simply is not remembered
  }
}

function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function currentPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Opt-in browser reminder for due flashcards.
 *
 * In-tab only: uses the Notifications API while this tab is open (no service
 * worker, no push). Nothing is requested until the user clicks `enable()`.
 * At most one reminder per local day, and only while the tab is in the
 * background, so it never interrupts someone who is already looking at it.
 */
export function useBrowserDueReminder(dueCount: number) {
  const [permission, setPermission] = useState<PermissionState>(() => currentPermission());
  const [enabled, setEnabled] = useState<boolean>(() =>
    typeof window === "undefined" ? false : readStorage(PREF_KEY) === "1",
  );

  const enable = useCallback(async () => {
    if (currentPermission() === "unsupported") return false;
    let result = Notification.permission;
    if (result === "default") {
      try {
        result = await Notification.requestPermission();
      } catch {
        result = Notification.permission;
      }
    }
    setPermission(result);
    const ok = result === "granted";
    if (ok) track("browser_reminder_enabled");
    writeStorage(PREF_KEY, ok ? "1" : null);
    setEnabled(ok);
    return ok;
  }, []);

  const disable = useCallback(() => {
    writeStorage(PREF_KEY, null);
    setEnabled(false);
  }, []);

  const active = enabled && permission === "granted";

  useEffect(() => {
    if (!active || dueCount <= 0) return;
    const maybeNotify = () => {
      if (document.visibilityState !== "hidden") return;
      const day = todayKey();
      if (readStorage(LAST_KEY) === day) return;
      try {
        const n = new Notification("Flashcards due today", {
          body: `${dueCount} card${dueCount === 1 ? " is" : "s are"} ready for review.`,
          tag: "source-io-due-reminder",
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
        writeStorage(LAST_KEY, day);
      } catch {
        // Some browsers (e.g. Android Chrome) only allow notifications from a service worker.
      }
    };
    document.addEventListener("visibilitychange", maybeNotify);
    const timer = window.setInterval(maybeNotify, CHECK_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", maybeNotify);
      window.clearInterval(timer);
    };
  }, [active, dueCount]);

  return { supported: permission !== "unsupported", permission, active, enable, disable };
}

import { useCallback, useSyncExternalStore } from "react";

/** Width at which the notes view switches to the three-pane desktop layout (Tailwind `lg`). */
export const DESKTOP_NOTES_QUERY = "(min-width: 1024px)";

function getMatcher(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(query);
}

/**
 * Subscribes to a CSS media query. Used to mount exactly ONE layout (instead of rendering
 * both and hiding one with CSS, which doubled KaTeX work and AskPanel state).
 * `serverValue` is what the server render and hydration assume.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = getMatcher(query);
      if (!mql) return () => {};
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      }
      // Safari < 14
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    },
    [query],
  );
  const getSnapshot = () => getMatcher(query)?.matches ?? serverValue;
  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}

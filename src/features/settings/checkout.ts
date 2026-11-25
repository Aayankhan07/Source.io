import { track } from "@/lib/analytics/track";

/** Public Scholar Pass checkout page (safe to render: no user data). */
export const SCHOLAR_CHECKOUT_BASE = "https://sourceio.lemonsqueezy.com/buy/scholar-pass";

/**
 * Opens Lemon Squeezy checkout with the user id and email prefilled. The full URL is built
 * only on click so the email is never rendered into the DOM (where analytics could see it).
 */
export function openScholarCheckout(
  user: { id?: string | null; email?: string | null } | null | undefined,
  location: string,
  event?: { preventDefault: () => void },
) {
  event?.preventDefault();
  track("upgrade_clicked", { location });
  const params = new URLSearchParams();
  params.set("checkout[custom][user_id]", user?.id || "");
  params.set("checkout[email]", user?.email || "");
  window.open(`${SCHOLAR_CHECKOUT_BASE}?${params.toString()}`, "_blank", "noopener,noreferrer");
}

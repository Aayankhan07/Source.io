import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refunds & Cancellation | Source.io",
  description: "How to cancel Scholar Pass and when refunds are available.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refunds & Cancellation"
      intro={<p>Scholar Pass is billed monthly through Lemon Squeezy, our merchant of record.</p>}
      sections={[
        {
          heading: "Cancelling",
          body: (
            <p>
              Cancel any time from Settings → Plan &amp; Billing → Manage billing. You keep Scholar Pass until the end of
              the period you have paid for, then your account returns to the Free plan. Your documents stay; if you have
              more than the Free plan allows, you can still open and delete them but not add new ones.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <p>
              If you are charged and change your mind within 14 days of a first payment, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from your account address and we will refund it in
              full. Renewals are not refunded once the new period has started, except where the law requires it or the
              service was unavailable for a significant part of the period.
            </p>
          ),
        },
      ]}
    />
  );
}

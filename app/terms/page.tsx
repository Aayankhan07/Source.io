import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Terms of Service | Source.io",
  description: "The rules for using Source.io: accounts, your content, plan limits, acceptable use and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={<p>By creating an account or using Source.io you agree to these terms. If you do not agree, do not use the service.</p>}
      sections={[
        {
          heading: "The service",
          body: (
            <p>
              Source.io generates study material — notes, flashcards, quizzes, audio recaps and chat answers — from
              content you provide, using third-party AI models. AI output can be wrong or incomplete. Check important
              facts against your source; chat answers list the passages they used so you can do this.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: <p>Keep your login details secure. You are responsible for activity on your account. One person per account.</p>,
        },
        {
          heading: "Your content",
          body: (
            <>
              <p>
                You keep all rights to what you upload and to the material generated from it. You give us permission to
                store and process it only to run the service for you, including sending it to the providers listed in
                the <a href="/privacy">Privacy Policy</a>.
              </p>
              <p>Only upload content you have the right to use. Do not upload material whose terms forbid sharing it with AI providers.</p>
            </>
          ),
        },
        {
          heading: "Plans and limits",
          body: (
            <p>
              The Free plan includes {PLANS.free.dailyActions} AI actions per day, {PLANS.free.documents} documents and up
              to {PLANS.free.pagesPerDocument} pages per document. Scholar Pass (${PLANS.scholar.priceMonthlyUsd}/month)
              includes {PLANS.scholar.dailyActions} AI actions per day, {PLANS.scholar.documents} documents and up to{" "}
              {PLANS.scholar.pagesPerDocument} pages per document. Current limits are always shown on the{" "}
              <a href="/pricing">pricing page</a>. We may change limits or prices with at least 30 days&apos; notice for
              paid plans.
            </p>
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <ul>
              <li>No attempts to bypass plan limits, access other users&apos; data, or disrupt the service.</li>
              <li>No automated bulk use or reselling of the service.</li>
              <li>No illegal content, and nothing that infringes others&apos; rights.</li>
            </ul>
          ),
        },
        {
          heading: "Suspension and termination",
          body: <p>You can delete your account at any time in Settings. We may suspend accounts that break these terms, and will explain why where we can.</p>,
        },
        {
          heading: "Disclaimers and liability",
          body: (
            <p>
              The service is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect
              losses or for decisions made using AI output, and our total liability is limited to what you paid us in the
              12 months before the claim. Nothing here limits rights you have under consumer law.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>,
        },
      ]}
    />
  );
}

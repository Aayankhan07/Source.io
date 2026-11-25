import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Source.io",
  description: "What Source.io collects, why, which providers process your documents, and how to export or delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Source.io turns documents you upload into study material. This policy explains what data that involves, who
          processes it, and the controls you have. We do not sell your data, and we do not train our own AI models on
          your documents.
        </p>
      }
      sections={[
        {
          heading: "What we collect",
          body: (
            <ul>
              <li><strong>Account data</strong>: email address, display name, chosen role and workspace preferences.</li>
              <li><strong>Content you add</strong>: document text (PDF and Word files are converted to text in your browser; the file itself is not uploaded), audio and video files you upload for transcription, and everything generated from them — notes, flashcards, quizzes, audio recaps and chat messages.</li>
              <li><strong>Study progress</strong>: flashcard review results and quiz attempts, used to schedule reviews.</li>
              <li><strong>Usage records</strong>: counts of AI actions, model used, token counts and errors, used to enforce plan limits and control costs.</li>
              <li><strong>Billing data</strong>: subscription status. Card details are handled by our payment provider and never reach our servers.</li>
              <li><strong>Technical data</strong>: error reports and aggregate, cookie-free page analytics.</li>
            </ul>
          ),
        },
        {
          heading: "Who processes your data",
          body: (
            <>
              <p>We use these service providers. Document text is only sent to the AI providers needed to produce what you asked for.</p>
              <ul>
                <li><strong>Supabase</strong> — database, authentication, file storage and server functions.</li>
                <li><strong>Vercel</strong> — website hosting and cookie-free analytics.</li>
                <li><strong>Groq</strong> — AI generation for notes, flashcards, quizzes, chat and audio scripts, and speech-to-text for uploaded audio and video.</li>
                <li><strong>Google (Gemini API)</strong> — AI generation for long documents. Google&apos;s free tier may use inputs to improve Google&apos;s products. Avoid uploading material you are not allowed to share with Google, or add your own API key.</li>
                <li><strong>Your own provider</strong> — if you add your own Groq, Gemini or OpenAI key, requests that use it are sent to that provider under your account and their terms.</li>
                <li><strong>Lemon Squeezy</strong> — payments and subscriptions, as merchant of record.</li>
                <li><strong>Sentry</strong> — error reports, configured not to collect personal data by default.</li>
                <li><strong>PostHog</strong> — product analytics (which features are used, keyed to your account ID, never your email; page text is masked and Do Not Track is respected). No ad tracking.</li>
              </ul>
              <p>Audio recaps are synthesised in your own browser; the script is not sent to a speech service.</p>
            </>
          ),
        },
        {
          heading: "Why we use it",
          body: (
            <ul>
              <li>To provide the service you asked for (performance of a contract).</li>
              <li>To enforce plan limits, prevent abuse and keep costs sustainable (legitimate interest).</li>
              <li>To process payments and keep tax records (legal obligation).</li>
            </ul>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              Your documents and study material stay until you delete them or your account. Usage records are kept for up
              to 12 months. When you delete your account, your documents, generated material, progress and uploaded files
              are deleted from our database and storage; backups expire on the provider&apos;s schedule. Billing records
              are kept as long as tax law requires.
            </p>
          ),
        },
        {
          heading: "Your rights and controls",
          body: (
            <ul>
              <li><strong>Export</strong>: Settings → Data &amp; Storage → Export downloads all your documents and generated material as JSON.</li>
              <li><strong>Delete</strong>: Settings → Data &amp; Storage → Delete account permanently removes your account and data.</li>
              <li>You can also ask us to access, correct or delete your data, or object to processing, by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You may complain to your local data protection authority.</li>
            </ul>
          ),
        },
        {
          heading: "Children",
          body: <p>Source.io is not directed at children under 13. If you are under the age of digital consent where you live, use it only with a parent or guardian&apos;s permission.</p>,
        },
        {
          heading: "Changes",
          body: <p>We will update this page and the date above when this policy changes, and notify account holders of material changes by email.</p>,
        },
      ]}
    />
  );
}

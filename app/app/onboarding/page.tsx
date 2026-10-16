import OnboardingWizard from "@/features/onboarding/OnboardingWizard";

export const metadata = {
  title: "Welcome to Source.io — Calibrate Your Workstation",
  description: "Personalize your workspace study tools, AI reasoning rigor, and note architectures.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}

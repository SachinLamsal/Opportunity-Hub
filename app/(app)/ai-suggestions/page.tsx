import PageHeader from "@/components/layout/PageHeader";
import AISuggestionsPanel from "@/components/ai/AISuggestionsPanel";

export const metadata = {
  title: "AI Suggestions",
};

export default function AISuggestionsPage() {
  return (
    <>
      <PageHeader
        title="AI Suggestions"
        description="Practical tips and opportunity ideas based on your profile and activities."
      />
      <AISuggestionsPanel />
    </>
  );
}

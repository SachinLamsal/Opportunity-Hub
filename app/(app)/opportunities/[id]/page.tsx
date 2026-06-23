import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getOpportunityById,
  isOpportunitySaved,
} from "@/lib/queries/opportunities";
import { formatDate } from "@/lib/utils/format";
import PageHeader from "@/components/layout/PageHeader";
import SaveOpportunityButton from "@/components/opportunities/SaveOpportunityButton";
import OpportunityEnrichPanel from "@/components/opportunities/OpportunityEnrichPanel";
import OpportunityTimeline from "@/components/opportunities/OpportunityTimeline";
import { Card } from "@/components/ui/Card";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailSection({
  title,
  content,
}: {
  title: string;
  content: string | null | undefined;
}) {
  if (!content?.trim()) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {content}
      </div>
    </Card>
  );
}

export async function generateMetadata({ params }: OpportunityDetailPageProps) {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);

  return {
    title: opportunity?.title ?? "Opportunity",
  };
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);

  if (!opportunity) {
    notFound();
  }

  const saved = await isOpportunitySaved(id);
  const hasStoredDetails =
    Boolean(opportunity.ai_summary) && Boolean(opportunity.prep_resources);

  const detailRows = [
    { label: "Organizer", value: opportunity.organizer },
    { label: "Location", value: opportunity.location },
    {
      label: "Format",
      value: opportunity.is_online ? "Online" : "In person",
    },
    { label: "Category", value: opportunity.type },
    { label: "Subject area", value: opportunity.subject_area },
    { label: "Cost", value: opportunity.cost },
    { label: "Time commitment", value: opportunity.time_commitment },
    { label: "Skills gained", value: opportunity.skills_gained },
    { label: "Difficulty", value: opportunity.difficulty_level },
    { label: "Contact", value: opportunity.contact_info },
  ].filter((row) => row.value);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/opportunities"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to opportunities
        </Link>
      </div>

      <PageHeader
        title={opportunity.title}
        description={opportunity.organizer ?? undefined}
        action={
          <SaveOpportunityButton
            key={String(saved)}
            opportunityId={opportunity.id}
            initialSaved={saved}
          />
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          {opportunity.type}
        </span>
        {opportunity.subject_area && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {opportunity.subject_area}
          </span>
        )}
        {opportunity.difficulty_level && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
            {opportunity.difficulty_level}
          </span>
        )}
        {opportunity.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-500"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <OpportunityEnrichPanel
            opportunityId={opportunity.id}
            aiEnrichedAt={opportunity.ai_enriched_at}
            hasStoredDetails={hasStoredDetails}
          />

          {opportunity.ai_summary && (
            <Card className="border-indigo-100">
              <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {opportunity.ai_summary}
              </p>
            </Card>
          )}

          <DetailSection title="Description" content={opportunity.description} />

          <DetailSection
            title="Prep resources"
            content={opportunity.prep_resources}
          />

          <DetailSection
            title="How to apply"
            content={opportunity.application_steps}
          />

          <DetailSection
            title="Eligibility"
            content={
              opportunity.eligibility_details ?? opportunity.grade_requirements
            }
          />

          <DetailSection
            title="Portfolio tips"
            content={opportunity.portfolio_tips}
          />
        </div>

        <div className="space-y-6">
          <OpportunityTimeline opportunity={opportunity} />

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Quick facts</h2>
            <dl className="mt-4 space-y-3">
              {detailRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-800">{row.value}</dd>
                </div>
              ))}
              {opportunity.deadline && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deadline
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-800">
                    {formatDate(opportunity.deadline)}
                  </dd>
                </div>
              )}
            </dl>

            {opportunity.registration_link && (
              <div className="mt-6">
                <a
                  href={opportunity.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Register / Official page
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

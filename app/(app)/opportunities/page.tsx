import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import OpportunityFilters from "@/components/opportunities/OpportunityFilters";
import OpportunityList from "@/components/opportunities/OpportunityList";
import {
  getOpportunities,
  getSavedOpportunityIds,
} from "@/lib/queries/opportunities";

export const metadata = {
  title: "Opportunities",
};

interface OpportunitiesPageProps {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    type?: string;
    deadline?: string;
    format?: string;
  }>;
}

function FiltersSkeleton() {
  return <div className="h-48 animate-pulse rounded-xl bg-slate-100" />;
}

async function OpportunityResults({
  searchParams,
}: {
  searchParams: OpportunitiesPageProps["searchParams"];
}) {
  const params = await searchParams;
  const [opportunities, savedIds] = await Promise.all([
    getOpportunities({
      q: params.q,
      subject: params.subject,
      type: params.type,
      deadline: params.deadline,
      format: params.format,
    }),
    getSavedOpportunityIds(),
  ]);

  const hasFilters =
    params.q || params.subject || params.type || params.deadline || params.format;

  return (
    <>
      <p className="mb-4 text-sm text-slate-600">
        {opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"} found
        {hasFilters ? " matching your filters" : ""}, newest first.
      </p>
      <OpportunityList
        opportunities={opportunities}
        savedIds={savedIds}
        emptyMessage={
          hasFilters
            ? "No opportunities match your filters. Try clearing some filters."
            : "No opportunities yet. Run supabase/seed-opportunities.sql to add sample data."
        }
      />
    </>
  );
}

export default function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Discover competitions, workshops, internships, and more."
      />

      <div className="space-y-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <OpportunityFilters />
        </Suspense>

        <Suspense fallback={<FiltersSkeleton />}>
          <OpportunityResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

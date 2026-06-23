import { Card } from "@/components/ui/Card";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <Card className="text-center py-12">
      <p className="text-sm font-medium text-indigo-600">Coming in next step</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
    </Card>
  );
}

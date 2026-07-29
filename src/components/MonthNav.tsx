import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonth } from "#/lib/recurrence";
import { Button } from "@/components/ui/button";

export const monthLabel = (key: string) =>
  new Date(key + "-01T00:00:00Z").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * Prev/next navigation over a YYYY-MM key. Renders a fragment so the caller's
 * flex row keeps owning the layout (transactions parks a filter beside it).
 */
export function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-0 flex-1 text-center font-medium sm:min-w-40 sm:flex-none">
        {month ? monthLabel(month) : "Sem transações"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Próximo mês"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
    </>
  );
}

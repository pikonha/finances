import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { listFaturas } from "#/server/faturas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authed/faturas")({
  component: Faturas,
});

const money = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Faturas() {
  const { data = [] } = useQuery({
    queryKey: ["faturas"],
    queryFn: () => listFaturas(),
  });
  const cards = data.filter((f) => f.isCurrent);

  return (
    <main className="page-wrap rise-in py-6 sm:py-10">
      <h1 className="display-title mb-6 text-3xl font-bold sm:text-4xl">
        Faturas
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Cartões de crédito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cards.map((f) => (
            <Link
              key={f.accountId}
              to="/faturas/$accountId"
              params={{ accountId: f.accountId }}
              className="flex items-center gap-3 border-2 border-foreground bg-card p-4 brutal-shadow transition-transform hover:-translate-y-0.5"
            >
              <span className="min-w-0 truncate font-medium">
                {f.accountName}
              </span>
              <span className="ml-auto shrink-0 font-medium">
                {money(f.total)}
              </span>
              <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          ))}
          {!cards.length && (
            <p className="text-muted-foreground">
              Nenhum cartão de crédito cadastrado.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

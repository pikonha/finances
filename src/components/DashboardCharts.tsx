import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Category, Transaction } from "#/db/schema";
import type { FaturaRow } from "#/server/faturas.core";
import { faturaLabel } from "#/lib/faturas";
import { addMonths } from "#/lib/installments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTHS_SHORT_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];
const monthLabel = (yearMonth: string) => {
  const [, m] = yearMonth.split("-").map(Number);
  return MONTHS_SHORT_PT[m - 1];
};

const COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5",
];
const MONEY_AXIS_WIDTH = 72;
const HIDDEN_MONEY = "••••••";
// ponytail: axis ticks are compact (R$ 1,2 mil) so a 140px axis doesn't eat a phone screen; tooltips keep full values.
const axisMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });

function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function defaultStartMonth() {
  return addMonths(`${localMonthKey()}-01`, -5).slice(0, 7);
}

type Props = {
  transactions: Transaction[];
  categories: Category[];
  faturas: FaturaRow[];
  showValues: boolean;
};

export function DashboardCharts({
  transactions,
  categories,
  faturas,
  showValues,
}: Props) {
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(localMonthKey);
  const displayMoney = (cents: number) =>
    showValues ? money(cents) : HIDDEN_MONEY;
  const displayAxisMoney = (cents: number) =>
    showValues ? axisMoney(cents) : HIDDEN_MONEY;

  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (
          t
        ): t is Transaction & { type: "earn" | "expend" } =>
          t.type !== "transfer" &&
          t.date.slice(0, 7) >= startMonth &&
          t.date.slice(0, 7) <= endMonth
      ),
    [transactions, startMonth, endMonth]
  );

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of periodTransactions) {
      if (t.type !== "expend") continue;
      const name = categoryNames.get(t.categoryId ?? "") ?? "Sem categoria";
      totals.set(name, (totals.get(name) ?? 0) + t.amount);
    }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions, categoryNames]);

  const byMonth = useMemo(() => {
    const totals = new Map<string, { earn: number; expend: number }>();
    for (const t of periodTransactions) {
      const key = t.date.slice(0, 7);
      const row = totals.get(key) ?? { earn: 0, expend: 0 };
      row[t.type] += t.amount;
      totals.set(key, row);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({ month: monthLabel(month), ...row }));
  }, [periodTransactions]);

  const nextFaturaPerCard = useMemo(
    () => faturas.filter((f) => f.isCurrent),
    [faturas]
  );

  const committedTimeline = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const horizon = addMonths(today, 6);
    const totals = new Map<string, number>();
    for (const f of faturas) {
      if (f.vencimento < today || f.vencimento > horizon) continue;
      const key = f.vencimento.slice(0, 7);
      totals.set(key, (totals.get(key) ?? 0) + f.total);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: monthLabel(month),
        label: faturaLabel(`${month}-01`),
        total,
      }));
  }, [faturas]);

  return (
    <div className="mb-6 space-y-6">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CardTitle>Gastos por categoria e Receitas x Despesas</CardTitle>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <label htmlFor="dashboard-period-start" className="sr-only">
              Início do período
            </label>
            <input
              id="dashboard-period-start"
              type="month"
              className="control min-w-0 flex-1"
              value={startMonth}
              max={endMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
            <span aria-hidden="true">–</span>
            <label htmlFor="dashboard-period-end" className="sr-only">
              Fim do período
            </label>
            <input
              id="dashboard-period-end"
              type="month"
              className="control min-w-0 flex-1"
              value={endMonth}
              min={startMonth}
              onChange={(e) => setEndMonth(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-muted-foreground">
              Despesas por categoria
            </p>
            {byCategory.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => displayMoney(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma despesa no período selecionado.
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-muted-foreground">
              Receitas x despesas por mês
            </p>
            {byMonth.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={displayAxisMoney}
                    width={MONEY_AXIS_WIDTH}
                  />
                  <Tooltip formatter={(value) => displayMoney(Number(value))} />
                  <Legend />
                  <Bar dataKey="earn" name="Receitas" fill="#16a34a" />
                  <Bar dataKey="expend" name="Despesas" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma transação no período selecionado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compromissos de cartão de crédito</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-muted-foreground">
              Próxima fatura por cartão
            </p>
            {nextFaturaPerCard.length ? (
              <div className="space-y-2">
                {nextFaturaPerCard.map((f) => (
                  <div
                    key={f.accountId}
                    className="flex justify-between gap-3 border-b pb-2 last:border-0"
                  >
                    <span className="min-w-0 truncate">{f.accountName}</span>
                    <span className="shrink-0 font-medium">{displayMoney(f.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nenhum cartão de crédito cadastrado.
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-muted-foreground">
              Total comprometido — próximos 6 meses
            </p>
            {committedTimeline.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={committedTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={displayAxisMoney}
                    width={MONEY_AXIS_WIDTH}
                  />
                  <Tooltip formatter={(value) => displayMoney(Number(value))} />
                  <Bar dataKey="total" name="Comprometido" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Nenhum compromisso nos próximos 6 meses.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

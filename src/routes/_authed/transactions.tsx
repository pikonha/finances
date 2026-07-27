import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listAccounts } from "#/server/accounts";
import { createCategory, listCategories } from "#/server/categories";
import {
  createTransaction,
  createTransfer,
  deleteTransaction,
  listInstallmentPlans,
  listTransactions,
} from "#/server/transactions";
import type { CreateTransactionInput } from "#/server/schemas";
import { CategorySelect } from "@/components/CategorySelect";
import { TransferModal } from "@/components/TransferModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker, localDateKey } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMPTY_SELECT_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authed/transactions")({
  component: Transactions,
});
type Repeat =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "installments";
const money = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const monthLabel = (key: string) =>
  new Date(key + "-01T00:00:00Z").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const kindLabel = (k: string) =>
  k === "credit_card" ? "cartão de crédito" : "conta bancária";

function Transactions() {
  const qc = useQueryClient();
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => listTransactions(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["installmentPlans"],
    queryFn: () => listInstallmentPlans(),
  });
  const [type, setType] = useState<"earn" | "expend">("expend"),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(localDateKey),
    [categoryId, setCategoryId] = useState(""),
    [accountId, setAccountId] = useState(""),
    [note, setNote] = useState(""),
    [repeat, setRepeat] = useState<Repeat>("none"),
    [count, setCount] = useState("2");
  const selected = accounts.find((a) => a.id === accountId);
  const canInstall = type === "expend" && selected?.kind === "credit_card";
  useEffect(() => {
    if (repeat === "installments" && !canInstall) setRepeat("monthly");
  }, [repeat, canInstall]);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["installmentPlans"] });
  };
  const create = useMutation({
    mutationFn: (data: CreateTransactionInput) => createTransaction({ data }),
    onSuccess: () => {
      refresh();
      setAmount("");
      setNote("");
      setRepeat("none");
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory({ data: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
  const removeTx = useMutation({
    mutationFn: (id: string) => deleteTransaction({ data: { id } }),
    onSuccess: refresh,
  });

  // Group by month (newest first), always including the current month so it's the default view.
  const currentMonth = new Date().toISOString().slice(0, 7);
  const months = useMemo(
    () =>
      [
        ...new Set([
          currentMonth,
          ...transactions.map((t) => t.date.slice(0, 7)),
        ]),
      ]
        .sort()
        .reverse(),
    [transactions, currentMonth]
  );
  const [monthIdx, setMonthIdx] = useState(() =>
    Math.max(0, months.indexOf(currentMonth))
  );
  useEffect(() => {
    if (monthIdx > months.length - 1)
      setMonthIdx(Math.max(0, months.length - 1));
  }, [months.length, monthIdx]);
  const activeMonth = months[monthIdx];
  const monthTx = transactions.filter(
    (t) => t.date.slice(0, 7) === activeMonth
  );
  // installment payment position: x/y where y=plan.count, x=1-based order within the plan.
  const planCount = useMemo(
    () => new Map(plans.map((p) => [p.id, p.count])),
    [plans]
  );
  const installIndex = useMemo(() => {
    const groups = new Map<string, typeof transactions>();
    for (const tx of transactions)
      if (tx.installmentPlanId) {
        const g = groups.get(tx.installmentPlanId) ?? [];
        g.push(tx);
        groups.set(tx.installmentPlanId, g);
      }
    const idx = new Map<string, number>();
    for (const g of groups.values()) {
      g.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      g.forEach((t, i) => idx.set(t.id, i + 1));
    }
    return idx;
  }, [transactions]);

  return (
    <main className="page-wrap rise-in py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-title text-3xl font-bold sm:text-4xl">
          Transações
        </h1>
        <TransferModal
          accounts={accounts}
          onTransfer={async (data) => {
            await createTransfer({ data });
            refresh();
          }}
        />
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar transação</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const dollars = Number(amount);
              if (!dollars || dollars <= 0) return;
              create.mutate({
                type,
                amount: Math.round(dollars * 100),
                date,
                category_id: categoryId || undefined,
                account_id: accountId || undefined,
                note: note || undefined,
                recurrence:
                  repeat !== "none" && repeat !== "installments"
                    ? { interval: repeat }
                    : undefined,
                installments:
                  repeat === "installments"
                    ? { count: Number(count) }
                    : undefined,
              });
            }}
          >
            <Field label="Nome">
              <Input
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={type}
                onValueChange={(value) => setType(value as typeof type)}
              >
                <SelectTrigger aria-label="Tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expend">Despesa</SelectItem>
                  <SelectItem value="earn">Receita</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor (R$)">
              <Input
                type="number"
                min=".01"
                step=".01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field label="Data" htmlFor="transaction-page-date">
              <DatePicker
                id="transaction-page-date"
                value={date}
                onChange={setDate}
                required
              />
            </Field>
            <Field label="Categoria">
              <CategorySelect
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                onCreate={async (name) =>
                  (await createCategoryMutation.mutateAsync(name)).id
                }
              />
            </Field>
            <Field label="Conta">
              <Select
                value={accountId || EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  setAccountId(value === EMPTY_SELECT_VALUE ? "" : value)
                }
              >
                <SelectTrigger aria-label="Conta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>Nenhuma</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {kindLabel(a.kind)}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Repetir">
              <Select
                value={repeat}
                onValueChange={(value) => setRepeat(value as Repeat)}
              >
                <SelectTrigger aria-label="Repetir">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repetir</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="installments" disabled={!canInstall}>
                    Parcelado…
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {repeat === "installments" && (
              <Field label="Número de parcelas">
                <Input
                  type="number"
                  min="2"
                  max="60"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </Field>
            )}
            <div className="flex items-end sm:pb-2">
              <Button className="w-full sm:w-auto" disabled={create.isPending}>
                Adicionar transação
              </Button>
            </div>
            {create.error && (
              <p className="text-sm text-destructive sm:col-span-full">
                {create.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Todas as transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={monthIdx >= months.length - 1}
              onClick={() => setMonthIdx((i) => i + 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-0 flex-1 text-center font-medium sm:min-w-40 sm:flex-none">
              {activeMonth ? monthLabel(activeMonth) : "Sem transações"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={monthIdx <= 0}
              onClick={() => setMonthIdx((i) => i - 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthTx.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === "earn" ? "default" : "secondary"}
                    >
                      {tx.type === "earn" ? "receita" : "despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      tx.type === "earn"
                        ? "text-emerald-600"
                        : "text-destructive"
                    }
                  >
                    {tx.type === "earn" ? "+" : "−"}
                    {money(tx.amount)}
                  </TableCell>
                  <TableCell>{tx.note || "—"}</TableCell>
                  <TableCell>
                    {tx.installmentPlanId && (
                      <Badge variant="outline">
                        {installIndex.get(tx.id)}/
                        {planCount.get(tx.installmentPlanId)}
                      </Badge>
                    )}{" "}
                    {tx.recurrenceRuleId && (
                      <Badge variant="outline">recorrente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTx.mutate(tx.id)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {monthTx.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma transação neste mês.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

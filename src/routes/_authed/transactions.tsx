import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { listAccounts } from "#/server/accounts";
import { createCategory, listCategories } from "#/server/categories";
import {
  createTransaction,
  createTransfer,
  deleteRecurrenceRule,
  deleteTransaction,
  listInstallmentPlans,
  listRecurrenceRules,
  listTransactions,
} from "#/server/transactions";
import type { CreateTransactionInput, TransferInput } from "#/server/schemas";
import type { Category, Transaction } from "#/db/schema";
import {
  financeQueryKeys,
  newestTransactions,
  optimisticCategory,
  optimisticId,
  optimisticTransaction,
  optimisticTransfer,
} from "#/lib/optimistic";
import { localMonthKey, scheduledDatesInMonth } from "#/lib/recurrence";
import { CategorySelect } from "@/components/CategorySelect";
import { MonthNav } from "@/components/MonthNav";
import { MoneyInput } from "@/components/MoneyInput";
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
const dayLabel = (date: string) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
const weekdayLabel = (date: string) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  });

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
  const { data: recurrenceRules = [] } = useQuery({
    queryKey: financeQueryKeys.recurrenceRules,
    queryFn: () => listRecurrenceRules(),
  });
  const [type, setType] = useState<"earn" | "expend">("expend"),
    [amount, setAmount] = useState<number | null>(null),
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
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: financeQueryKeys.transactions }),
      qc.invalidateQueries({ queryKey: financeQueryKeys.installmentPlans }),
      qc.invalidateQueries({ queryKey: financeQueryKeys.recurrenceRules }),
    ]);
  const create = useMutation({
    mutationFn: (data: CreateTransactionInput) => createTransaction({ data }),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: financeQueryKeys.transactions });
      const previous = qc.getQueryData<Transaction[]>(
        financeQueryKeys.transactions,
      );
      qc.setQueryData<Transaction[]>(
        financeQueryKeys.transactions,
        (current = []) =>
          newestTransactions([optimisticTransaction(data), ...current]),
      );
      return { previous };
    },
    onError: (_error, _data, context) =>
      qc.setQueryData(financeQueryKeys.transactions, context?.previous),
    onSuccess: () => {
      setAmount(null);
      setNote("");
      setRepeat("none");
    },
    onSettled: refresh,
  });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory({ data: { name } }),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: financeQueryKeys.categories });
      const previous = qc.getQueryData<Category[]>(financeQueryKeys.categories);
      const temporaryId = optimisticId();
      qc.setQueryData<Category[]>(
        financeQueryKeys.categories,
        (current = []) =>
          [...current, optimisticCategory(name, temporaryId)].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
      );
      return { previous, temporaryId };
    },
    onSuccess: ({ id }, _name, context) =>
      qc.setQueryData<Category[]>(
        financeQueryKeys.categories,
        (current = []) =>
          current.map((category) =>
            category.id === context?.temporaryId
              ? { ...category, id }
              : category,
          ),
      ),
    onError: (_error, _name, context) =>
      qc.setQueryData(financeQueryKeys.categories, context?.previous),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: financeQueryKeys.categories }),
  });
  const removeTx = useMutation({
    mutationFn: (id: string) => deleteTransaction({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: financeQueryKeys.transactions });
      const previous = qc.getQueryData<Transaction[]>(
        financeQueryKeys.transactions,
      );
      qc.setQueryData<Transaction[]>(
        financeQueryKeys.transactions,
        (current = []) => current.filter((transaction) => transaction.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) =>
      qc.setQueryData(financeQueryKeys.transactions, context?.previous),
    onSettled: refresh,
  });
  const removeRule = useMutation({
    mutationFn: (id: string) => deleteRecurrenceRule({ data: { id } }),
    onSettled: refresh,
  });
  const transfer = useMutation({
    mutationFn: (data: TransferInput) => createTransfer({ data }),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: financeQueryKeys.transactions });
      const previous = qc.getQueryData<Transaction[]>(
        financeQueryKeys.transactions,
      );
      qc.setQueryData<Transaction[]>(
        financeQueryKeys.transactions,
        (current = []) =>
          newestTransactions([optimisticTransfer(data), ...current]),
      );
      return { previous };
    },
    onError: (_error, _data, context) =>
      qc.setQueryData(financeQueryKeys.transactions, context?.previous),
    onSettled: refresh,
  });

  // Calendar navigation is independent of existing rows, so empty and future
  // months remain reachable.
  const [activeMonth, setActiveMonth] = useState(localMonthKey);
  const [filterAccount, setFilterAccount] = useState("");
  const monthTx = transactions.filter(
    (t) =>
      t.date.slice(0, 7) === activeMonth &&
      // transferência aparece nas duas contas envolvidas
      (!filterAccount ||
        t.accountId === filterAccount ||
        t.counterAccountId === filterAccount),
  );
  const scheduled = useMemo(
    () =>
      // ponytail: recurrence_rule não tem conta, então some ao filtrar
      filterAccount
        ? []
        : recurrenceRules.flatMap((rule) =>
            scheduledDatesInMonth(rule.interval, rule.nextRun, activeMonth).map(
              (date) => ({ rule, date }),
            ),
          ),
    [activeMonth, recurrenceRules, filterAccount],
  );
  // installment payment position: x/y where y=plan.count, x=1-based order within the plan.
  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
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
  // transações e recorrências agendadas numa única lista, mais recente primeiro
  const rows = [
    ...monthTx.map((tx) => ({
      key: tx.id,
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      note: tx.note,
      category: categoryName.get(tx.categoryId ?? ""),
      account: accountName.get(tx.accountId ?? ""),
      counterAccount: tx.counterAccountId
        ? (accountName.get(tx.counterAccountId) ?? "—")
        : null,
      badges: [
        tx.installmentPlanId &&
          `${installIndex.get(tx.id)}/${planCount.get(tx.installmentPlanId)}`,
        tx.recurrenceRuleId && "recorrente",
      ].filter(Boolean) as string[],
      pending: false,
      onDelete: () => removeTx.mutate(tx.id),
    })),
    ...scheduled.map(({ rule, date }) => ({
      key: `scheduled-${rule.id}-${date}`,
      date,
      type: rule.type,
      amount: rule.amount,
      note: rule.note,
      category: categoryName.get(rule.categoryId ?? ""),
      // ponytail: recurrence_rule não tem conta
      account: undefined,
      counterAccount: null,
      badges: ["agendada", "recorrente"],
      pending: removeRule.isPending,
      onDelete: () => removeRule.mutate(rule.id),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="page-wrap rise-in py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-title text-3xl font-bold sm:text-4xl">
          Transações
        </h1>
        <TransferModal
          accounts={accounts}
          onTransfer={async (data) => {
            await transfer.mutateAsync(data);
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
              if (amount === null || amount <= 0) return;
              create.mutate({
                type,
                amount,
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
              <MoneyInput
                value={amount}
                onValueChange={setAmount}
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
                    {a.name}
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
          <div className="relative mb-4 flex flex-wrap items-center justify-center gap-4">
            <MonthNav month={activeMonth} onChange={setActiveMonth} />
            {/* absoluto no desktop pra não desalinhar o seletor de mês do centro */}
            <div className="w-full sm:absolute sm:inset-y-0 sm:right-0 sm:flex sm:w-auto sm:items-center">
              <Select
                value={filterAccount || EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  setFilterAccount(value === EMPTY_SELECT_VALUE ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filtrar por conta"
                  className="w-full sm:w-auto"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>
                    Todas as contas
                  </SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="align-top tabular-nums">
                    <div className="font-medium">{dayLabel(row.date)}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {weekdayLabel(row.date)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[16rem] whitespace-normal align-top">
                    <span
                      className={
                        row.note ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {row.note || "Sem descrição"}
                    </span>
                    {row.badges.length > 0 && (
                      <span className="ml-2 inline-flex gap-1 align-middle">
                        {row.badges.map((badge) => (
                          <Badge key={badge} variant="outline">
                            {badge}
                          </Badge>
                        ))}
                      </span>
                    )}
                    {/* conta e categoria viram linha secundária onde as colunas somem */}
                    <div className="text-xs text-muted-foreground md:hidden">
                      <span className="sm:hidden">{row.category ?? "—"} · </span>
                      {row.account ?? "—"}
                      {row.counterAccount && ` → ${row.counterAccount}`}
                    </div>
                  </TableCell>
                  <TableCell className="hidden align-top text-muted-foreground sm:table-cell">
                    {row.category ?? "—"}
                  </TableCell>
                  <TableCell className="hidden align-top text-muted-foreground md:table-cell">
                    {row.account ?? "—"}
                    {row.counterAccount && ` → ${row.counterAccount}`}
                  </TableCell>
                  <TableCell
                    className={`align-top text-right font-bold tabular-nums ${
                      row.type === "earn"
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    {row.type === "earn" ? "+" : "−"}
                    {money(row.amount)}
                  </TableCell>
                  <TableCell className="align-top">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      className="size-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={row.pending}
                      onClick={row.onDelete}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
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

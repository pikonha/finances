import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CreateTransactionInput } from "#/server/schemas";
import { CategorySelect } from "./CategorySelect";
import { MoneyInput } from "./MoneyInput";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  EMPTY_SELECT_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DatePicker, localDateKey } from "./ui/date-picker";

type RepeatInterval =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "installments";
type CategoryOption = { id: string; name: string };
type AccountOption = { id: string; name: string; kind: string };

type TransactionModalProps = {
  type: "earn" | "expend";
  accounts: AccountOption[];
  categories: CategoryOption[];
  onCreate: (data: CreateTransactionInput) => Promise<unknown>;
  onCreateCategory: (name: string) => Promise<string>;
};

const today = () => localDateKey();

export function TransactionModal({
  type,
  accounts,
  categories,
  onCreate,
  onCreateCategory,
}: TransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<RepeatInterval>("none");
  const [count, setCount] = useState("2");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const canInstall =
    type === "expend" && selectedAccount?.kind === "credit_card";
  useEffect(() => {
    if (repeat === "installments" && !canInstall) setRepeat("monthly");
  }, [canInstall, repeat]);

  const reset = () => {
    setAmount(null);
    setDate(today());
    setCategoryId("");
    setAccountId("");
    setNote("");
    setRepeat("none");
    setCount("2");
    setError("");
  };

  const changeOpen = (nextOpen: boolean) => {
    if (isSaving) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          variant={type === "earn" ? "default" : "destructive"}
          aria-label={
            type === "earn" ? "Adicionar receita" : "Adicionar despesa"
          }
        >
          {type === "earn" ? (
            <Plus className="size-5" />
          ) : (
            <Minus className="size-5" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === "earn" ? "Adicionar receita" : "Adicionar despesa"}
          </DialogTitle>
          <DialogDescription>
            Registre {type === "earn" ? "dinheiro recebido" : "dinheiro gasto"}{" "}
            no seu painel.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (amount === null || amount <= 0) return;

            setIsSaving(true);
            setError("");
            try {
              await onCreate({
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
              setOpen(false);
              reset();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível criar a transação"
              );
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="transaction-note">
              <Input
                id="transaction-note"
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <Field label="Valor (R$)" htmlFor="transaction-amount">
              <MoneyInput
                id="transaction-amount"
                value={amount}
                onValueChange={setAmount}
                required
                autoFocus
              />
            </Field>
            <Field label="Data" htmlFor="transaction-date">
              <DatePicker
                id="transaction-date"
                value={date}
                onChange={setDate}
                required
              />
            </Field>
            <Field label="Conta" htmlFor="transaction-account">
              <Select
                value={accountId || EMPTY_SELECT_VALUE}
                onValueChange={(value) =>
                  setAccountId(value === EMPTY_SELECT_VALUE ? "" : value)
                }
              >
                <SelectTrigger id="transaction-account">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>Nenhuma</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ·{" "}
                    {account.kind === "credit_card"
                      ? "cartão de crédito"
                      : "conta bancária"}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <CategorySelect
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                onCreate={onCreateCategory}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Repetir" htmlFor="transaction-repeat">
              <Select
                value={repeat}
                onValueChange={(value) =>
                  setRepeat(value as RepeatInterval)
                }
              >
                <SelectTrigger id="transaction-repeat">
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
              <Field
                label="Número de parcelas"
                htmlFor="transaction-installments"
              >
                <Input
                  id="transaction-installments"
                  type="number"
                  min="2"
                  max="360"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  required
                />
              </Field>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button disabled={isSaving}>
              {isSaving ? "Adicionando…" : "Adicionar transação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Minus, Plus, Repeat, StickyNote } from "lucide-react";
import type { CreateTransactionInput } from "#/server/schemas";
import { CategorySelect } from "./CategorySelect";
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

type RepeatInterval =
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

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionModal({
  type,
  accounts,
  categories,
  onCreate,
  onCreateCategory,
}: TransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [repeat, setRepeat] = useState<RepeatInterval>("monthly");
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
    setAmount("");
    setDate(today());
    setCategoryId("");
    setAccountId("");
    setNote("");
    setShowNote(false);
    setShowRepeat(false);
    setRepeat("monthly");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
            const dollars = Number(amount);
            if (!Number.isFinite(dollars) || dollars <= 0) return;

            setIsSaving(true);
            setError("");
            try {
              await onCreate({
                type,
                amount: Math.round(dollars * 100),
                date,
                category_id: categoryId || undefined,
                account_id: accountId || undefined,
                note: showNote && note ? note : undefined,
                recurrence:
                  showRepeat && repeat !== "installments"
                    ? { interval: repeat }
                    : undefined,
                installments:
                  showRepeat && repeat === "installments"
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
            <Field label="Valor (R$)" htmlFor="transaction-amount">
              <Input
                id="transaction-amount"
                type="number"
                min=".01"
                step=".01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label="Data" htmlFor="transaction-date">
              <Input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </Field>
            <Field label="Conta" htmlFor="transaction-account">
              <select
                id="transaction-account"
                className="control"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                <option value="">Nenhuma</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ·{" "}
                    {account.kind === "credit_card"
                      ? "cartão de crédito"
                      : "conta bancária"}
                  </option>
                ))}
              </select>
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <Label>Categoria</Label>
              <CategorySelect
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                onCreate={onCreateCategory}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={showRepeat ? "default" : "outline"}
              onClick={() => setShowRepeat((value) => !value)}
            >
              <Repeat className="size-4" />
              Repetir
            </Button>
            <Button
              type="button"
              variant={showNote ? "default" : "outline"}
              onClick={() => {
                setShowNote((value) => !value);
                if (showNote) setNote("");
              }}
            >
              <StickyNote className="size-4" />
              Nota
            </Button>
          </div>
          {showRepeat && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Repetir" htmlFor="transaction-repeat">
                <select
                  id="transaction-repeat"
                  className="control"
                  value={repeat}
                  onChange={(event) =>
                    setRepeat(event.target.value as RepeatInterval)
                  }
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                  <option value="installments" disabled={!canInstall}>
                    Parcelado…
                  </option>
                </select>
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
          )}
          {showNote && (
            <Field label="Nota" htmlFor="transaction-note">
              <Input
                id="transaction-note"
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
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

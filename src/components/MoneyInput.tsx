import { formatCentsBRL, parseMoneyInputToCents } from "#/lib/money";
import { Input } from "./ui/input";

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

export function MoneyInput({
  value,
  onValueChange,
  ...props
}: MoneyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value === null ? "" : formatCentsBRL(value)}
      onChange={(event) =>
        onValueChange(parseMoneyInputToCents(event.target.value))
      }
    />
  );
}

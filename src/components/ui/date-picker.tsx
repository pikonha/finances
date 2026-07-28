import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const valueFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const accessibleDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
});
const weekDays = [
  ["D", "Domingo"],
  ["S", "Segunda-feira"],
  ["T", "Terça-feira"],
  ["Q", "Quarta-feira"],
  ["Q", "Quinta-feira"],
  ["S", "Sexta-feira"],
  ["S", "Sábado"],
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(month: Date) {
  const start = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - month.getDay(),
  );

  return Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

export function DatePicker({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    firstOfMonth(parseDateKey(value)),
  );
  const [focusedDateKey, setFocusedDateKey] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const generatedId = useId();
  const calendarId = `${id}-calendar-${generatedId.replaceAll(":", "")}`;
  const selectedDate = parseDateKey(value);
  const today = localDateKey();

  useEffect(() => {
    if (open) dayRefs.current.get(focusedDateKey)?.focus();
  }, [focusedDateKey, open, visibleMonth]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const select = (date: Date) => {
    onChange(localDateKey(date));
    setVisibleMonth(firstOfMonth(date));
    setFocusedDateKey(localDateKey(date));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openCalendar = () => {
    setVisibleMonth(firstOfMonth(selectedDate));
    setFocusedDateKey(value);
    setOpen(true);
  };

  const moveFocus = (date: Date, days: number) => {
    const nextDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + days,
    );
    setFocusedDateKey(localDateKey(nextDate));
    if (
      nextDate.getMonth() !== visibleMonth.getMonth() ||
      nextDate.getFullYear() !== visibleMonth.getFullYear()
    ) {
      setVisibleMonth(firstOfMonth(nextDate));
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="control flex items-center justify-between text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={calendarId}
        aria-required={required}
        disabled={disabled}
        onClick={() => {
          if (open) setOpen(false);
          else openCalendar();
        }}
        onKeyDown={(event) => {
          if (
            !open &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            openCalendar();
          }
        }}
      >
        <span>{valueFormatter.format(selectedDate)}</span>
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={calendarId}
          role="dialog"
          aria-modal="false"
          aria-label="Escolher data"
          className="brutal-shadow absolute right-0 z-[70] mt-2 w-[min(20rem,calc(100vw-3rem))] border-2 border-foreground bg-popover p-3 text-popover-foreground"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center border-2 border-foreground bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Mês anterior"
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <h3 className="font-bold capitalize">
              {monthFormatter.format(visibleMonth)}
            </h3>
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center border-2 border-foreground bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Próximo mês"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div role="grid" aria-label={monthFormatter.format(visibleMonth)}>
            <div role="row" className="grid grid-cols-7">
              {weekDays.map(([short, full]) => (
                <div
                  key={full}
                  role="columnheader"
                  aria-label={full}
                  className="flex h-8 items-center justify-center text-xs font-bold text-muted-foreground"
                >
                  {short}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays(visibleMonth).map((date) => {
                const dateKey = localDateKey(date);
                const selected = dateKey === value;
                const inMonth = date.getMonth() === visibleMonth.getMonth();
                return (
                  <button
                    ref={(element) => {
                      if (element) dayRefs.current.set(dateKey, element);
                      else dayRefs.current.delete(dateKey);
                    }}
                    key={dateKey}
                    type="button"
                    role="gridcell"
                    tabIndex={dateKey === focusedDateKey ? 0 : -1}
                    aria-label={accessibleDateFormatter.format(date)}
                    aria-selected={selected}
                    aria-current={dateKey === today ? "date" : undefined}
                    className={cn(
                      "relative flex aspect-square cursor-pointer items-center justify-center border border-transparent text-sm font-semibold focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !inMonth && "text-muted-foreground opacity-55",
                      !selected && "hover:border-foreground hover:bg-accent",
                      selected &&
                        "border-2 border-foreground bg-primary text-primary-foreground",
                      dateKey === today &&
                        !selected &&
                        "after:absolute after:bottom-1 after:size-1 after:bg-destructive",
                    )}
                    onClick={() => select(date)}
                    onKeyDown={(event) => {
                      const offsets: Record<string, number> = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                      };
                      const offset = offsets[event.key];
                      if (offset !== undefined) {
                        event.preventDefault();
                        moveFocus(date, offset);
                      }
                      if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                        select(date);
                      }
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="mt-3 h-8 w-full cursor-pointer border-2 border-foreground bg-background text-xs font-bold uppercase tracking-wide hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => select(new Date())}
          >
            Hoje
          </button>
        </div>
      )}
    </div>
  );
}

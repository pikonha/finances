import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, LoaderCircle, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
};

type CategorySelectProps = {
  categories: CategoryOption[];
  value: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<string>;
};

export function CategorySelect({
  categories,
  value,
  onChange,
  onCreate,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdCategories, setCreatedCategories] = useState<CategoryOption[]>(
    []
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const options = useMemo(() => {
    const byId = new Map(
      [...createdCategories, ...categories].map((category) => [
        category.id,
        category,
      ])
    );
    return [...byId.values()];
  }, [categories, createdCategories]);

  const normalizedQuery = query.trim();
  const exactMatch = options.find(
    (category) =>
      category.name.localeCompare(normalizedQuery, undefined, {
        sensitivity: "accent",
      }) === 0
  );
  const filteredCategories = options.filter((category) =>
    category.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  const selectableOptions = [
    ...(!normalizedQuery ? [{ id: "", name: "Nenhuma" }] : []),
    ...filteredCategories,
  ];
  const selectedCategory = options.find((category) => category.id === value);
  const activeOption = selectableOptions[activeIndex];
  const optionId = (id: string) =>
    `${listboxId}-option-${id || "none"}`;

  const openDropdown = () => {
    const selectedIndex = selectableOptions.findIndex(
      (option) => option.id === value
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setError("");
  };

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setError("");
  };

  const create = async () => {
    if (!normalizedQuery || isSaving) return;
    if (exactMatch) {
      select(exactMatch.id);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const id = await onCreate(normalizedQuery);
      setCreatedCategories((current) => [
        ...current.filter((category) => category.id !== id),
        { id, name: normalizedQuery },
      ]);
      onChange(id);
      setOpen(false);
      setQuery("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a categoria"
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, isSaving]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (
          open &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          close();
        }
      }}
    >
      <button
        type="button"
        className={cn(
          "control flex items-center justify-between gap-3 text-left",
          open && "-translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0_0_var(--foreground)]"
        )}
        aria-label={`Categoria: ${selectedCategory?.name ?? "Nenhuma"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? close() : openDropdown())}
        onKeyDown={(event) => {
          if (
            !open &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            openDropdown();
          }
        }}
      >
        <span className={cn("truncate", !selectedCategory && "text-muted-foreground")}>
          {selectedCategory?.name ?? "Nenhuma"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="brutal-shadow absolute z-50 mt-1 w-full border-2 sm:min-w-64 border-foreground bg-popover text-popover-foreground">
          <div className="relative border-b-2 border-foreground">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchRef}
              aria-label="Buscar ou criar categoria"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={open}
              aria-activedescendant={
                activeOption ? optionId(activeOption.id) : undefined
              }
              className="h-11 w-full bg-transparent pl-10 pr-3 text-sm font-medium outline-none placeholder:text-muted-foreground"
              maxLength={100}
              placeholder="Buscar ou criar…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                }
                if (event.key === "ArrowDown" && selectableOptions.length) {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    Math.min(current + 1, selectableOptions.length - 1)
                  );
                }
                if (event.key === "ArrowUp" && selectableOptions.length) {
                  event.preventDefault();
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (
                  event.key === " " &&
                  activeOption &&
                  !normalizedQuery
                ) {
                  event.preventDefault();
                  select(activeOption.id);
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (activeOption) select(activeOption.id);
                  else if (exactMatch) select(exactMatch.id);
                  else void create();
                }
              }}
            />
          </div>

          <div id={listboxId} role="listbox" aria-label="Categorias" className="max-h-56 overflow-y-auto p-1">
            {!normalizedQuery && (
              <CategoryOptionButton
                id={optionId("")}
                active={activeOption?.id === ""}
                selected={!value}
                label="Nenhuma"
                onClick={() => select("")}
              />
            )}
            {filteredCategories.map((category) => (
              <CategoryOptionButton
                key={category.id}
                id={optionId(category.id)}
                active={activeOption?.id === category.id}
                selected={category.id === value}
                label={category.name}
                onClick={() => select(category.id)}
              />
            ))}
            {normalizedQuery && filteredCategories.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma categoria encontrada
              </p>
            )}
          </div>

          {normalizedQuery && !exactMatch && (
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 border-t-2 border-foreground bg-primary px-3 py-2 text-left text-sm font-bold text-primary-foreground outline-none hover:bg-accent focus-visible:bg-accent disabled:cursor-wait disabled:opacity-60"
              disabled={isSaving}
              tabIndex={-1}
              onClick={() => void create()}
            >
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span className="truncate">
                {isSaving ? "Criando" : "Criar"} “{normalizedQuery}”
              </span>
            </button>
          )}

          {error && (
            <p role="alert" className="border-t-2 border-foreground bg-background px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryOptionButton({
  id,
  active,
  label,
  selected,
  onClick,
}: {
  id: string;
  active: boolean;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={cn(
        "flex min-h-9 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      {selected && <Check aria-hidden="true" className="size-4 shrink-0" />}
    </button>
  );
}

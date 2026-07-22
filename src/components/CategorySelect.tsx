import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const CREATE_CATEGORY_VALUE = "__create_category__";

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
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const cancel = () => {
    setIsCreating(false);
    setName("");
    setError("");
  };

  const create = async () => {
    const normalizedName = name.trim();
    if (!normalizedName || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      const id = await onCreate(normalizedName);
      cancel();
      onChange(id);
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

  return (
    <div className="space-y-2">
      <select
        aria-label="Categoria"
        className="control"
        value={isCreating ? CREATE_CATEGORY_VALUE : value}
        onChange={(event) => {
          if (event.target.value === CREATE_CATEGORY_VALUE) {
            setIsCreating(true);
            setError("");
            return;
          }
          cancel();
          onChange(event.target.value);
        }}
      >
        <option value="">Nenhuma</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        <option value={CREATE_CATEGORY_VALUE}>＋ Criar categoria…</option>
      </select>
      {isCreating && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
          <div className="flex gap-2">
            <Input
              aria-label="Nome da nova categoria"
              autoFocus
              maxLength={100}
              placeholder="Nome da categoria"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void create();
                }
                if (event.key === "Escape") cancel();
              }}
            />
            <Button
              type="button"
              size="icon"
              aria-label="Criar categoria"
              disabled={!name.trim() || isSaving}
              onClick={() => void create()}
            >
              {isSaving ? (
                <Plus className="size-4 animate-pulse" />
              ) : (
                <Check className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Cancelar criação de categoria"
              disabled={isSaving}
              onClick={cancel}
            >
              <X className="size-4" />
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

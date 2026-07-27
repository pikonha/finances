import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-flex size-6 shrink-0">
      <input
        type="checkbox"
        className={cn(
          "peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center border-2 border-foreground bg-background transition-[background-color,box-shadow,transform] duration-100 peer-checked:-translate-x-0.5 peer-checked:-translate-y-0.5 peer-checked:bg-primary peer-checked:shadow-[3px_3px_0_0_var(--shadow)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring peer-disabled:opacity-55 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100"
      >
        <Check className="size-4 stroke-[4]" />
      </span>
    </span>
  );
}

export { Checkbox };

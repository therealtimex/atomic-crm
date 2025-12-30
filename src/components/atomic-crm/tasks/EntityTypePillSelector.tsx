import { useWatch, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const ENTITY_TYPES = [
  { value: "none", label: "None" },
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
] as const;

export const EntityTypePillSelector = () => {
  const entityType = useWatch({ name: "entity_type" });
  const { setValue } = useFormContext();

  return (
    <div className="col-span-2 flex items-center gap-3">
      <Label className="text-sm font-medium shrink-0">Related To</Label>
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            role="radio"
            aria-checked={entityType === type.value}
            aria-label={`Link to ${type.label}`}
            onClick={() => setValue("entity_type", type.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              entityType === type.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

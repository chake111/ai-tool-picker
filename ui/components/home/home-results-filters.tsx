import { cn } from "@/lib/utils"

type HomeResultsFiltersProps<TOption extends string> = {
  options: readonly TOption[]
  activeOption: TOption
  getLabel: (option: TOption) => string
  onSelect: (option: TOption) => void
}

export function HomeResultsFilters<TOption extends string>({ options, activeOption, getLabel, onSelect }: HomeResultsFiltersProps<TOption>) {
  return (
    <div className="flex flex-wrap justify-end gap-2" role="group" aria-label="结果筛选器">
      {options.map((option) => {
        const isActive = activeOption === option
        return (
          <button
            key={option}
            type="button"
            role={option === options[0] ? "switch" : "checkbox"}
            aria-checked={isActive}
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-all sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70 focus-visible:outline-offset-2",
              isActive
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {getLabel(option)}
          </button>
        )
      })}
    </div>
  )
}

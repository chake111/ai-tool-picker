import { Button } from "@/components/ui/button"

type HomeResultsFiltersProps<TOption extends string> = {
  options: readonly TOption[]
  activeOption: TOption
  getLabel: (option: TOption) => string
  onSelect: (option: TOption) => void
}

export function HomeResultsFilters<TOption extends string>({ options, activeOption, getLabel, onSelect }: HomeResultsFiltersProps<TOption>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button key={option} type="button" size="sm" variant={activeOption === option ? "default" : "outline"} onClick={() => onSelect(option)}>
          {getLabel(option)}
        </Button>
      ))}
    </div>
  )
}

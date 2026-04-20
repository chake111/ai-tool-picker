import { Button } from "@/components/ui/button"

type PricingValue = "any" | "free" | "paid"

type PreferencesPricingProps = {
  title: string
  pricing: PricingValue
  getLabel: (pricing: PricingValue) => string
  onChange: (pricing: PricingValue) => void
}

export function PreferencesPricing({ title, pricing, getLabel, onChange }: PreferencesPricingProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {(["any", "free", "paid"] as const).map((option) => (
          <Button key={option} variant={pricing === option ? "default" : "outline"} size="sm" onClick={() => onChange(option)}>
            {getLabel(option)}
          </Button>
        ))}
      </div>
    </div>
  )
}

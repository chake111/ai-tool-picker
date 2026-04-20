"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Sparkles } from "lucide-react"

interface SearchInputProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder: string
  submitLabel: string
  loadingLabel: string
  historySuggestions?: string[]
  historyTitle?: string
  onSuggestionClick?: (query: string) => void
  helperText?: string
  sampleQueries?: string[]
  sampleTitle?: string
  onSampleQueryClick?: (query: string) => void
  focusSignal?: number
}

export function SearchInput({
  query,
  onQueryChange,
  onSearch,
  isLoading = false,
  placeholder,
  submitLabel,
  loadingLabel,
  historySuggestions = [],
  historyTitle = "",
  onSuggestionClick,
  helperText = "",
  sampleQueries = [],
  sampleTitle = "",
  onSampleQueryClick,
  focusSignal = 0,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const hasSuggestions = historySuggestions.length > 0
  const visibleSuggestions = useMemo(() => historySuggestions.slice(0, 5), [historySuggestions])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (focusSignal <= 0) return
    inputRef.current?.focus()
  }, [focusSignal])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    onSuggestionClick?.(suggestion)
    setIsFocused(false)
  }

  const handleSampleQuerySelect = (sampleQuery: string) => {
    onSampleQueryClick?.(sampleQuery)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
          />
          {isFocused && hasSuggestions && (
            <div className="absolute top-[calc(100%+8px)] z-20 w-full rounded-xl border border-border/70 bg-background p-2 shadow-lg">
              {historyTitle && <p className="px-2 pb-1 text-xs text-muted-foreground">{historyTitle}</p>}
              <div className="flex flex-col gap-1">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleSuggestionSelect(suggestion)
                    }}
                    className="rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-14 w-full px-6 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:translate-y-px active:bg-primary/95 focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-auto"
        >
          {isLoading ? (
            <>
              <Sparkles className="h-5 w-5 animate-spin mr-2" />
              {loadingLabel}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
      {helperText && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{helperText}</p>}
      {sampleQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {sampleTitle && <span className="text-xs text-muted-foreground sm:text-sm">{sampleTitle}</span>}
          {sampleQueries.map((sampleQuery) => (
            <button
              key={sampleQuery}
              type="button"
              onClick={() => handleSampleQuerySelect(sampleQuery)}
              className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted sm:text-sm"
            >
              {sampleQuery}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

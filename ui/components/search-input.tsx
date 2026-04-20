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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    onSuggestionClick?.(suggestion)
    setIsFocused(false)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center gap-3">
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
          className="h-14 px-6 rounded-xl text-base font-medium"
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
    </form>
  )
}

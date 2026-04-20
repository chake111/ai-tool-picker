"use client"

import { useEffect, useRef } from "react"
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
}

export function SearchInput({
  query,
  onQueryChange,
  onSearch,
  isLoading = false,
  placeholder,
  submitLabel,
  loadingLabel,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
          />
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
    </form>
  )
}

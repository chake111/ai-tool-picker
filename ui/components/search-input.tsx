"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Sparkles } from "lucide-react"

interface SearchInputProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchInput({ query, onQueryChange, onSearch, isLoading = false }: SearchInputProps) {
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
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="我想做PPT"
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-14 px-6 rounded-xl text-base font-medium"
        >
          {isLoading ? (
            <Sparkles className="h-5 w-5 animate-pulse" />
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              帮我选
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Search, Sparkles } from "lucide-react"

interface SearchInputProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchInput({ query, onQueryChange, onSearch, isLoading = false }: SearchInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
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
          disabled={isLoading || !query.trim()}
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

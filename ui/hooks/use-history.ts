"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export const HISTORY_STORAGE_KEY = "ai_tool_picker_search_history"

export type HistoryEntry = {
  query: string
  timestamp: number
}

type UseHistoryOptions = {
  storageKey?: string
  pageSize?: number
  maxSize?: number
}

const DEFAULT_PAGE_SIZE = 6
const DEFAULT_MAX_SIZE = 50

const sanitizeEntry = (input: unknown): HistoryEntry | null => {
  if (typeof input === "string") {
    const query = input.trim()
    return query ? { query, timestamp: Date.now() } : null
  }
  if (!input || typeof input !== "object") return null

  const candidate = input as Partial<HistoryEntry>
  const query = typeof candidate.query === "string" ? candidate.query.trim() : ""
  if (!query) return null

  const timestamp = typeof candidate.timestamp === "number" && Number.isFinite(candidate.timestamp) ? candidate.timestamp : Date.now()
  return { query, timestamp }
}

export function useHistory(options: UseHistoryOptions = {}) {
  const {
    storageKey = HISTORY_STORAGE_KEY,
    pageSize = DEFAULT_PAGE_SIZE,
    maxSize = DEFAULT_MAX_SIZE,
  } = options

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")
      if (!Array.isArray(parsed)) return
      const sanitized = parsed
        .map((item) => sanitizeEntry(item))
        .filter((item): item is HistoryEntry => Boolean(item))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxSize)
      setEntries(sanitized)
    } catch {
      setEntries([])
    }
  }, [maxSize, storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(entries))
  }, [entries, storageKey])

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages))
  }, [totalPages])

  const pagedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return entries.slice(start, start + pageSize)
  }, [currentPage, entries, pageSize])

  const suggestions = useMemo(() => entries.map((entry) => entry.query), [entries])

  const addEntry = useCallback(
    (queryInput: string) => {
      const query = queryInput.trim()
      if (!query) return

      setEntries((prev) => {
        const withoutDup = prev.filter((entry) => entry.query.toLowerCase() !== query.toLowerCase())
        return [{ query, timestamp: Date.now() }, ...withoutDup].slice(0, maxSize)
      })
      setCurrentPage(1)
    },
    [maxSize],
  )

  const updateEntry = useCallback((fromQuery: string, toQuery: string) => {
    const nextQuery = toQuery.trim()
    if (!nextQuery) return

    setEntries((prev) =>
      prev
        .map((entry) => (entry.query === fromQuery ? { query: nextQuery, timestamp: Date.now() } : entry))
        .sort((a, b) => b.timestamp - a.timestamp),
    )
  }, [])

  const removeEntry = useCallback((query: string) => {
    setEntries((prev) => prev.filter((entry) => entry.query !== query))
  }, [])

  const clearEntries = useCallback(() => {
    setEntries([])
    setCurrentPage(1)
  }, [])

  return {
    entries,
    suggestions,
    pagedEntries,
    currentPage,
    totalPages,
    setCurrentPage,
    addEntry,
    updateEntry,
    removeEntry,
    clearEntries,
  }
}

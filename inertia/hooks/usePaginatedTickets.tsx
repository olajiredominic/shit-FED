// hooks/usePaginatedTickets.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import Ticket from '#models/ticket'

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

interface UsePaginatedTicketsOptions {
  initialTickets: Ticket[]
  meta: PaginationMeta
  initialSearch: string
}

interface ParsedSearch {
  text: string
  after?: string
  before?: string
  reporter?: string
}

function parseSearchQuery(query: string): ParsedSearch {
  const result: ParsedSearch = { text: '' }
  const parts: string[] = []

  // Split by spaces but keep quoted strings together
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []

  tokens.forEach((token) => {
    const lowerToken = token.toLowerCase()

    if (lowerToken.startsWith('after:')) {
      const dateStr = token.substring(6).replace(/"/g, '')
      result.after = dateStr
    } else if (lowerToken.startsWith('before:')) {
      const dateStr = token.substring(7).replace(/"/g, '')
      result.before = dateStr
    } else if (lowerToken.startsWith('reporter:')) {
      result.reporter = token.substring(9).replace(/"/g, '') // Remove quotes if present
    } else {
      parts.push(token)
    }
  })

  result.text = parts.join(' ').trim()
  return result
}

export function usePaginatedTickets({ initialTickets, meta, initialSearch }: UsePaginatedTicketsOptions) {
  const { url } = usePage()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [isLoading, setIsLoading] = useState(false)
  const pageCache = useRef<Record<number, Ticket[]>>({ [meta.currentPage]: initialTickets })
  const currentPage = meta.currentPage
  const hasMorePages = currentPage < meta.lastPage

  // Load more function
  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1
    if (isLoading || !hasMorePages) return

    setIsLoading(true)
    const baseUrl = new URL(url, window.location.origin)
    baseUrl.searchParams.set('page', nextPage.toString())
    if (search) {
      // Parse current search to maintain filters during pagination
      const parsedSearch = parseSearchQuery(search)
      if (parsedSearch.text) {
        baseUrl.searchParams.set('search', parsedSearch.text)
      }
      if (parsedSearch.after) {
        baseUrl.searchParams.set('after', parsedSearch.after)
      }
      if (parsedSearch.before) {
        baseUrl.searchParams.set('before', parsedSearch.before)
      }
      if (parsedSearch.reporter) {
        baseUrl.searchParams.set('reporter', parsedSearch.reporter)
      }
    }

    router.visit(baseUrl.toString(), {
      preserveState: true,
      preserveScroll: true,
      only: ['tickets'],
      onFinish: () => setIsLoading(false),
      onSuccess: ({ props }) => {
        const newTickets = (props as any).tickets.data
        pageCache.current[nextPage] = newTickets
        setAllTickets((prev) => {
          const ids = new Set(prev.map(t => t.id))
          return [...prev, ...newTickets.filter((t: Ticket) => !ids.has(t.id))]
        })
      },
    })
  }, [currentPage, isLoading, hasMorePages, url, search])

  const handleSearch = useCallback(
    (value: string) => {

      setSearch(value)

      const parsedSearch = parseSearchQuery(value)
      const baseUrl = new URL(url, window.location.origin)

      // Set search parameters based on parsed query
      if (parsedSearch.text) {
        baseUrl.searchParams.set('search', parsedSearch.text)
      } else {
        baseUrl.searchParams.delete('search')
      }

      if (parsedSearch.after) {
        baseUrl.searchParams.set('after', parsedSearch.after)
      } else {
        baseUrl.searchParams.delete('after')
      }

      if (parsedSearch.before) {
        baseUrl.searchParams.set('before', parsedSearch.before)
      } else {
        baseUrl.searchParams.delete('before')
      }

      if (parsedSearch.reporter) {
        baseUrl.searchParams.set('reporter', parsedSearch.reporter)
      } else {
        baseUrl.searchParams.delete('reporter')
      }

      baseUrl.searchParams.set('page', '1') // Reset to first page on new search
      setAllTickets([]) // Clear tickets on new search

      router.visit(baseUrl.toString(), {
        preserveState: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
        onSuccess: ({ props }) => {
          const newTickets = (props as any).tickets.data
          setAllTickets((prev) => {
            const ids = new Set(prev.map(t => t.id))
            return [...prev, ...newTickets.filter((t: Ticket) => !ids.has(t.id))]
          })
        },
      })
    },
    [url]
  )

  // On initial load or refresh
  useEffect(() => {
    const all = Object.values(pageCache.current).flat()
    const ids = new Set<string>()
    const deduped = all.filter(t => {
      if (ids.has(t.id)) return false
      ids.add(t.id)
      return true
    })
    setAllTickets(deduped)
  }, [meta.currentPage])

  return {
    allTickets,
    isLoading,
    loadMore,
    search,
    handleSearch,
    hasMorePages,
  }
}

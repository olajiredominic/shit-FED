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
  search: string
}

export function usePaginatedTickets({ initialTickets, meta, search }: UsePaginatedTicketsOptions) {
  const { url } = usePage()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pageCache = useRef<Record<number, Ticket[]>>({ [meta.currentPage]: initialTickets })
  const currentPage = meta.currentPage
  const hasMorePages = currentPage < meta.lastPage

  console.log({ currentPage })

  // Load more function
  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1
    if (isLoading || !hasMorePages || pageCache.current[nextPage]) return

    setIsLoading(true)
    const baseUrl = new URL(url, window.location.origin)
    baseUrl.searchParams.set('page', nextPage.toString())
    if (search) baseUrl.searchParams.set('search', search)

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
    hasMorePages,
  }
}

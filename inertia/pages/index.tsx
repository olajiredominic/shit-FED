import { useState, useCallback, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { useIntersectionObserver } from '~/hooks/useInterSectionObserver'
import { usePaginatedTickets } from '~/hooks/usePaginatedTickets'
import Ticket from '#models/ticket'
import EmptyState from '~/components/EmptyState'
import SearchHelp from '~/components/SearchHelp'
import TicketsList from '~/components/TicketList'
import useBackToTop from '~/hooks/useBackToTop'
import Header from '~/components/Header'
interface AppProps {
  search?: string,
  after?: string,
  before?: string,
  reporter?: string,
  tickets: {
    data: Ticket[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  },
  errors?: { after?: string; before?: string; labels?: string }
}


export default function App({
  tickets,
  search: initialSearch = '',
  after: initialAfter = '',
  before: initialBefore = '',
  reporter: initialReporter = '',
  errors = {},
}: AppProps) {
  const [hiddenTickets, setHiddenTickets] = useState<string[]>([])
  const [showSearchHelp, setShowSearchHelp] = useState(false)

  const handleHide = useCallback((id: string) => {
    setHiddenTickets((prev) => [...prev, id])
  }, [])

  const handleRestore = useCallback(() => {
    setHiddenTickets([])
  }, [])

  const {
    allTickets,
    isLoading,
    loadMore,
    search,
    handleSearch,
    hasMorePages,
  } = usePaginatedTickets({
    initialTickets: tickets.data,
    meta: tickets.meta,
    initialSearch: `${initialAfter ? `after:${initialAfter} ` : ''}${initialBefore ? `before:${initialBefore} ` : ''}${initialReporter ? `reporter:${initialReporter} ` : ''} ${initialSearch}`.trim()
  });

  // Intersection Observer
  const { ref: sentinelRef } = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasMorePages && !isLoading,
    rootMargin: '100px',
    threshold: 0.1,
  })

  const ticketData = allTickets.filter((t) => !hiddenTickets.includes(t.id))

  const errorMessages = Object.values(errors).filter(Boolean).join(' ')

  const { showBackToTop, scrollToTop } = useBackToTop(400)

  return (
    <>
      <Head title="Security Issues" />

      <div className="min-h-screen bg-sand-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <main>
            <h1 className="text-3xl font-bold text-sand-12 mb-8">Security Issues List</h1>

            <Header
              search={search}
              handleSearch={handleSearch}
              errorMessages={errorMessages}
              showSearchHelp={showSearchHelp}
              setShowSearchHelp={setShowSearchHelp}
            />

            {tickets && (
              <div className="flex items-center space-x-2 text-sm text-sand-11 mb-4">
                <p>
                  Showing {ticketData.length} of {tickets.meta.total} issues
                </p>
                {hiddenTickets.length > 0 && (
                  <div className="italic">
                    (
                    <span>
                      {hiddenTickets.length} hidden ticket{hiddenTickets.length > 1 && 's'} -{' '}
                    </span>
                    <button
                      onClick={handleRestore}
                      className="pl-1 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium italic"
                    >
                      restore
                    </button>
                    )
                  </div>
                )}
              </div>
            )}
            {ticketData.length > 0 ? (
              <>
                <TicketsList tickets={ticketData} onHide={handleHide} />
                {/* Intersection observer sentinel */}
                {hasMorePages && <div ref={sentinelRef} className="h-10" />}

                {isLoading && (
                  <div className="text-center py-4">
                    <p className="text-sand-11">Loading more issues...</p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState hasSearch={Boolean(search)} />
            )}
            {showBackToTop && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                aria-label="Back to top"
              >
                ↑
              </button>
            )}
          </main>
        </div>
      </div>
    </>
  )
}


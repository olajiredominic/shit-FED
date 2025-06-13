import { useState, useCallback, useRef } from 'react'
import { Head } from '@inertiajs/react'
import { useTruncationCheck } from '~/hooks/useTruncationCheck'
import { useIntersectionObserver } from '~/hooks/useInterSectionObserver'
import { usePaginatedTickets } from '~/hooks/usePaginatedTickets'
import Ticket from '#models/ticket'

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
  }
}


interface TicketItemProps {
  ticket: Ticket
  onHide: (id: string) => void
}

function TicketItem({ ticket, onHide }: TicketItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const showButton = useTruncationCheck(contentRef, ticket.content)

  return (
    <li
      key={ticket.id}
      className="relative bg-white border border-sand-7 rounded-lg p-6 hover:border-sand-8 hover:shadow-sm transition duration-200 group"
    >
      <button
        onClick={() => onHide(ticket.id)}
        className="absolute top-2 right-2 px-2 py-1 text-sand-12 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        Hide
      </button>
      <h5 className="text-lg font-semibold text-sand-12 mb-2">{ticket.title}</h5>
      <div className="mb-4">
        <div
          ref={contentRef}
          className={`text-sand-11 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
        >
          {ticket.content}
        </div>

        {showButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-blue-500 hover:text-blue-700 font-sm transition-colors duration-200"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      <footer>
        <div className="flex flex-col-reverse md:flex-row justify-between mt-3">
          <div className="text-sm text-sand-10 mt-2 md:mt-0">
            By {ticket.userEmail} | {formatDate(ticket.creationTime)}
          </div>
          <div>
            {ticket.labels?.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-[#daeffd] text-xs font-medium px-2 py-1 rounded-md border border-[#C0E4FD] mr-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </li>
  )
}

function TicketsList({ tickets, onHide }: { tickets: Ticket[]; onHide: (id: string) => void }) {
  return (
    <ul className="space-y-4">
      {tickets.map((ticket) => (
        <TicketItem key={ticket.id} ticket={ticket} onHide={onHide} />
      ))}
    </ul>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="text-lg text-sand-11">
        {hasSearch ? 'No issues found matching your search.' : 'No security issues found.'}
      </div>
    </div>
  )
}

function SearchHelp() {
  return (
    <div className="mt-2 text-xs text-sand-10">
      <p>
        <strong>Search tips:</strong> Use{' '}
        <code className="bg-sand-3 px-1 rounded">after:DD/MM/YYYY</code>,{' '}
        <code className="bg-sand-3 px-1 rounded">before:DD/MM/YYYY</code>, or{' '}
        <code className="bg-sand-3 px-1 rounded">reporter:email@domain.com</code>
        <code className="bg-sand-3 px-1 rounded">labels:tag1,tag2</code>
      </p>
      <p className="mt-1">
        <strong>Example:</strong>{' '}
        <code className="bg-sand-3 px-1 rounded">after:27/09/2019 xss</code> - finds XSS issues
        created after 27 Sep 2019
      </p>
      <p className="mt-1">Add commentMore actions
        <code className="bg-sand-3 px-1 rounded">label:critical,security</code> - finds issues with
        critical OR security labels
      </p>
    </div >
  )
}

export default function App({
  tickets,
  search: initialSearch = '',
  after: initialAfter = '',
  before: initialBefore = '',
  reporter: initialReporter = '',
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

  return (
    <>
      <Head title="Security Issues" />

      <div className="min-h-screen bg-sand-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <main>
            <h1 className="text-3xl font-bold text-sand-12 mb-8">Security Issues List</h1>

            <header className="mb-6">
              <div className="flex">
                <input
                  type="search"
                  placeholder="Search issues..."
                  className="w-full max-w-2xl px-4 py-2 border border-sand-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onChange={(e) => handleSearch(e.target.value)}
                  value={search}
                  onFocus={() => setShowSearchHelp(true)}
                  onBlur={() => setTimeout(() => setShowSearchHelp(false), 200)}
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sand-10 hover:text-sand-12 text-sm bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                  onClick={() => setShowSearchHelp(!showSearchHelp)}
                  type="button"
                >
                  ?
                </button>
              </div>
              {showSearchHelp && <SearchHelp />}
            </header>

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
          </main>
        </div>
      </div>
    </>
  )
}

function formatDate(unixTimestemp: number) {
  return new Date(unixTimestemp)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')
}

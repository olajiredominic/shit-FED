import { useState, useCallback, useRef } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { useTruncationCheck } from '~/hooks/useTruncationCheck'

export type Ticket = {
  id: string
  title: string
  content: string
  creationTime: number
  userEmail: string
  labels?: string[]
}

interface AppProps {
  search?: string,
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

export default function App({ tickets, search: initialSearch = '' }: AppProps) {
  const [search, setSearch] = useState(initialSearch)
  const [hiddenTickets, setHiddenTickets] = useState<string[]>([])

  const { url } = usePage()

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      // Parse and modify the URL from usePage().url
      const baseUrl = new URL(url, window.location.origin) // Ensure absolute URL
      if (value) {
        baseUrl.searchParams.set('search', value)
      } else {
        baseUrl.searchParams.delete('search')
      }
      // Trigger Inertia visit with the new URL
      router.visit(baseUrl.toString(), { preserveState: true })
    },
    [url]
  )

  const handleHide = useCallback((id: string) => {
    setHiddenTickets((prev) => [...prev, id])
  }, [])

  const handleRestore = useCallback(() => {
    setHiddenTickets([])
  }, [])

  const ticketData =
    tickets?.data
      .filter((t) => !hiddenTickets.includes(t.id))
    || []

  return (
    <>
      <Head title="Security Issues" />

      <div className="min-h-screen bg-sand-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <main>
            <h1 className="text-3xl font-bold text-sand-12 mb-8">Security Issues List</h1>

            <header className="mb-6">
              <input
                type="search"
                placeholder="Search issues..."
                className="w-full max-w-md px-4 py-2 border border-sand-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => handleSearch(e.target.value)}
                value={search}
              />
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
              <TicketsList tickets={ticketData} onHide={handleHide} />
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

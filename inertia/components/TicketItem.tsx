import Ticket from "#models/ticket"
import { useRef, useState } from "react"
import { useTruncationCheck } from "~/hooks/useTruncationCheck"
import { formatDate } from "~/utils/date_helper"
import Label from "./Label"

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
          <div>{ticket.labels?.map((tag) => <Label key={tag} label={tag} />)}</div>
        </div>
      </footer>
    </li>
  )
}

export default TicketItem;
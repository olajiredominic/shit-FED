import Ticket from "#models/ticket";
import TicketItem from "./TicketItem";

function TicketsList({ tickets, onHide }: { tickets: Ticket[]; onHide: (id: string) => void }) {
  return (
    <ul className="space-y-4">
      {tickets.map((ticket) => (
        <TicketItem key={ticket.id} ticket={ticket} onHide={onHide} />
      ))}
    </ul>
  )
}

export default TicketsList;

import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'

export default class TicketsController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const pageSize = 20

    let query = Ticket.query()

    const tickets = await query.orderBy('creation_time', 'desc').paginate(page, pageSize)

    return inertia.render('index', {
      tickets: tickets.toJSON(),
    })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'

export default class TicketsController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const pageSize = request.input('pageSize', 20)
    const search = request.input('search', '').trim()

    let query = Ticket.query()
    if (search) {
      query = query.whereRaw('LOWER(title) LIKE ?', [`%${search.toLowerCase()}%`])
    }

    const tickets = await query.orderBy('creation_time', 'desc').paginate(page, pageSize)

    return inertia.render('index', {
      tickets: tickets.toJSON(),
      search,
      page,
      pageSize,
    })
  }
}

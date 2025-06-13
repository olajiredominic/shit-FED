import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import { DateTime } from 'luxon'

export default class TicketsController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const pageSize = request.input('pageSize', 20)
    const search = request.input('search', '').trim()

    const after = request.input('after', '')
    const before = request.input('before', '')
    const reporter = request.input('reporter', '')

    let query = Ticket.query()
    if (search) {
      query = query.whereRaw('LOWER(title) LIKE ?', [`%${search.toLowerCase()}%`])
    }
    // Date filtering
    if (after) {
      const afterDate = this.parseDate(after)
      if (afterDate) {
        // Use end of day to include all tickets from the "after" date
        query.where('creation_time', '>', afterDate.endOf('day').toUnixInteger() * 1000)
      }
    }

    if (before) {
      const beforeDate = this.parseDate(before)
      if (beforeDate) {
        // Use end of day to include all tickets up to the "before" date
        query.where('creation_time', '<', beforeDate.startOf('day').toUnixInteger() * 1000)
      }
    }

    // Reporter filtering
    if (reporter) {
      query.whereRaw('LOWER(user_email) LIKE ?', [`%${reporter.toLowerCase()}%`])
    }

    const tickets = await query.orderBy('creation_time', 'desc').paginate(page, pageSize)

    return inertia.render('index', {
      tickets: tickets.toJSON(),
      search,
      after,
      before,
      reporter,
      page,
      pageSize,
    })
  }

  private parseDate(dateStr: string): DateTime | null {
    // Parse YYYY-MM-DD format (e.g., 2025-06-12)
    const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'UTC' })
    if (date.isValid) {
      return date
    }
    // Fallback: try DD/MM/YYYY for backward compatibility or user input
    const fallbackDate = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: 'UTC' })
    if (fallbackDate.isValid) {
      return fallbackDate
    }
    return null
  }
}

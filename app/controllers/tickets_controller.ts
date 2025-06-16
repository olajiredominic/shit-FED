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
    const labels = request.input('labels', '')

    const errors: Record<string, string> = {}

    let query = Ticket.query()

    if (search) {
      query.whereRaw('LOWER(title) LIKE ?', [`%${search.toLowerCase()}%`])
    }

    // Date filtering
    const afterDate = this.parseDate(after)
    if (after && !afterDate) {
      errors.after = 'Invalid "after" date format. Use DD/MM/YYYY or YYYY-MM-DD.'
    } else if (afterDate) {
      query.where('creation_time', '>', afterDate.endOf('day').toUnixInteger() * 1000)
    }

    const beforeDate = this.parseDate(before)
    if (before && !beforeDate) {
      errors.before = 'Invalid "before" date format. Use DD/MM/YYYY or YYYY-MM-DD.'
    } else if (beforeDate) {
      query.where('creation_time', '<', beforeDate.startOf('day').toUnixInteger() * 1000)
    }

    if (reporter && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporter)) {
      errors.reporter = 'Invalid "reporter" format. Use reporter:email@domain.com.'
    } else if (reporter) {
      query.whereRaw('LOWER(user_email) LIKE ?', [`%${reporter.toLowerCase()}%`])
    }

    const labelArray = labels
      .split(',')
      .map((label: string) => label.trim().toLowerCase())
      .filter((label: string) => label)

    if (labels && labelArray.length === 0) {
      errors.labels = 'Invalid "labels" format. Use labels:tag1,tag2'
    } else if (labelArray.length > 0) {
      const labelConditions = labelArray.map(() => 'LOWER(json_each.value) LIKE ?').join(' OR ')
      const bindings = labelArray.map((label: string) => `%${label}%`)
      query.whereRaw(
        `EXISTS (SELECT 1 FROM json_each(tickets.labels) WHERE ${labelConditions})`,
        bindings
      )
    }

    const totalTickets = await query.clone().count('* as total').first()
    const total = Number(totalTickets?.$extras.total) || 0

    const tickets = await query
      .orderBy('creation_time', 'desc')
      .limit(page * pageSize)
      .exec()

    const ticketsResponse = {
      data: tickets,
      meta: {
        total,
        perPage: pageSize,
        currentPage: page,
        lastPage: Math.ceil(total / pageSize) || 1,
      },
    }

    return inertia.render('index', {
      tickets: ticketsResponse,
      search,
      after,
      before,
      reporter,
      page,
      pageSize,
      errors,
    })
  }

  private parseDate(dateStr: string): DateTime | null {
    const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'UTC' })
    if (date.isValid) return date

    const fallbackDate = DateTime.fromFormat(dateStr, 'dd/MM/yyyy', { zone: 'UTC' })
    if (fallbackDate.isValid) return fallbackDate

    return null
  }
}

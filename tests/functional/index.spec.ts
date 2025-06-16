import TicketsController from '#controllers/tickets_controller'
import Ticket from '#models/ticket'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { PageObject } from '@adonisjs/inertia/types'

test.group('TicketsController.index', (group) => {
  group.setup(async () => {
    // Create the tickets table for testing
    await db.connection().schema.createTableIfNotExists('tickets', (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.bigint('creation_time').notNullable()
      table.string('user_email').notNullable()
      table.json('labels').defaultTo('[]')
      table.timestamps(true, true)
    })
  })

  group.teardown(async () => {
    // Clean up the table after tests
    await db.connection().schema.dropTableIfExists('tickets')
  })

  group.each.setup(async () => {
    await db.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('returns empty results with errors on invalid filters', async ({ assert }) => {
    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: '',
            after: 'invalid-date',
            before: 'wrong-format',
            reporter: 'not-an-email',
            labels: ' , ,',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    // assert.equal(response.view, 'index')
    assert.deepInclude(response.data.errors, {
      after: 'Invalid "after" date format. Use DD/MM/YYYY or YYYY-MM-DD.',
      before: 'Invalid "before" date format. Use DD/MM/YYYY or YYYY-MM-DD.',
      reporter: 'Invalid "reporter" format. Use reporter:email@domain.com.',
      labels: 'Invalid "labels" format. Use labels:tag1,tag2',
    })
    assert.equal(response.data.tickets.meta.total, 0)
  })

  test('returns filtered ticket with all fields', async ({ assert }) => {
    const creationTime = DateTime.utc().toMillis()
    const ticket = await Ticket.create({
      title: 'Login issue',
      creationTime: creationTime,
      userEmail: 'user@example.com',
      labels: ['bug', 'urgent'],
    })

    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: 'login',
            after: '',
            before: '',
            reporter: 'user@example.com',
            labels: 'bug',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    // Verify response structure
    assert.lengthOf(response.data.tickets.data, 1)
    assert.isEmpty(response.data.errors)

    const returnedTicket = response.data.tickets.data[0]

    // Verify all ticket fields are returned correctly
    assert.equal(returnedTicket.id, ticket.id)
    assert.equal(returnedTicket.title, 'Login issue')
    assert.equal(returnedTicket.creationTime, creationTime)
    assert.equal(returnedTicket.userEmail, 'user@example.com')
    assert.deepEqual(returnedTicket.labels, ['bug', 'urgent'])

    // Verify timestamps are present
    assert.exists(returnedTicket.createdAt)
    assert.exists(returnedTicket.updatedAt)

    // Verify the ticket matches all our filter criteria
    assert.include(returnedTicket.title.toLowerCase(), 'login')
    assert.equal(returnedTicket.userEmail, 'user@example.com')
    assert.include(returnedTicket.labels, 'bug')
  })

  test('filters by search term in title', async ({ assert }) => {
    await Ticket.create({
      title: 'Password reset issue',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user1@example.com',
      labels: ['bug'],
    })

    await Ticket.create({
      title: 'Login problem',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user2@example.com',
      labels: ['urgent'],
    })

    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: 'login',
            after: '',
            before: '',
            reporter: '',
            labels: '',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    assert.lengthOf(response.data.tickets.data, 1)
    assert.equal(response.data.tickets.data[0].title, 'Login problem')
  })

  test('filters by reporter email', async ({ assert }) => {
    await Ticket.create({
      title: 'Issue 1',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user1@example.com',
      labels: ['bug'],
    })

    await Ticket.create({
      title: 'Issue 2',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user2@example.com',
      labels: ['feature'],
    })

    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: '',
            after: '',
            before: '',
            reporter: 'user1@example.com',
            labels: '',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    assert.lengthOf(response.data.tickets.data, 1)
    assert.equal(response.data.tickets.data[0].userEmail, 'user1@example.com')
  })

  test('filters by labels', async ({ assert }) => {
    await Ticket.create({
      title: 'Bug ticket',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user1@example.com',
      labels: ['bug', 'critical'],
    })

    await Ticket.create({
      title: 'Feature request',
      creationTime: DateTime.utc().toMillis(),
      userEmail: 'user2@example.com',
      labels: ['feature', 'low-priority'],
    })

    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: '',
            after: '',
            before: '',
            reporter: '',
            labels: 'bug',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    assert.lengthOf(response.data.tickets.data, 1)
    assert.include(response.data.tickets.data[0].labels, 'bug')
  })

  test('filters by date range', async ({ assert }) => {
    const now = DateTime.utc()
    const yesterday = now.minus({ days: 1 })
    const tomorrow = now.plus({ days: 1 })

    await Ticket.create({
      title: 'Old ticket',
      creationTime: yesterday.toMillis(),
      userEmail: 'user1@example.com',
      labels: ['bug'],
    })

    await Ticket.create({
      title: 'New ticket',
      creationTime: tomorrow.toMillis(),
      userEmail: 'user2@example.com',
      labels: ['feature'],
    })

    const fakeCtx = {
      request: {
        input: (key: string, defaultValue?: any) => {
          const inputs: { [key: string]: string | number } = {
            page: 1,
            pageSize: 20,
            search: '',
            after: now.toFormat('dd/MM/yyyy'),
            before: '',
            reporter: '',
            labels: '',
          }
          return inputs[key] ?? defaultValue
        },
      },
      inertia: {
        render: async (view: string, data: any) => {
          return { view, data }
        },
      },
    }

    const controller = new TicketsController()
    const response = (await controller.index(fakeCtx as any)) as any

    assert.lengthOf(response.data.tickets.data, 1)
    assert.equal(response.data.tickets.data[0].title, 'New ticket')
  })
})

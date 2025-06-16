import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const isTestEnv = process.env.NODE_ENV === 'test'

const dbConfig = defineConfig({
  connection: isTestEnv ? 'sqlite_test' : 'sqlite',
  connections: {
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    sqlite_test: {
      client: 'better-sqlite3',
      connection: {
        filename: ':memory:',
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig

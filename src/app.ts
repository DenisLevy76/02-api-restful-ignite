import fastify from 'fastify'
import { transactionsRoutes } from './routes/transactions'
import fastifyCookie from '@fastify/cookie'

export const server = fastify()

server.register(fastifyCookie)
server.register(transactionsRoutes, {
  prefix: '/transactions',
})

import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import crypto from 'node:crypto'
import { checkSessionIdExist } from '../middlewares/checkSessionIdExist'

export const transactionsRoutes = async (server: FastifyInstance) => {
  server.get('/', { preHandler: [checkSessionIdExist] }, async (request) => {
    const transactions = await knex('transactions').select().where({
      session_id: request.cookies.sessionId,
    })

    return { transactions }
  })

  server.get('/:id', { preHandler: [checkSessionIdExist] }, async (request) => {
    const getTransactionsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionsParamsSchema.parse(request.params)

    const transaction = await knex('transactions')
      .select()
      .where({
        id,
        session_id: request.cookies.sessionId,
      })
      .first()

    return { transaction }
  })

  server.post('/', async (request, response) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      response.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return response.status(201).send()
  })

  server.get(
    '/summary',
    { preHandler: [checkSessionIdExist] },
    async (request) => {
      const summary = await knex('transactions')
        .sum('amount', {
          as: 'amount',
        })
        .where({
          session_id: request.cookies.sessionId,
        })
        .first()

      return { summary }
    },
  )
}

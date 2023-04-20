import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { server } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(() => {
    execSync('npm run knex -- migrate:rollback --all')
    execSync('npm run knex -- migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(server.server)
      .post('/transactions')
      .send({
        title: 'IFood',
        amount: 45,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createANewTransactionResponse = await request(server.server)
      .post('/transactions')
      .send({
        title: 'IFood',
        amount: 45,
        type: 'credit',
      })
    const cookies = createANewTransactionResponse.get('Set-Cookie')

    const getTransactionsListResponse = await request(server.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionsListResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'IFood',
        amount: 45,
      }),
    ])
  })

  it('should be able to get transaction by id', async () => {
    const createANewTransactionResponse = await request(server.server)
      .post('/transactions')
      .send({
        title: 'IFood',
        amount: 45,
        type: 'credit',
      })
    const cookies = createANewTransactionResponse.get('Set-Cookie')

    const getTransactionsListResponse = await request(server.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionsListResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'IFood',
        amount: 45,
      }),
    ])

    const transactionId = getTransactionsListResponse.body.transactions[0].id

    const getTransactionByIdResponse = await request(server.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(getTransactionByIdResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'IFood',
        amount: 45,
      }),
    )
  })

  it('should be able to get the summary of all transactions', async () => {
    const createANewTransactionResponse = await request(server.server)
      .post('/transactions')
      .send({
        title: 'Work',
        amount: 2245,
        type: 'credit',
      })
    const cookies = createANewTransactionResponse.get('Set-Cookie')

    await request(server.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'IFood',
        amount: 45,
        type: 'debit',
      })

    const getTransactionsSummaryResponse = await request(server.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionsSummaryResponse.body).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          amount: 2200,
        }),
      }),
    )
  })
})

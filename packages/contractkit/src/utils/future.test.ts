import { Future } from './future'

test('it should expose resolve/reject inmediately', async () => {
  const ep = new Future<number>()
  expect(ep.resolve).toBeDefined()
  expect(ep.reject).toBeDefined()
})

test('it SBAT resolve inmediately', async () => {
  const ep = new Future<number>()
  ep.resolve(5)
  await expect(ep.wait()).resolves.toEqual(5)
})

test('it SBAT reject inmediately', async () => {
  const ep = new Future<number>()
  const err = new Error('failed')
  ep.reject(err)
  await expect(ep.wait()).rejects.toBe(err)
})

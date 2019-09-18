import { retryAsync } from './async'

describe('retryAsync()', () => {
  test('tries once if it works', async () => {
    const mockFunction = jest.fn()
    await retryAsync(mockFunction, 2, [], 1)
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })

  test('retries n times', async () => {
    const mockFunction = jest.fn(() => {
      throw new Error('error')
    })

    try {
      await retryAsync(mockFunction, 2, [], 1)
      expect(false).toBeTruthy()
    } catch (error) {
      // should never happen
    }

    expect(mockFunction).toHaveBeenCalledTimes(3)
  })
})

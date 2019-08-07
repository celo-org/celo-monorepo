import { retryAsync } from '../src/async-helpers'

describe('utils->miscellaneous', () => {
  it('tries once if it works', async () => {
    const mockFunction = jest.fn()
    await retryAsync(mockFunction, 2, [], 1)
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })

  it('retries n times', async () => {
    const mockFunction = jest.fn(() => {
      throw 'error'
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

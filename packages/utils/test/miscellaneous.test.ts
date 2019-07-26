import { retryAsync } from '../src/miscellaneous'

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

    let didThrow = false
    try {
      await retryAsync(mockFunction, 2, [], 1)
    } catch (error) {
      didThrow = true
    }
    expect(didThrow).toBeTruthy()

    // TODO For some reason this doesn't throw
    // expect(async () => {
    //   await retryAsync(myfunct, 2, [])
    // }).toThrow()

    expect(mockFunction).toHaveBeenCalledTimes(3)
  })
})

import { reTryAsync } from '../src/miscellaneous'

describe('utils->miscellaneous', () => {
  it('tries once if it works', async () => {
    const myfunct = jest.fn()
    await reTryAsync(myfunct, 2, [])
    expect(myfunct).toHaveBeenCalledTimes(1)
  })

  it('retries n times', async () => {
    const myfunct2 = jest.fn(() => {
      throw 'error'
    })

    expect(async () => {
      await reTryAsync(myfunct2, 2, [])
    }).toThrow()

    expect(myfunct2).toHaveBeenCalledTimes(3)
  })
})

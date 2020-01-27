const fetch = jest.fn()
jest.mock('cross-fetch', () => fetch)
import abortableFetch from 'src/utils/abortableFetch'

describe('abortableFetch', () => {
  it('behaves like fetch', async () => {
    await abortableFetch('with-any-given-url.domain', { method: 'get' })
    expect(fetch).toHaveBeenCalledWith('with-any-given-url.domain', { method: 'get' })
  })
})

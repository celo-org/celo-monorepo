import cache from './cache'

describe('cache', () => {
  describe('when no options given', () => {
    async function example1() {
      return 22
    }
    it('returns the result of calling the passed function', async () => {
      expect(await cache('cache-example1', example1)).toEqual(await example1())
    })
  })
  describe('when argument option given', () => {
    async function example2(thing: string) {
      return { testing: true, thing }
    }
    it('returns the result of calling the passed function', async () => {
      expect(await cache('cache-example-arg', example2, { args: 'pronto' })).toEqual(
        await example2('pronto')
      )
    })
  })

  describe('when minutes option given', () => {
    async function example3() {
      return 'foo'
    }
    it('returns the result of calling the passed function', async () => {
      expect(await cache('cache-example-minutes', example3, { minutes: 1 })).toEqual(
        await example3()
      )
    })
  })
})

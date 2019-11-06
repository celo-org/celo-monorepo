import { concurrentMap, retryAsync, sleep } from './async'

describe('retryAsync()', () => {
  test('tries once if it works', async () => {
    const mockFunction = jest.fn()
    await retryAsync(mockFunction, 3, [], 1)
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })

  test('retries n times', async () => {
    const mockFunction = jest.fn(() => {
      throw new Error('error')
    })

    try {
      await retryAsync(mockFunction, 3, [], 1)
      expect(false).toBeTruthy()
    } catch (error) {
      // should never happen
    }

    expect(mockFunction).toHaveBeenCalledTimes(3)
  })
})

const counter = () => {
  let value = 0

  return {
    val() {
      return value
    },
    async inc(x: number) {
      await sleep(5)
      value++
      return x * x
    },
  }
}

describe('concurrentMap()', () => {
  it('should be equivalent to Promise.all(xs.map())', async () => {
    const fn = async (x: number) => x * x

    const xs = [1, 3, 4, 5, 6, 23, 90]
    const expected = await Promise.all(xs.map(fn))
    const result = await concurrentMap(3, xs, fn)
    expect(result).toEqual(expected)
  })

  it('should respect the concurrency level', async () => {
    const c1 = counter()
    const c2 = counter()

    const xs = [1, 3, 4, 5, 6, 23, 90]

    // launch both task, but don't wait for them
    const p1 = Promise.all(xs.map(c1.inc))
    const p2 = concurrentMap(2, xs, c2.inc)

    // sleep enough for Promise.all to finish
    await sleep(7)
    expect(c1.val()).toEqual(xs.length)
    expect(c1.val()).not.toEqual(c2.val())

    await sleep(20)
    expect(c1.val()).toEqual(c2.val())

    await p1
    await p2
  })

  it('should allow concurrency level > than length', async () => {
    const c = counter()
    const xs = [1, 3, 4]
    const p = concurrentMap(5, xs, c.inc)
    await sleep(7)
    expect(c.val()).toEqual(xs.length)
    await p
  })
})

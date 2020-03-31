import { HeapTestContract, HeapTestInstance } from 'types'

const HeapTest: HeapTestContract = artifacts.require('HeapTest')

function makeRandomList(n) {
  const testLst = []
  const len = 5 + Math.floor(Math.random() * 20)
  for (let i = 0; i < len; i++) {
    testLst[i] = Math.floor(Math.random() * n)
  }
  return testLst
}

contract('HeapTest', () => {
  let heapTest: HeapTestInstance

  beforeEach(async () => {
    heapTest = await HeapTest.new()
  })

  describe('#sort()', () => {
    it('test with random lists', async () => {
      for (let i = 0; i < 100; i++) {
        const testLst = makeRandomList(1000000000)
        const res: any = await heapTest.sort(testLst)
        assert.deepEqual(
          testLst.sort((a, b) => a - b),
          res.map((a: any) => a.toNumber())
        )
      }
    })
    it('test with random lists including repeated items', async () => {
      for (let i = 0; i < 100; i++) {
        const testLst = makeRandomList(10)
        const res: any = await heapTest.sort(testLst)
        assert.deepEqual(
          testLst.sort((a, b) => a - b),
          res.map((a: any) => a.toNumber())
        )
      }
    })
  })
})

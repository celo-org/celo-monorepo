import { promiEventSpy } from '../test-utils/PromiEventStub'
import { toTxResult } from './tx-result'

test('should resolve to hash & receipt on normal flow', async () => {
  const peStub = promiEventSpy<number>()
  const tx = toTxResult(peStub)

  peStub.resolveHash('theHash')
  const receipt = jest.fn()
  peStub.resolveReceipt(receipt as any)

  expect(await tx.getHash()).toBe('theHash')
  expect(await tx.waitReceipt()).toBe(receipt)
})

test('if hash fails => both fails', async () => {
  const peStub = promiEventSpy<number>()
  const tx = toTxResult(peStub)

  peStub.rejectHash('AN ERROR')

  await expect(tx.getHash()).rejects.toBe('AN ERROR')
  await expect(tx.waitReceipt()).rejects.toBe('AN ERROR')
})

test('if receipt fails => only receipt fails', async () => {
  const peStub = promiEventSpy<number>()
  const tx = toTxResult(peStub)

  peStub.resolveHash('theHash')
  const receipt = jest.fn()
  peStub.rejectReceipt(receipt as any, 'AN ERROR')

  await expect(tx.getHash()).resolves.toBe('theHash')
  await expect(tx.waitReceipt()).rejects.toBe('AN ERROR')
})

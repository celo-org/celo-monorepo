import { PromiEvent, TransactionReceipt, Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { newKit } from './kit'
import { promiEventSpy } from './test-utils/PromiEventStub'

interface TransactionObjectStub<T> extends TransactionObject<T> {
  sendMock: jest.Mock<PromiEvent<any>, [Tx | undefined]>
  estimateGasMock: jest.Mock<Promise<number>, []>
  resolveHash(hash: string): void
  resolveReceipt(receipt: TransactionReceipt): void
  rejectHash(error: any): void
  rejectReceipt(receipt: TransactionReceipt, error: any): void
}

export function txoStub<T>(): TransactionObjectStub<T> {
  const estimateGasMock = jest.fn()
  const peStub = promiEventSpy()
  const sendMock = jest.fn().mockReturnValue(peStub)

  const pe: TransactionObjectStub<T> = {
    arguments: [],
    call: () => {
      throw new Error('not implemented')
    },
    encodeABI: () => {
      throw new Error('not implemented')
    },
    estimateGas: estimateGasMock,
    send: sendMock,
    sendMock,
    estimateGasMock,
    resolveHash: peStub.resolveHash,
    rejectHash: peStub.rejectHash,
    resolveReceipt: peStub.resolveReceipt,
    rejectReceipt: peStub.resolveReceipt,
  }
  return pe
}

describe('kit.sendTransactionObject()', () => {
  const kit = newKit('http://')

  test('should send transaction on simple case', async () => {
    const txo = txoStub()
    txo.estimateGasMock.mockResolvedValue(1000)
    const txRes = await kit.sendTransactionObject(txo)

    txo.resolveHash('HASH')
    txo.resolveReceipt('Receipt' as any)

    await expect(txRes.getHash()).resolves.toBe('HASH')
    await expect(txRes.waitReceipt()).resolves.toBe('Receipt')
  })

  test('should not estimateGas if gas is provided', async () => {
    const txo = txoStub()
    await kit.sendTransactionObject(txo, { gas: 555 })
    expect(txo.estimateGasMock).not.toBeCalled()
  })

  test('should use inflation factor on gas', async () => {
    const txo = txoStub()
    txo.estimateGasMock.mockResolvedValue(1000)
    kit.gasInflationFactor = 2
    await kit.sendTransactionObject(txo)
    expect(txo.send).toBeCalledWith(
      expect.objectContaining({
        gas: 1000 * 2,
      })
    )
  })

  test('should forward txoptions to txo.send()', async () => {
    const txo = txoStub()
    await kit.sendTransactionObject(txo, { gas: 555, feeCurrency: 'XXX', from: '0xAAFFF' })
    expect(txo.send).toBeCalledWith({
      gasPrice: '0',
      gas: 555,
      feeCurrency: 'XXX',
      from: '0xAAFFF',
    })
  })
})

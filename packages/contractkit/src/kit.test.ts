import { CeloTx, CeloTxObject, CeloTxReceipt, PromiEvent } from '@celo/communication'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { newKitFromWeb3 } from './kit'
import { promiEventSpy } from './test-utils/PromiEventStub'

interface TransactionObjectStub<T> extends CeloTxObject<T> {
  sendMock: jest.Mock<PromiEvent<any>, [CeloTx | undefined]>
  estimateGasMock: jest.Mock<Promise<number>, []>
  resolveHash(hash: string): void
  resolveReceipt(receipt: CeloTxReceipt): void
  rejectHash(error: any): void
  rejectReceipt(receipt: CeloTxReceipt, error: any): void
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
  const kit = newKitFromWeb3(new Web3('http://'))

  test('should send transaction on simple case', async () => {
    const txo = txoStub()
    txo.estimateGasMock.mockResolvedValue(1000)
    const txRes = await kit.communication.sendTransactionObject(txo)

    txo.resolveHash('HASH')
    txo.resolveReceipt('Receipt' as any)

    await expect(txRes.getHash()).resolves.toBe('HASH')
    await expect(txRes.waitReceipt()).resolves.toBe('Receipt')
  })

  test('should not estimateGas if gas is provided', async () => {
    const txo = txoStub()
    await kit.communication.sendTransactionObject(txo, { gas: 555 })
    expect(txo.estimateGasMock).not.toBeCalled()
  })

  test('should use inflation factor on gas', async () => {
    const txo = txoStub()
    txo.estimateGasMock.mockResolvedValue(1000)
    kit.communication.defaultGasInflationFactor = 2
    await kit.communication.sendTransactionObject(txo)
    expect(txo.send).toBeCalledWith(
      expect.objectContaining({
        gas: 1000 * 2,
      })
    )
  })

  test('should retrieve currency gasPrice with feeCurrency', async () => {
    const txo = txoStub()
    const gasPrice = 100
    const getGasPriceMin = jest.fn().mockImplementation(() => ({
      getGasPriceMinimum() {
        return new BigNumber(gasPrice)
      },
    }))
    kit.contracts.getGasPriceMinimum = getGasPriceMin.bind(kit.contracts)
    await kit.updateGasPriceInCommunicationLayer('XXX')
    const options: CeloTx = { gas: 555, feeCurrency: 'XXX', from: '0xAAFFF' }
    await kit.communication.sendTransactionObject(txo, options)
    expect(txo.send).toBeCalledWith({
      gasPrice: `${gasPrice * 5}`,
      ...options,
    })
  })

  test('should forward txoptions to txo.send()', async () => {
    const txo = txoStub()
    await kit.communication.sendTransactionObject(txo, { gas: 555, from: '0xAAFFF' })
    expect(txo.send).toBeCalledWith({
      gasPrice: '0',
      gas: 555,
      from: '0xAAFFF',
    })
  })
})

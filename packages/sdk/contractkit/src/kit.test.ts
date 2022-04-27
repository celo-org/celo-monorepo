import { CeloTx, CeloTxObject, CeloTxReceipt, JsonRpcPayload, PromiEvent } from '@celo/connect'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { HttpProvider } from 'web3-core'
import { XMLHttpRequest } from 'xhr2-cookies'
import { API_KEY_HEADER_KEY, newKitFromWeb3 as newFullKitFromWeb3, newKitWithApiKey } from './kit'
import { newKitFromWeb3 as newMiniKitFromWeb3 } from './mini-kit'
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
    _parent: jest.fn() as any,
  }
  return pe
}

;[newFullKitFromWeb3, newMiniKitFromWeb3].forEach((newKitFromWeb3) => {
  describe('kit.sendTransactionObject()', () => {
    const kit = newKitFromWeb3(new Web3('http://'))

    test('should send transaction on simple case', async () => {
      const txo = txoStub()
      txo.estimateGasMock.mockResolvedValue(1000)
      const txRes = await kit.connection.sendTransactionObject(txo)

      txo.resolveHash('HASH')
      txo.resolveReceipt('Receipt' as any)

      await expect(txRes.getHash()).resolves.toBe('HASH')
      await expect(txRes.waitReceipt()).resolves.toBe('Receipt')
    })

    test('should not estimateGas if gas is provided', async () => {
      const txo = txoStub()
      await kit.connection.sendTransactionObject(txo, { gas: 555 })
      expect(txo.estimateGasMock).not.toBeCalled()
    })

    test('should use inflation factor on gas', async () => {
      const txo = txoStub()
      txo.estimateGasMock.mockResolvedValue(1000)
      kit.connection.defaultGasInflationFactor = 2
      await kit.connection.sendTransactionObject(txo)
      expect(txo.send).toBeCalledWith(
        expect.objectContaining({
          gas: 1000 * 2,
        })
      )
    })

    test('should forward txoptions to txo.send()', async () => {
      const txo = txoStub()
      await kit.connection.sendTransactionObject(txo, { gas: 555, from: '0xAAFFF' })
      expect(txo.send).toBeCalledWith({
        gasPrice: '0',
        gas: 555,
        from: '0xAAFFF',
      })
    })
  })
})

test('should retrieve currency gasPrice with feeCurrency', async () => {
  const kit = newFullKitFromWeb3(new Web3('http://'))

  const txo = txoStub()
  const gasPrice = 100
  const getGasPriceMin = jest.fn().mockImplementation(() => ({
    getGasPriceMinimum() {
      return new BigNumber(gasPrice)
    },
  }))
  kit.contracts.getGasPriceMinimum = getGasPriceMin.bind(kit.contracts)
  await kit.updateGasPriceInConnectionLayer('XXX')
  const options: CeloTx = { gas: 555, feeCurrency: 'XXX', from: '0xAAFFF' }
  await kit.connection.sendTransactionObject(txo, options)
  expect(txo.send).toBeCalledWith({
    gasPrice: `${gasPrice * 5}`,
    ...options,
  })
})

describe('newKitWithApiKey()', () => {
  const kit = newKitWithApiKey('http://', 'key')
  const mockSetRequestHeader = jest.fn()
  XMLHttpRequest.prototype.setRequestHeader = mockSetRequestHeader
  XMLHttpRequest.prototype.send = jest.fn()

  test('should set apiKey in request header', async () => {
    const httpProvider = kit.web3.currentProvider as HttpProvider
    const rpcPayload: JsonRpcPayload = {
      jsonrpc: '',
      method: '',
      params: [],
    }
    httpProvider.send(rpcPayload, (error: Error | null) => expect(error).toBeNull())

    // Api Key should be set in the request header
    expect(mockSetRequestHeader).toBeCalledTimes(2)
    expect(mockSetRequestHeader).toBeCalledWith(API_KEY_HEADER_KEY, 'key')
  })
})

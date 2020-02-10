import { Tx } from 'web3/eth/types'
import { JsonRPCResponse } from 'web3/providers'
import { MissingTxParamsPopulator } from './missing-tx-params-populator'
import { IRpcCaller } from './rpc-caller'

describe('MissingTxParamsPopulator class', () => {
  let populator: MissingTxParamsPopulator
  let mockCallback: any
  const completeCeloTx: Tx = {
    nonce: 1,
    chainId: 1,
    from: 'test',
    to: 'test',
    data: 'test',
    value: 1,
    gas: 1,
    gasPrice: 1,
    feeCurrency: undefined,
    gatewayFeeRecipient: '1',
    gatewayFee: '1',
  }

  beforeEach(() => {
    mockCallback = jest.fn(
      (_method: string, _params: any[]): Promise<JsonRPCResponse> => {
        return new Promise((resolve, _reject) =>
          resolve({
            jsonrpc: '2.0',
            id: 1,
            result: '27',
          })
        )
      }
    )
    const rpcMock: IRpcCaller = {
      call: mockCallback,
    }
    populator = new MissingTxParamsPopulator(rpcMock)
  })

  describe('when missing parameters', () => {
    test('will populate the chaindId', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)
      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('net_version')
    })

    test('will retrieve only once the chaindId', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)

      const newCeloTx2 = await populator.populate(celoTx)
      expect(newCeloTx2.chainId).toBe(27)

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('net_version')
    })

    test('will populate the nonce', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.nonce = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.nonce).toBe('27')
      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('eth_getTransactionCount')
    })

    test('will populate the gas', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gas = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gas).toBe('27')
      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('eth_estimateGas')
    })

    test('will populate the gatewayFeeRecipient', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gatewayFeeRecipient = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gatewayFeeRecipient).toBe('27')
      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('eth_coinbase')
    })

    test('will retrieve only once the gatewayFeeRecipient', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gatewayFeeRecipient = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gatewayFeeRecipient).toBe('27')

      const newCeloTx2 = await populator.populate(celoTx)
      expect(newCeloTx2.gatewayFeeRecipient).toBe('27')

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('eth_coinbase')
    })

    test('will populate the gas price', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gasPrice).toBe('27')
      expect(mockCallback.mock.calls.length).toBe(1)
      expect(mockCallback.mock.calls[0][0]).toBe('eth_gasPrice')
    })

    test('fails (for now) if the fee Currency has something', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      celoTx.feeCurrency = 'celoMagic'
      await expect(populator.populate(celoTx)).rejects.toThrowError()
      expect(mockCallback.mock.calls.length).toBe(0)
    })
  })
})

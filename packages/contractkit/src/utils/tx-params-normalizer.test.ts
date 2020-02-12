import { Tx } from 'web3/eth/types'
import { Callback, JsonRPCRequest, JsonRPCResponse } from 'web3/providers'
import { RpcCaller } from './rpc-caller'
import { TxParamsNormalizer } from './tx-params-normalizer'

describe('TxParamsNormalizer class', () => {
  let populator: TxParamsNormalizer
  let mockRpcCall: any
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
    mockRpcCall = jest.fn(
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
    const rpcMock: RpcCaller = {
      call: mockRpcCall,
      // tslint:disable-next-line: no-empty
      send: (_payload: JsonRPCRequest, _callback: Callback<JsonRPCResponse>): void => {},
    }
    populator = new TxParamsNormalizer(rpcMock)
  })

  describe('when missing parameters', () => {
    test('will populate the chaindId', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('net_version')
    })

    test('will retrieve only once the chaindId', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)

      const newCeloTx2 = await populator.populate(celoTx)
      expect(newCeloTx2.chainId).toBe(27)

      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('net_version')
    })

    test('will populate the nonce', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.nonce = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.nonce).toBe('27')
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_getTransactionCount')
    })

    test('will populate the gas', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gas = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gas).toBe('27')
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_estimateGas')
    })

    test('will populate the gatewayFeeRecipient', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gatewayFeeRecipient = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gatewayFeeRecipient).toBe('27')
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_coinbase')
    })

    test('will retrieve only once the gatewayFeeRecipient', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gatewayFeeRecipient = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gatewayFeeRecipient).toBe('27')

      const newCeloTx2 = await populator.populate(celoTx)
      expect(newCeloTx2.gatewayFeeRecipient).toBe('27')

      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_coinbase')
    })

    test('will populate the gas price', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gasPrice).toBe('27')
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_gasPrice')
    })

    test('fails (for now) if the fee Currency has something', async () => {
      const celoTx: Tx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      celoTx.feeCurrency = 'celoMagic'
      await expect(populator.populate(celoTx)).rejects.toThrowError()
      expect(mockRpcCall.mock.calls.length).toBe(0)
    })
  })
})

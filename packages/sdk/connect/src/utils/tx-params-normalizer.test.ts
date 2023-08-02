import Web3 from 'web3'
import { Connection } from '../connection'
import { Callback, CeloTx, JsonRpcPayload, JsonRpcResponse } from '../types'
import { RpcCaller } from './rpc-caller'
import { TxParamsNormalizer } from './tx-params-normalizer'

describe('TxParamsNormalizer class', () => {
  let populator: TxParamsNormalizer
  let mockRpcCall: any
  let mockGasEstimation: any
  const completeCeloTx: CeloTx = {
    nonce: 1,
    chainId: 1,
    from: 'test',
    to: 'test',
    data: 'test',
    value: 1,
    gas: 1,
    gasPrice: 1,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    feeCurrency: undefined,
    gatewayFeeRecipient: '1',
    gatewayFee: '1',
  }

  beforeEach(() => {
    mockRpcCall = jest.fn((method: string, _params: any[]): Promise<JsonRpcResponse> => {
      return new Promise((resolve, _reject) =>
        resolve({
          jsonrpc: '2.0',
          id: 1,
          result: method === 'net_version' ? '27' : '0x27',
        })
      )
    })
    const rpcMock: RpcCaller = {
      call: mockRpcCall,
      // tslint:disable-next-line: no-empty
      send: (_payload: JsonRpcPayload, _callback: Callback<JsonRpcResponse>): void => {},
    }
    const connection = new Connection(new Web3('http://localhost:8545'))
    connection.rpcCaller = rpcMock
    mockGasEstimation = jest.fn(
      (
        _tx: CeloTx,
        _gasEstimator?: (tx: CeloTx) => Promise<number>,
        _caller?: (tx: CeloTx) => Promise<string>
      ): Promise<number> => {
        return Promise.resolve(27)
      }
    )
    connection.estimateGas = mockGasEstimation
    populator = new TxParamsNormalizer(connection)
  })

  describe('when missing parameters', () => {
    test('will populate the chaindId', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('net_version')
    })

    test('will retrieve only once the chaindId', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.chainId = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.chainId).toBe(27)

      const newCeloTx2 = await populator.populate(celoTx)
      expect(newCeloTx2.chainId).toBe(27)

      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('net_version')
    })

    test('will populate the nonce', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.nonce = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.nonce).toBe(39) // 0x27 => 39
      expect(mockRpcCall.mock.calls.length).toBe(1)
      expect(mockRpcCall.mock.calls[0][0]).toBe('eth_getTransactionCount')
    })

    test('will populate the gas', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.gas = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.gas).toBe(27)
      expect(mockGasEstimation.mock.calls.length).toBe(1)
    })

    test('will not pop maxFeePerGas and maxPriorityFeePerGas when gasPrice is set', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.gasPrice = 1
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.maxFeePerGas).toBe(undefined)
      expect(newCeloTx.maxPriorityFeePerGas).toBe(undefined)
    })
    test('will not pop maxFeePerGas it is set', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.maxFeePerGas = 100
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.maxFeePerGas).toBe(100)
    })
    test('will not pop maxPriorityFeePerGas it is set', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.maxPriorityFeePerGas = 2000
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.maxPriorityFeePerGas).toBe(2000)
    })

    test('will populate the maxFeePerGas and maxPriorityFeePerGas without fee currency', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      celoTx.maxFeePerGas = undefined
      celoTx.maxPriorityFeePerGas = undefined
      celoTx.feeCurrency = undefined
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.maxFeePerGas).toBe('0x27')
      expect(newCeloTx.maxPriorityFeePerGas).toBe('0x27')
      expect(mockRpcCall.mock.calls[0]).toEqual(['eth_gasPrice', []])
      expect(mockRpcCall.mock.calls[1]).toEqual(['eth_maxPriorityFeePerGas', []])
    })

    test('will populate the maxFeePerGas and maxPriorityFeePerGas with fee currency', async () => {
      const celoTx: CeloTx = { ...completeCeloTx }
      celoTx.gasPrice = undefined
      celoTx.maxFeePerGas = undefined
      celoTx.maxPriorityFeePerGas = undefined
      celoTx.feeCurrency = 'celoMagic'
      const newCeloTx = await populator.populate(celoTx)
      expect(newCeloTx.maxFeePerGas).toBe('0x27')
      expect(newCeloTx.maxPriorityFeePerGas).toBe('0x27')
      expect(mockRpcCall.mock.calls[0]).toEqual(['eth_gasPrice', ['celoMagic']])
      expect(mockRpcCall.mock.calls[1]).toEqual(['eth_maxPriorityFeePerGas', []])
    })
  })
})

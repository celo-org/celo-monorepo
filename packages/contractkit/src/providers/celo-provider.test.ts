import { privateKeyToAddress } from '@celo/utils/lib/address'
import { provider, Tx } from 'web3-core'
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { CeloProvider } from '../providers/celo-provider'

// Random private keys
const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = privateKeyToAddress(PRIVATE_KEY1)
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)

// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('CeloProvider', () => {
  let mockCallback: any
  let mockProvider: provider
  let celoProvider: CeloProvider
  const interceptedByCeloProvider = [
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
  ]

  beforeEach(() => {
    mockCallback = jest.fn((payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): any => {
      const response: JsonRpcResponse = {
        jsonrpc: payload.jsonrpc,
        id: Number(payload.id),
        result: {
          params: payload.params,
          method: payload.method,
        },
      }
      callback(null, response)
    })
    mockProvider = {
      host: '',
      connected: true,
      send: mockCallback,
      supportsSubscriptions: (): boolean => true,
      disconnect: (): boolean => true,
    }

    celoProvider = new CeloProvider(mockProvider)
  })

  describe("when celo provider don't have any local account", () => {
    interceptedByCeloProvider.forEach((method: string) => {
      test(`fowards the call to '${method}' to the original provider`, (done) => {
        const payload: JsonRpcPayload = {
          id: 0,
          jsonrpc: '2.0',
          method,
          params: ['1', '2'],
        }
        const callback = (_error: null, _result: JsonRpcResponse) => {
          expect(mockCallback.mock.calls.length).toBe(1)
          expect(mockCallback.mock.calls[0][0].method).toBe(method)
          done()
        }
        celoProvider.send(payload, callback as Callback<JsonRpcResponse>)
      })
    })
  })

  describe('when celo provider has a local account', () => {
    function paramsForMethod(method: string, from: string, to: string) {
      const tx: Tx = {
        from,
        to,
        value: '1',
        nonce: 0,
        gas: 10,
        gasPrice: 99,
        feeCurrency: '0x124356',
        gatewayFeeRecipient: '0x1234',
        gatewayFee: '0x5678',
        data: '0xabcdef',
        chainId: 1,
      }
      switch (method) {
        case 'eth_sendTransaction':
        case 'eth_signTransaction':
          return [tx]
        case 'eth_sign':
          return [from, '0x01']
        case 'personal_sign':
          return ['0x01', from]
        case 'eth_signTypedData':
          return [
            from,
            {
              types: {
                EIP712Domain: [
                  { name: 'name', type: 'string' },
                  { name: 'version', type: 'string' },
                  { name: 'chainId', type: 'uint256' },
                  { name: 'verifyingContract', type: 'address' },
                ],
              },
              primaryType: 'Mail',
              domain: {
                name: 'Ether Mail',
                version: '1',
                chainId: 1,
                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
              },
              message: {
                from: {
                  name: 'Cow',
                  wallet: from,
                },
                to: {
                  name: 'Bob',
                  wallet: to,
                },
                contents: 'Hello, Bob!',
              },
            },
          ]
        default: {
          return []
        }
      }
    }

    beforeEach(() => {
      celoProvider.addAccount(PRIVATE_KEY1)
    })

    describe('but tries to use it with a different account', () => {
      interceptedByCeloProvider.forEach((method: string) => {
        test(`fowards the call to '${method}' to the original provider`, (done) => {
          const payload: JsonRpcPayload = {
            id: 0,
            jsonrpc: '2.0',
            method,
            params: paramsForMethod(method, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1),
          }
          const callback = (_error: null, _result: JsonRpcResponse) => {
            expect(mockCallback.mock.calls.length).toBe(1)
            expect(mockCallback.mock.calls[0][0].method).toBe(method)
            done()
          }
          celoProvider.send(payload, callback as Callback<JsonRpcResponse>)
        })
      })
    })

    describe('using that account', () => {
      test("call 'send' with 'eth_sendTransaction' signs and send a eth_sendRawTransaction to the original provider", (done) => {
        const payload: JsonRpcPayload = {
          id: 0,
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: paramsForMethod('eth_sendTransaction', ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2),
        }
        const callback = (_error: null, _result: JsonRpcResponse) => {
          expect(mockCallback.mock.calls.length).toBe(1)
          expect(mockCallback.mock.calls[0][0].method).toBe('eth_sendRawTransaction')
          done()
        }
        celoProvider.send(payload, callback as Callback<JsonRpcResponse>)
      })

      test.todo(
        "call 'send' with 'eth_signTypedData' signs the message and don't call the original provider"
      )

      interceptedByCeloProvider
        .filter((x) => x !== 'eth_sendTransaction' && x !== 'eth_signTypedData')
        .forEach((method: string) => {
          test(`call 'send' with '${method}' signs the message and don't call the original provider`, (done) => {
            const payload: JsonRpcPayload = {
              id: 0,
              jsonrpc: '2.0',
              method,
              params: paramsForMethod(method, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2),
            }
            const callback = (error: null, result: JsonRpcResponse) => {
              expect(error).toBeNull()
              expect(result).not.toBeFalsy()
              expect(mockCallback.mock.calls.length).toBe(0)
              done()
            }
            celoProvider.send(payload, callback as Callback<JsonRpcResponse>)
          })
        })
    })
  })
})

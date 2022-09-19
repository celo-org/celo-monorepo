import Web3 from 'web3'
import { CeloProvider } from './celo-provider'
import { Connection } from './connection'
import {
  Address,
  Callback,
  CeloTx,
  EncodedTransaction,
  JsonRpcPayload,
  JsonRpcResponse,
  Provider,
} from './types'
import { ReadOnlyWallet } from './wallet'

const ACCOUNT_ADDRESS1 = '0x1234567890123456789012345678901234567890'
const ACCOUNT_ADDRESS2 = '0x0987654321098765432109876543210987654321'

class MockWallet implements ReadOnlyWallet {
  private addresses = new Array<Address>()
  addAccount(privateKey: Address): void {
    this.addresses.push(privateKey)
  }
  getAccounts(): Address[] {
    return this.addresses
  }
  hasAccount(address?: string | undefined): boolean {
    return address != null && this.addresses.includes(address)
  }
  signTransaction(_txParams: CeloTx): Promise<EncodedTransaction> {
    return Promise.resolve({
      raw: 'mock',
      tx: {
        nonce: 'nonce',
        gasPrice: 'gasPrice',
        gas: 'gas',
        feeCurrency: 'feeCurrency',
        gatewayFeeRecipient: 'gatewayFeeRecipient',
        gatewayFee: 'gatewayFee',
        to: 'to',
        value: 'value',
        input: 'input',
        r: 'r',
        s: 's',
        v: 'v',
        hash: 'hash',
      },
    })
  }
  signTypedData(_address: string, _typedData: any): Promise<string> {
    return Promise.resolve('mock')
  }
  signPersonalMessage(_address: string, _data: string): Promise<string> {
    return Promise.resolve('mock')
  }
  decrypt(_address: string, _ciphertext: Buffer): Promise<Buffer> {
    return Promise.resolve(new Buffer('mock'))
  }
  // tslint:disable-next-line: no-empty
  removeAccount(_address: string): void {}
  computeSharedSecret(_address: string, _publicKey: string): Promise<Buffer> {
    return Promise.resolve(new Buffer('mock'))
  }
}

// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('CeloProvider', () => {
  let mockCallback: any
  let mockProvider: Provider
  let celoProvider: CeloProvider
  const interceptedByCeloProvider = [
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
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
      send: mockCallback,
    }

    const web3 = new Web3()
    web3.setProvider(mockProvider as any)
    const connection = new Connection(web3, new MockWallet())
    celoProvider = connection.web3.currentProvider as any as CeloProvider
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
        const callback: Callback<JsonRpcResponse> = (
          _error: Error | null,
          _result?: JsonRpcResponse
        ) => {
          expect(mockCallback.mock.calls.length).toBe(1)
          expect(mockCallback.mock.calls[0][0].method).toBe(method)
          done()
        }
        celoProvider.send(payload, callback)
      })
    })
  })

  describe('when celo provider has a local account', () => {
    function paramsForMethod(method: string, from: string, to: string) {
      const tx: CeloTx = {
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
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
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
      celoProvider.addAccount(ACCOUNT_ADDRESS1)
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
          const callback: Callback<JsonRpcResponse> = (
            _error: Error | null,
            _result?: JsonRpcResponse
          ) => {
            expect(mockCallback.mock.calls.length).toBe(1)
            expect(mockCallback.mock.calls[0][0].method).toBe(method)
            done()
          }
          celoProvider.send(payload, callback)
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
        const callback: Callback<JsonRpcResponse> = (
          _error: Error | null,
          _result?: JsonRpcResponse
        ) => {
          expect(mockCallback.mock.calls.length).toBe(1)
          expect(mockCallback.mock.calls[0][0].method).toBe('eth_sendRawTransaction')
          done()
        }
        celoProvider.send(payload, callback)
      })

      test.todo(
        "call 'send' with 'eth_signTypedData' signs the message and don't call the original provider"
      )

      interceptedByCeloProvider
        .filter((x) => x !== 'eth_sendTransaction' && !x.startsWith('eth_signTypedData'))
        .forEach((method: string) => {
          test(`call 'send' with '${method}' signs the message and don't call the original provider`, (done) => {
            const payload: JsonRpcPayload = {
              id: 0,
              jsonrpc: '2.0',
              method,
              params: paramsForMethod(method, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2),
            }
            const callback: Callback<JsonRpcResponse> = (
              error: Error | null,
              result?: JsonRpcResponse
            ) => {
              expect(error).toBeNull()
              expect(result).not.toBeFalsy()
              expect(mockCallback.mock.calls.length).toBe(0)
              done()
            }
            celoProvider.send(payload, callback)
          })
        })
    })
  })
})

import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { DefaultRpcCaller, RpcCaller, rpcCallHandler } from './rpc-caller'

const mockProvider: Provider = {
  send: (payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any => {
    const response: JsonRPCResponse = {
      jsonrpc: payload.jsonrpc,
      id: payload.id,
      result: {
        params: payload.params,
        method: payload.method,
      },
    }
    if (payload.method === 'mock_error_method') {
      callback(new Error(payload.method))
    } else {
      callback(null, response)
    }
  },
}

describe('RPC Caller class', () => {
  let rpcCaller: RpcCaller

  beforeEach(async () => {
    rpcCaller = new DefaultRpcCaller(mockProvider)
  })

  describe('when calling the provider', () => {
    it('populates the payload id', async () => {
      const result = await rpcCaller.call('mock_method', ['mock_param'])
      expect(result.id).not.toBeUndefined()
      expect(result.id).not.toBe(0)
    })

    it('populates the payload jsonrpc', async () => {
      const result = await rpcCaller.call('mock_method', ['mock_param'])
      expect(result.jsonrpc).not.toBeUndefined()
      expect(result.jsonrpc).toBe('2.0')
    })
  })

  describe('when the provider fails', () => {
    it('raises an error', async () => {
      await expect(rpcCaller.call('mock_error_method', ['mock_param'])).rejects.toThrowError()
    })
  })
})

function handleMock(payload: JsonRPCRequest): Promise<any> {
  if (payload.method === 'fail_not_promise') {
    throw Error('fail')
  }
  return new Promise((resolve, reject) => {
    if (payload.method === 'fail_promise') {
      reject(Error('fail promise'))
    } else {
      resolve('mock_response')
    }
  })
}

describe('rpcCallHandler function', () => {
  let payload: JsonRPCRequest

  beforeEach(async () => {
    payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
      params: [],
    }
  })

  describe('when the handle promise fails', () => {
    it('the callback receives a response with the error', (done) => {
      function callback(_error: null, response: JsonRPCResponse) {
        try {
          expect((response as any).error.code).toBe(-32000)
          done()
        } catch (error) {
          done(error)
        }
      }
      expect.assertions(1)
      payload.method = 'fail_promise'
      rpcCallHandler(payload, handleMock, callback as Callback<JsonRPCResponse>)
    })
  })

  describe('when the handle fails (not the promise)', () => {
    it('the callback receives a response with the error', (done) => {
      function callback(error: null, response: JsonRPCResponse) {
        try {
          expect(response).toBeUndefined()
          expect(error).not.toBeNull()
          done()
        } catch (error) {
          done(error)
        }
      }
      expect.assertions(2)
      payload.method = 'fail_not_promise'
      rpcCallHandler(payload, handleMock, callback as Callback<JsonRPCResponse>)
    })
  })

  describe('when the handle succeds', () => {
    it('the callback receives a response with a result', (done) => {
      function callback(_error: null, response: JsonRPCResponse) {
        try {
          expect((response as any).error).toBeUndefined()
          expect(response.result).toBe('mock_response')
          done()
        } catch (error) {
          done(error)
        }
      }
      expect.assertions(2)
      rpcCallHandler(payload, handleMock, callback as Callback<JsonRPCResponse>)
    })
  })
})

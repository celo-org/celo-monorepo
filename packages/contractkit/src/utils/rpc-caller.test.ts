import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { RpcCaller, rpcCallHandler } from './rpc-caller'

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
    rpcCaller = new RpcCaller(mockProvider)
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

async function handleMock(payload: JsonRPCRequest): Promise<any> {
  if (payload.method === 'fail') {
    throw Error('fail')
  }
  return 'mock_response'
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

  describe('when the handle fails', () => {
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
      payload.method = 'fail'
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

    describe('and the custom callback fails', () => {
      it('the error is propagated', () => {
        function callback(_error: null, _val: JsonRPCResponse) {
          throw Error('callbackFailed')
        }

        try {
          rpcCallHandler(payload, handleMock, callback as Callback<JsonRPCResponse>)
        } catch (e) {
          expect(e.message).toBe('callbackFailed')
        }
      })
    })
  })
})

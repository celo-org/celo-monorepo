import { Callback, JsonRpcPayload, JsonRpcResponse, Provider } from '../types'
import { DefaultRpcCaller, RpcCaller, rpcCallHandler } from './rpc-caller'

const mockProvider: Provider = {
  send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): any => {
    const response: JsonRpcResponse = {
      jsonrpc: payload.jsonrpc,
      id: Number(payload.id),
      result: {
        params: payload.params,
        method: payload.method,
      },
    }
    if (payload.method === 'mock_error_method') {
      callback(new Error(payload.method))
      return
    } else if (payload.method === 'mock_response_error_method') {
      response.error = {
        code: -32000,
        message: 'foobar',
      }
    }

    callback(null, response)
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

  describe('when the result contains an error', () => {
    it('raises an error with the error message', async () => {
      await expect(
        rpcCaller.call('mock_response_error_method', ['mock_param'])
      ).rejects.toThrowError('foobar')
    })
  })
})

function handleMock(payload: JsonRpcPayload): Promise<any> {
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
  let payload: JsonRpcPayload

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
      function callback(_error: Error | null, response?: JsonRpcResponse) {
        try {
          expect((response as any).error.code).toBe(-32000)
          done()
        } catch (error) {
          done(error)
        }
      }
      expect.assertions(1)
      payload.method = 'fail_promise'
      rpcCallHandler(payload, handleMock, callback)
    })
  })

  describe('when the handle fails (not the promise)', () => {
    it('the callback receives a response with the error', (done) => {
      function callback(error: Error | null, response?: JsonRpcResponse) {
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
      rpcCallHandler(payload, handleMock, callback)
    })
  })

  describe('when the handle succeeds', () => {
    it('the callback receives a response with a result', (done) => {
      function callback(_error: Error | null, response?: JsonRpcResponse) {
        try {
          expect((response as any).error).toBeUndefined()
          expect(response!.result).toBe('mock_response')
          done()
        } catch (error) {
          done(error)
        }
      }
      expect.assertions(2)
      rpcCallHandler(payload, handleMock, callback)
    })
  })
})

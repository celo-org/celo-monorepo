import * as t from 'io-ts'
import 'jest-fetch-mock'
import { action, RequestMethod } from './actions'
import { KomenciClient } from './client'
import { FetchErrorTypes } from './errors'

const URL = 'http://komenci.celo.com/'

// Quite test output
jest.spyOn(console, 'debug').mockImplementation(() => null)

describe('KomenciClient', () => {
  describe('#exec', () => {
    const TestResp = t.type({
      field: t.string,
    })
    type TestResp = t.TypeOf<typeof TestResp>
    const testAction = action<'testAction', {}, TestResp>(
      'testAction',
      RequestMethod.POST,
      'testAction',
      TestResp
    )

    let client: KomenciClient

    beforeEach(() => {
      client = new KomenciClient(URL)
      fetchMock.resetMocks()
    })

    describe('when the request encounters network errors', () => {
      it('returns a wrapped error', async () => {
        const act = testAction({})
        fetchMock.mockAbort()

        const res = await client.exec(act)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(FetchErrorTypes.NetworkError)
          if (res.error.errorType === FetchErrorTypes.NetworkError) {
            expect(res.error.networkError.message).toEqual('The operation was aborted. ')
          }
        }
      })
    })

    describe('when the response is 401', () => {
      it('returns an Unauthorised error', async () => {
        const act = testAction({})
        fetchMock.mockIf(URL + act.path, () => {
          return Promise.resolve({
            status: 401,
            body: 'Unauthorised',
          })
        })

        const res = await client.exec(act)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(FetchErrorTypes.Unauthorised)
        }
      })
    })

    describe('when the response is 400', () => {
      it('returns a RequestError', async () => {
        const act = testAction({})
        fetchMock.mockIf(URL + act.path, () => {
          return Promise.resolve({
            status: 400,
            body: JSON.stringify({
              error: 'ErrorCode',
              message: 'Something',
            }),
          })
        })

        const res = await client.exec(act)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(FetchErrorTypes.RequestError)
          if (res.error.errorType === FetchErrorTypes.RequestError) {
            expect(res.error.data).toEqual({
              error: 'ErrorCode',
              message: 'Something',
            })
          }
        }
      })
    })

    describe('when the response is 500', () => {
      it('returns a ServiceUnavailable', async () => {
        const act = testAction({})
        fetchMock.mockIf(URL + act.path, () => {
          return Promise.resolve({
            status: 500,
            body: JSON.stringify({
              error: 'ErrorCode',
              message: 'Something',
            }),
          })
        })

        const res = await client.exec(act)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(FetchErrorTypes.ServiceUnavailable)
        }
      })
    })

    describe('when the response is 200', () => {
      describe('but the payload is in the wrong format', () => {
        it('returns a DecodeError', async () => {
          const act = testAction({})
          fetchMock.mockIf(URL + act.path, () => {
            return Promise.resolve({
              status: 200,
              body: JSON.stringify({
                notAField: 'bla',
              }),
            })
          })

          const res = await client.exec(act)
          expect(res.ok).toBe(false)
          if (res.ok === false) {
            expect(res.error.errorType).toBe(FetchErrorTypes.DecodeError)
          }
        })
      })

      describe('and the payload is in the right format', () => {
        it('returns the data', async () => {
          const act = testAction({})
          fetchMock.mockIf(URL + act.path, () => {
            return Promise.resolve({
              status: 200,
              body: JSON.stringify({
                field: 'value',
              }),
            })
          })

          const res = await client.exec(act)
          expect(res.ok).toBe(true)
          if (res.ok === true) {
            expect(res.result).toEqual({
              field: 'value',
            })
          }
        })
      })
    })
  })
})

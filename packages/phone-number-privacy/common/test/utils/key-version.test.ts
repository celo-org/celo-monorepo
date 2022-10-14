import { Request } from 'express'
import { Response as FetchResponse } from 'node-fetch'
import {
  getRequestKeyVersion,
  getResponseKeyVersion,
  KEY_VERSION_HEADER,
  requestHasValidKeyVersion,
  responseHasValidKeyVersion,
  rootLogger,
  WarningMessage,
} from '../../lib'

describe('key version test suite', () => {
  const logger = rootLogger('key version test suite')

  const request = {
    headers: {},
  } as Request

  let response: FetchResponse

  const invalidKeyVersionHeaders: (string | string[])[] = [
    'a',
    '-1',
    '1.5',
    '1a',
    'blah',
    'one',
    '-',
    '+',
    ['1', '2', '3'],
    '     .   ',
  ]

  beforeEach(() => {
    delete request.headers[KEY_VERSION_HEADER]
    response = new FetchResponse()
  })

  describe('getRequestKeyVersion', () => {
    it(`Should return undefined if key version header has not been set`, () => {
      const res = getRequestKeyVersion(request, logger)
      expect(res).toBe(undefined)
    })

    it(`Should return undefined if key version header is undefined`, () => {
      request.headers[KEY_VERSION_HEADER] = undefined
      const res = getRequestKeyVersion(request, logger)
      expect(res).toBe(undefined)
    })

    it(`Should return undefined if key version header is empty`, () => {
      request.headers[KEY_VERSION_HEADER] = ''
      const res = getRequestKeyVersion(request, logger)
      expect(res).toBe(undefined)
    })

    it(`Should return undefined if key version header is whitespace`, () => {
      request.headers[KEY_VERSION_HEADER] = '       '
      const res = getRequestKeyVersion(request, logger)
      expect(res).toBe(undefined)
    })

    for (let kv = 0; kv <= 10; kv++) {
      it(`Should return valid key version header ${kv}`, () => {
        request.headers[KEY_VERSION_HEADER] = kv.toString()
        const res = getRequestKeyVersion(request, logger)
        expect(res).toBe(kv)
      })
    }

    it(`Should return valid key version header when there's whitespace`, () => {
      request.headers[KEY_VERSION_HEADER] = '  1 '
      const res = getRequestKeyVersion(request, logger)
      expect(res).toBe(1)
    })

    invalidKeyVersionHeaders.forEach((kv) => {
      it(`Should throw for invalid key version ${kv}`, () => {
        request.headers[KEY_VERSION_HEADER] = kv.toString()
        expect(() => getRequestKeyVersion(request, logger)).toThrow(
          WarningMessage.INVALID_KEY_VERSION_REQUEST
        )
      })
    })
  })

  describe('requestHasValidKeyVersion', () => {
    it(`Should return true if key version header has not been set`, () => {
      const res = requestHasValidKeyVersion(request, logger)
      expect(res).toBe(true)
    })
    it(`Should return true if key version header is undefined`, () => {
      request.headers[KEY_VERSION_HEADER] = undefined
      const res = requestHasValidKeyVersion(request, logger)
      expect(res).toBe(true)
    })
    it(`Should return true if key version header is empty`, () => {
      request.headers[KEY_VERSION_HEADER] = ''
      const res = requestHasValidKeyVersion(request, logger)
      expect(res).toBe(true)
    })

    it(`Should return true if key version header is whitespace`, () => {
      request.headers[KEY_VERSION_HEADER] = '       '
      const res = requestHasValidKeyVersion(request, logger)
      expect(res).toBe(true)
    })

    for (let kv = 0; kv <= 10; kv++) {
      it(`Should return true for valid key version header ${kv}`, () => {
        request.headers[KEY_VERSION_HEADER] = kv.toString()
        const res = requestHasValidKeyVersion(request, logger)
        expect(res).toBe(true)
      })
    }

    it(`Should return true for valid key version header when there's whitespace`, () => {
      request.headers[KEY_VERSION_HEADER] = '  1 '
      const res = requestHasValidKeyVersion(request, logger)
      expect(res).toBe(true)
    })

    invalidKeyVersionHeaders.forEach((kv) => {
      it(`Should return false for invalid key version ${kv}`, () => {
        request.headers[KEY_VERSION_HEADER] = kv.toString()
        const res = requestHasValidKeyVersion(request, logger)
        expect(res).toBe(false)
      })
    })
  })

  describe('getResponseKeyVersion', () => {
    it(`Should return undefined if key version header has not been set`, () => {
      const res = getResponseKeyVersion(response, logger)
      expect(res).toBe(undefined)
    })
    it(`Should return undefined if key version header is undefined`, () => {
      response.headers.delete(KEY_VERSION_HEADER)
      const res = getResponseKeyVersion(response, logger)
      expect(res).toBe(undefined)
    })

    it(`Should return undefined if key version header is empty`, () => {
      response.headers.set(KEY_VERSION_HEADER, '')
      const res = getResponseKeyVersion(response, logger)
      expect(res).toBe(undefined)
    })

    it(`Should return undefined if key version header is whitespace`, () => {
      response.headers.set(KEY_VERSION_HEADER, '       ')
      const res = getResponseKeyVersion(response, logger)
      expect(res).toBe(undefined)
    })

    for (let kv = 0; kv <= 10; kv++) {
      it(`Should return valid key version header ${kv}`, () => {
        response.headers.set(KEY_VERSION_HEADER, kv.toString())
        const res = getResponseKeyVersion(response, logger)
        expect(res).toBe(kv)
      })
    }

    it(`Should return valid key version header when there's whitespace`, () => {
      response.headers.set(KEY_VERSION_HEADER, '  1 ')
      const res = getResponseKeyVersion(response, logger)
      expect(res).toBe(1)
    })

    invalidKeyVersionHeaders.forEach((kv) => {
      it(`Should return undefined for invalid key version ${kv}`, () => {
        response.headers.set(KEY_VERSION_HEADER, kv.toString())
        const res = getResponseKeyVersion(response, logger)
        expect(res).toBe(undefined)
      })
    })
  })

  describe('responseHasValidKeyVersion', () => {
    const testCases = [
      {
        requestKeyVersion: undefined,
        defaultRequestKeyVersion: 1,
        responseKeyVersion: 1,
        expectedResult: true,
      },
      {
        requestKeyVersion: undefined,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: 1,
        expectedResult: false,
      },
      {
        requestKeyVersion: undefined,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: undefined,
        expectedResult: false,
      },
      {
        requestKeyVersion: 1,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: 1,
        expectedResult: true,
      },
      {
        requestKeyVersion: 1,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: 2,
        expectedResult: false,
      },
      {
        requestKeyVersion: 1,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: undefined,
        expectedResult: false,
      },
      {
        requestKeyVersion: 1,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: 1.5,
        expectedResult: false,
      },
      {
        requestKeyVersion: undefined,
        defaultRequestKeyVersion: 2,
        responseKeyVersion: 1.5,
        expectedResult: false,
      },
    ]

    testCases.forEach((testCase) => {
      it(JSON.stringify(testCase), () => {
        request.headers[KEY_VERSION_HEADER] = testCase.requestKeyVersion?.toString()
        if (testCase.responseKeyVersion === undefined) {
          response.headers.delete(KEY_VERSION_HEADER)
        } else {
          response.headers.set(KEY_VERSION_HEADER, testCase.responseKeyVersion.toString())
        }
        const res = responseHasValidKeyVersion(
          request,
          response,
          testCase.defaultRequestKeyVersion,
          logger
        )
        expect(res).toBe(testCase.expectedResult)
      })
    })
  })
})

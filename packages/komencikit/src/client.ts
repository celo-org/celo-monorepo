import { Err, Ok, Result } from '@celo/base/lib/result'
import 'cross-fetch/polyfill'
import { isRight } from 'fp-ts/Either'

import { Action } from './actions'
import {
  FetchError,
  FetchErrorTypes,
  NetworkError,
  NotFoundError,
  QuotaExceededError,
  RequestError,
  ResponseDecodeError,
  ServiceUnavailable,
  Unauthorised,
  UnexpectedStatus,
} from './errors'
import { retry } from './retry'

const TAG = 'KomenciClient'

export class KomenciClient {
  private token: string | undefined
  private readonly url: string

  constructor(url: string, token?: string) {
    // Ensure trailing slash
    this.url = url.replace(/\/$/, '') + '/'
    this.token = token
  }

  setToken(token: string) {
    this.token = token
  }

  @retry({
    tries: 3,
    bailOnErrorTypes: [FetchErrorTypes.Unauthorised, FetchErrorTypes.RequestError],
    onRetry: (args, error, attempt) => {
      const action = args[0] as Action<any, any, any>
      console.debug(`${TAG}/exec:${action.action} attempt#${attempt} error: `, error)
    },
  })
  async exec<TAction, TPayload, TResp>(
    action: Action<TAction, TPayload, TResp>
  ): Promise<Result<TResp, FetchError>> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const body = action.payload !== null ? JSON.stringify(action.payload) : undefined
      const resp = await fetch(this.url + action.path, {
        method: action.method,
        body,
        headers,
      })

      if (resp.status >= 200 && resp.status <= 299) {
        const payload = await resp.json()
        const decodedResp = action.codec.decode(payload)
        if (isRight(decodedResp)) {
          return Ok(decodedResp.right)
        } else {
          return Err(new ResponseDecodeError(payload))
        }
      } else if (resp.status === 401) {
        return Err(new Unauthorised())
      } else if (resp.status === 404) {
        return Err(new NotFoundError(this.url + action.path))
      } else if (resp.status === 429) {
        return Err(new QuotaExceededError())
      } else if (resp.status === 400) {
        const payload = await resp.json()
        return Err(new RequestError(payload))
      } else if (resp.status >= 500 && resp.status <= 599) {
        return Err(new ServiceUnavailable())
      }

      return Err(new UnexpectedStatus(resp.status))
    } catch (e) {
      return Err(new NetworkError(e))
    }
  }
}

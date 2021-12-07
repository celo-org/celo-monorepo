import { ServiceContext as OdisServiceContext } from '@celo/identity/lib/odis/query'
import {
  checkSequentialDelayRateLimit,
  domainHash,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponse,
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  Endpoints,
  SequentialDelayDomain,
  SequentialDelayDomainState,
  verifyDomainQuotaStatusRequestSignature,
  verifyDomainRestrictedSignatureRequestSignature,
} from '@celo/phone-number-privacy-common'
import debugFactory from 'debug'

const debug = debugFactory('kit:encrypted-backup:odis:mock')

export const MOCK_ODIS_ENVIRONMENT: OdisServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}

export class MockOdis {
  static readonly environment = MOCK_ODIS_ENVIRONMENT

  state: Record<string, SequentialDelayDomainState> = {}

  quota(
    req: DomainQuotaStatusRequest<SequentialDelayDomain>
  ): { status: number; body: DomainQuotaStatusResponse } {
    const authorized = verifyDomainQuotaStatusRequestSignature(req)
    if (!authorized) {
      return {
        status: 401,
        body: {
          success: false,
          version: 'mock',
          error: 'unauthorized',
        },
      }
    }

    const hash = domainHash(req.domain).toString('hex')
    const domainState = this.state[hash] ?? { timer: 0, counter: 0, disabled: false }
    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        status: domainState,
      },
    }
  }

  sign(
    req: DomainRestrictedSignatureRequest<SequentialDelayDomain>
  ): { status: number; body: DomainRestrictedSignatureResponse } {
    const authorized = verifyDomainRestrictedSignatureRequestSignature(req)
    if (!authorized) {
      return {
        status: 401,
        body: {
          success: false,
          version: 'mock',
          error: 'unauthorized',
        },
      }
    }

    const hash = domainHash(req.domain).toString('hex')
    const domainState = this.state[hash] ?? { timer: 0, counter: 0, disabled: false }
    const nonce = req.options.nonce.defined ? req.options.nonce.value : undefined
    if (nonce !== domainState.counter) {
      return {
        status: 403,
        body: {
          success: false,
          version: 'mock',
          error: 'incorrect nonce',
        },
      }
    }

    const limitCheck = checkSequentialDelayRateLimit(req.domain, Date.now() / 1000, domainState)
    if (!limitCheck.accepted || limitCheck.state === undefined) {
      return {
        status: 429,
        body: {
          success: false,
          version: 'mock',
          error: 'request limit exceeded',
        },
      }
    }
    this.state[hash] = limitCheck.state

    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        signature: Buffer.from(
          `<signature on ${req.blindedMessage} in domain ${hash}>`,
          'utf8'
        ).toString('base64'),
      },
    }
  }

  installQuotaEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(Endpoints.DOMAIN_QUOTA_STATUS, MockOdis.environment.odisUrl).href,
        method: 'POST',
      },
      override ??
        ((url: string, req: { body: string }) => {
          const res = this.quota(
            JSON.parse(req.body) as DomainQuotaStatusRequest<SequentialDelayDomain>
          )
          debug('Mocking request', { url, req, res })
          return res
        })
    )
  }

  installSignEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(Endpoints.DOMAIN_SIGN, MockOdis.environment.odisUrl).href,
        method: 'POST',
      },
      override ??
        ((url: string, req: { body: string }) => {
          const res = this.sign(
            JSON.parse(req.body) as DomainRestrictedSignatureRequest<SequentialDelayDomain>
          )
          debug('Mocking request', { url, req, res })
          return res
        })
    )
  }

  install(mock: typeof fetchMock) {
    this.installQuotaEndpoint(mock)
    this.installSignEndpoint(mock)
  }
}

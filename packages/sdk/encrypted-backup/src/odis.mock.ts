import { ServiceContext as OdisServiceContext } from '@celo/identity/lib/odis/query'
import {
  checkSequentialDelayRateLimit,
  DomainEndpoint,
  domainHash,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponse,
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  SequentialDelayDomain,
  SequentialDelayDomainState,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
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

  private now = () => Date.now() / 1000

  private domainState(hash: Buffer) {
    return (
      this.state[hash.toString('hex')] ?? { timer: 0, counter: 0, disabled: false, now: this.now() }
    )
  }

  quota(
    req: DomainQuotaStatusRequest<SequentialDelayDomain>
  ): { status: number; body: DomainQuotaStatusResponse } {
    const authorized = verifyDomainQuotaStatusRequestAuthenticity(req)
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

    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        status: this.domainState(domainHash(req.domain)),
      },
    }
  }

  sign(
    req: DomainRestrictedSignatureRequest<SequentialDelayDomain>
  ): { status: number; body: DomainRestrictedSignatureResponse } {
    const authorized = verifyDomainRestrictedSignatureRequestAuthenticity(req)
    if (!authorized) {
      return {
        status: 401,
        body: {
          success: false,
          version: 'mock',
          error: 'unauthorized',
          status: undefined,
        },
      }
    }

    const hash = domainHash(req.domain)
    const domainState = this.domainState(hash)
    const nonce = req.options.nonce.defined ? req.options.nonce.value : undefined
    if (nonce !== domainState.counter) {
      return {
        status: 403,
        body: {
          success: false,
          version: 'mock',
          error: 'incorrect nonce',
          status: domainState,
        },
      }
    }

    const limitCheck = checkSequentialDelayRateLimit(req.domain, this.now(), domainState)
    if (!limitCheck.accepted || limitCheck.state === undefined) {
      return {
        status: 429,
        body: {
          success: false,
          version: 'mock',
          error: 'request limit exceeded',
          status: domainState,
        },
      }
    }
    this.state[hash.toString('hex')] = limitCheck.state

    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        signature: Buffer.from(
          `<signature on ${req.blindedMessage} in domain ${hash.toString('hex')}>`,
          'utf8'
        ).toString('base64'),
        status: domainState,
      },
    }
  }

  installQuotaEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(DomainEndpoint.DOMAIN_QUOTA_STATUS, MockOdis.environment.odisUrl).href,
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
        url: new URL(DomainEndpoint.DOMAIN_SIGN, MockOdis.environment.odisUrl).href,
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

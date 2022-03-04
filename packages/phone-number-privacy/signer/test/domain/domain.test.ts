import { defined, noBool, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import {
  DomainIdentifiers,
  //DomainRestrictedSignatureRequest,
  //DomainQuotaStatusRequest,
  DisableDomainRequest,
  SequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { instance, mock, reset, verify, when } from 'ts-mockito'
import config, { SupportedDatabase } from '../../src/config'
import { closeDatabase, initDatabase } from '../../src/database/database'
import { DomainService } from '../../src/domain/domain.service'
import { DomainAuthService } from '../../src/domain/auth/domainAuth.service'
import { DomainQuotaService } from '../../src/domain/quota/domainQuota.service'

config.db.type = SupportedDatabase.Sqlite

describe('domainService', () => {
  const requestMock = mock<Request>()
  const request = instance(requestMock)

  const responseMock = mock<Response>()
  const response = instance(responseMock)

  const authServiceMock = mock(DomainAuthService)
  const authService = instance(authServiceMock)

  const quotaServiceMock = mock(DomainQuotaService)
  const quotaService = instance(quotaServiceMock)

  const domainService = new DomainService(authService, quotaService)

  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]!

  const authenticatedDomain: SequentialDelayDomain = {
    name: DomainIdentifiers.SequentialDelay,
    version: '1',
    stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
    address: defined(walletAddress),
    salt: noString,
  }

  /*
  const signatureRequest: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    blindedMessage: '<blinded message>',
    sessionID: noString,
  }

  const quotaRequest: DomainQuotaStatusRequest<SequentialDelayDomain> = {
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    sessionID: noString,
  }
  */

  const disableRequest: DisableDomainRequest<SequentialDelayDomain> = {
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    sessionID: noString,
  }

  beforeAll(() => {
    response.locals = { logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }
  })

  beforeEach(async () => {
    await initDatabase()
    reset(authServiceMock)
    reset(quotaServiceMock)
    reset(responseMock)
    reset(requestMock)
  })

  afterEach(async () => {
    await closeDatabase()
  })

  describe('.handleDisableDomain', () => {
    it.only('Should respond with 200 on valid request', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)
      when(responseMock.status(200)).thenReturn(response)
      request.body = disableRequest

      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(200)).once()
    })

    it('Should respond with 403 on failed auth', async () => {
      when(authServiceMock.authCheck()).thenReturn(false)
      when(responseMock.status(403)).thenReturn(response)
      request.body = { domain: 'domain' }

      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(403)).once()
    })

    it('Should respond with 404 on unknown domain', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)
      when(responseMock.status(404)).thenReturn(response)
      request.body = { domain: 'Some unknown domain' }

      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(404)).once()
    })
  })
})

import { defined, noBool, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import {
  DomainIdentifiers,
  DomainRestrictedSignatureRequest,
  DomainQuotaStatusRequest,
  DisableDomainRequest,
  genSessionID,
  SequentialDelayDomain,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { anyNumber, instance, mock, reset, verify, when } from 'ts-mockito'
import config, { SupportedDatabase, SupportedKeystore } from '../../src/config'
import { closeDatabase, initDatabase } from '../../src/database/database'
import { DomainService } from '../../src/domain/domain.service'
import { DomainAuthService } from '../../src/domain/auth/domainAuth.service'
import { DomainQuotaService } from '../../src/domain/quota/domainQuota.service'
import { initKeyProvider } from '../../src/key-management/key-provider'

// We will be using a Sqlite in-memory database for tests.
config.db.type = SupportedDatabase.Sqlite
config.keystore.type = SupportedKeystore.MockSecretManager

describe('domainService', () => {
  const requestMock = mock<Request>()
  const request = instance(requestMock)

  const responseMock = mock<Response>()
  const response = instance(responseMock)

  // TODO(victor): Use the real auth service by default, once implemented, for this test.
  const authServiceMock = mock(DomainAuthService)
  const authService = instance(authServiceMock)

  const domainService = new DomainService(authService, new DomainQuotaService())

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

  const signatureRequest = (): DomainRestrictedSignatureRequest<SequentialDelayDomain> => ({
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    blindedMessage: '<blinded message>',
    sessionID: defined(genSessionID()),
  })

  const quotaRequest = (): DomainQuotaStatusRequest<SequentialDelayDomain> => ({
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    sessionID: defined(genSessionID()),
  })

  const disableRequest = (): DisableDomainRequest<SequentialDelayDomain> => ({
    domain: authenticatedDomain,
    options: {
      signature: noString,
      nonce: defined(0),
    },
    sessionID: defined(genSessionID()),
  })

  beforeAll(async () => {
    // DO NOT MERGE: Put the logger into some kind of test mode.
    response.locals = { logger: rootLogger() }
    await initKeyProvider()
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    await initDatabase()
    reset(authServiceMock)
    reset(responseMock)
    reset(requestMock)

    // Allows for call chaining after setting the status.
    when(responseMock.status(anyNumber())).thenReturn(response)
  })

  afterEach(async () => {
    // Close and destroy the in memory database after each test.
    await closeDatabase()
  })

  describe('.handleDisableDomain', () => {
    it('Should respond with 200 on valid request', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)

      request.body = disableRequest()
      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(200)).once()
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)

      request.body = disableRequest()
      await domainService.handleDisableDomain(request, response)

      request.body = disableRequest()
      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(200)).twice()
    })

    it('Should respond with 403 on failed auth', async () => {
      when(authServiceMock.authCheck()).thenReturn(false)

      request.body = disableRequest()
      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(403)).once()
    })

    it('Should respond with 400 on unknown domain', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)

      request.body = disableRequest()
      request.body.domain.name = 'UnknownDomain'
      await domainService.handleDisableDomain(request, response)

      verify(responseMock.status(400)).once()
    })
  })

  describe('.handleGetDomainQuotaStatus', () => {
    it('Should respond with 200 on valid request', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)

      request.body = quotaRequest()
      await domainService.handleGetDomainQuotaStatus(request, response)

      verify(responseMock.status(200)).once()
    })
  })

  describe.only('.handleGetDomainRestrictedSignature', () => {
    it('Should respond with 200 on valid request', async () => {
      when(authServiceMock.authCheck()).thenReturn(true)

      request.body = signatureRequest()
      await domainService.handleGetDomainRestrictedSignature(request, response)

      verify(responseMock.status(200)).once()
    })
  })
})

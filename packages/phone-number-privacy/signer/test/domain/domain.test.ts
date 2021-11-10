import { anything, instance, mock, reset, verify, when } from 'ts-mockito'
import { beforeEach } from 'jest-circus'
import { DomainService } from '../../src/domain/domain.service'
import { Request, Response } from 'express'
import { DomainAuthService } from '../../src/domain/auth/domainAuth.service'
import { DomainQuotaService } from '../../src/domain/quota/domainQuota.service'

describe('Domain service tests', () => {
  const requestMock = mock<Request>()
  const request = instance(requestMock)

  const responseMock = mock<Response>()
  const response = instance(responseMock)

  const authServiceMock = mock(DomainAuthService)
  const authService = instance(authServiceMock)

  const quotaServiceMock = mock(DomainQuotaService)
  const quotaService = instance(quotaServiceMock)

  const domainService = new DomainService(authService, quotaService)

  beforeAll(() => {
    response.locals = { logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }
  })

  beforeEach(() => {
    reset(authServiceMock)
    reset(quotaServiceMock)
    reset(responseMock)
    reset(requestMock)
  })

  it('Should respond with 403 on failed auth', async () => {
    when(authServiceMock.authCheck(anything(), anything(), anything())).thenReturn(false)
    when(responseMock.status(403)).thenReturn(response)
    request.body = { domain: 'domain' }

    await domainService.handleDisableDomain(request, response)

    verify(responseMock.status(403)).once()
  })

  it('Should respond with 404 on unknown domain', async () => {
    when(authServiceMock.authCheck(anything(), anything(), anything())).thenReturn(true)
    when(responseMock.status(404)).thenReturn(response)
    request.body = { domain: { name: 'Some unknown domain' } }

    await domainService.handleDisableDomain(request, response)

    verify(responseMock.status(404)).once()
  })
})

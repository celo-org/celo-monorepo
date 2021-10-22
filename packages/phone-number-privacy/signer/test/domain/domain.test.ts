import { instance, mock, reset, verify, when } from 'ts-mockito'
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

  beforeEach(() => {
    reset(authServiceMock)
    reset(quotaServiceMock)
    reset(responseMock)
    reset(requestMock)

    when(response.locals.logger).thenReturn({})
  })

  it('Should respond with 403 on failed auth', async () => {
    when(authServiceMock.authCheck()).thenReturn(false)
    when(requestMock.body.domain).thenReturn({})

    await domainService.handleDisableDomain(request, response)

    verify(response.status(403)).called()
  })
})

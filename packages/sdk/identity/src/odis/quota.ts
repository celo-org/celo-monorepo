import { Address } from '@celo/base'
import {
  CombinerEndpoint,
  PnpQuotaRequest,
  PnpQuotaResponseSchema,
} from '@celo/phone-number-privacy-common'
import { AuthSigner, getOdisPnpRequestAuth, queryOdis, ServiceContext } from './query'

export interface PnpClientQuotaStatus {
  version: string
  performedQueryCount: number
  totalQuota: number
  remainingQuota: number
  blockNumber?: number
  warnings?: string[]
}

export async function getPnpQuotaStatus(
  account: Address,
  signer: AuthSigner,
  context: ServiceContext,
  clientVersion?: string,
  sessionID?: string
): Promise<PnpClientQuotaStatus> {
  const body: PnpQuotaRequest = {
    account,
    version: clientVersion,
    authenticationMethod: signer.authenticationMethod,
    sessionID,
  }

  const response = await queryOdis(
    body,
    context,
    CombinerEndpoint.PNP_QUOTA,
    PnpQuotaResponseSchema,
    {
      Authorization: await getOdisPnpRequestAuth(body, signer),
    }
  )

  if (response.success) {
    return {
      version: response.version,
      performedQueryCount: response.performedQueryCount,
      totalQuota: response.totalQuota,
      remainingQuota: response.totalQuota - response.performedQueryCount,
      warnings: response.warnings,
      blockNumber: response.blockNumber,
    }
  }

  throw new Error(response.error)
}

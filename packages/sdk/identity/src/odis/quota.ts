import { Address } from '@celo/base'
import {
  CombinerEndpoint,
  PnpQuotaRequest,
  PnpQuotaResponse,
} from '@celo/phone-number-privacy-common'
import { AuthSigner, ErrorMessages, queryOdis, ServiceContext } from './query'

export async function getQuotaStatus(
  account: Address,
  signer: AuthSigner,
  context: ServiceContext,
  clientVersion?: string,
  sessionID?: string
): Promise<number> {
  const body: PnpQuotaRequest = {
    account,
    version: clientVersion ? clientVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
    sessionID,
  }

  const response = await queryOdis<PnpQuotaResponse>(
    signer,
    body,
    context,
    CombinerEndpoint.PNP_QUOTA
  )

  if (response.success) {
    return response.totalQuota - response.performedQueryCount
  }

  throw new Error(ErrorMessages.ODIS_QUOTA_ERROR + ': ' + response.error)
}

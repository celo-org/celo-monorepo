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
  blockNumber?: number // TODO fully remove blockNumber from identity sdk
  warnings?: string[]
}

/**
 * Query the ODIS quota status of a given account
 *
 * @param account The address whose ODIS quota we are querying
 * @param signer Object containing the private key used to authenticate the ODIS request
 * @param context Specifies which ODIS combiner url should be queried (i.e. mainnet or alfajores)
 * @param clientVersion Optional Specifies the client software version
 * @param sessionID Optional Used to track user sessions across the client and ODIS
 * @param abortController Optional Allows client to specify a timeout for the ODIS request
 */
export async function getPnpQuotaStatus(
  account: Address,
  signer: AuthSigner,
  context: ServiceContext,
  clientVersion?: string,
  sessionID?: string,
  abortController?: AbortController
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
    },
    abortController
  )

  if (response.success) {
    return {
      version: response.version,
      performedQueryCount: response.performedQueryCount,
      totalQuota: response.totalQuota,
      remainingQuota: response.totalQuota - response.performedQueryCount,
      warnings: response.warnings,
    }
  }

  throw new Error(response.error)
}

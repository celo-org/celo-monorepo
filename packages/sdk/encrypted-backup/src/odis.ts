import { Address } from '@celo/base/lib/address'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import {
  ErrorMessages,
  queryOdis,
  ServiceContext as OdisServiceContext,
} from '@celo/identity/lib/odis/query'
import {
  AuthenticationMethod,
  checkSequentialDelayRateLimit,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  Endpoints,
  genSessionID,
  SequentialDelayDomain,
  SequentialDelayDomainState,
} from '@celo/phone-number-privacy-common'
import { defined, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import * as crypto from 'crypto'
import { OdisHardeningConfig } from './config'
import {
  AuthorizationError,
  BackupError,
  FetchError,
  OdisRateLimitingError,
  OdisServiceError,
  OdisVerificationError,
} from './errors'
import { deriveKey, EIP712Wallet, KDFInfo } from './utils'

/**
 * DO NOT MERGE(victor): Update this comment.
 * Builds an ODIS SequentialDelayDomain with recommended rate limiting for a 6-digit PIN.
 *
 * @param authorizer Address of the key that should authorize requests to ODIS.
 * @returns A SequentialDelayDomain with a recommended rate limiting configuration.
 */
export function buildOdisDomain(
  config: OdisHardeningConfig,
  authorizer: Address,
  salt?: string
): SequentialDelayDomain {
  return {
    name: DomainIdentifiers.SequentialDelay,
    version: '1',
    stages: config.rateLimit,
    address: defined(authorizer),
    salt: salt ? defined(salt) : noString,
  }
}

// DO NOT MERGE(victor) Document this function including why `wallet` is optional.
export async function odisHardenKey(
  key: Buffer,
  domain: SequentialDelayDomain,
  environment: OdisServiceContext,
  wallet?: EIP712Wallet
): Promise<Result<Buffer, BackupError>> {
  // Allow this function to be called in tests, but not in any other environment. This safety gate
  // can be removed when the POPRF verification function is implemented and added below.
  if (process?.env?.JEST_WORKER_ID === undefined && process?.env?.NODE_ENV !== 'test') {
    throw new Error('ODIS POPRF function is not yet available')
  }

  // Session ID for logging requests.
  const sessionID = genSessionID()

  // Request the quota status for the domain to get the state, including the quota counter.
  const quotaResp = await requestOdisQuotaStatus(domain, environment, sessionID, wallet)
  if (!quotaResp.ok) {
    return quotaResp
  }

  // Check locally whether or not we should expect to be able to make a query to ODIS right now.
  // TODO(victor) Using Date.now is actually not appropriate because mobile clients may have a large
  // clock drift. Modify this to use a time returned from ODIS either in the status response, or as
  // part of the 429 response upon rejecting the signature request. Risk with the latter approach is
  // that unless replay handling is implemented, having the request accepted by half of the signers,
  // but rejected by the other half can get the client into a bad state.
  const quotaState = quotaResp.result.status as SequentialDelayDomainState
  const { accepted, notBefore } = checkSequentialDelayRateLimit(
    domain,
    // Dividing by 1000 to convert ms to seconds for the rate limit check.
    Date.now() / 1000,
    quotaState
  )
  if (!accepted) {
    return Err(
      new OdisRateLimitingError(
        notBefore,
        new Error('client does not currently have quota based on status response.')
      )
    )
  }

  // Instantiate a blinding client and blind the key derived from the users password to be hardened.
  // DO NOT MERGE(victor): Add a note that this assumes we are talking to the combiners.
  const blindingSeed = crypto.randomBytes(16)
  const blindingClient = new WasmBlsBlindingClient(environment.odisPubKey)
  const blindedMessage = await blindingClient.blindMessage(key.toString('base64'), blindingSeed)

  // Request the partial oblivious signature from ODIS.
  // Note that making this request will, if successful, result in quota being used in the domain.
  const signatureResp = await requestOdisDomainSignature(
    blindedMessage,
    quotaState.counter,
    domain,
    environment,
    sessionID,
    wallet
  )
  if (!signatureResp.ok) {
    return signatureResp
  }

  // Unblind the signature response received from ODIS to get the POPRF output.
  let odisOutput: Buffer
  try {
    // TODO(victor): Once the pOPRF implementation is available, use that instead.
    const odisOutputBase64 = await blindingClient.unblindAndVerifyMessage(
      signatureResp.result.signature
    )
    odisOutput = Buffer.from(odisOutputBase64, 'base64')
  } catch (error) {
    return Err(new OdisVerificationError(error as Error))
  }

  // Mix the key with the output from ODIS to get the hardened key.
  return Ok(deriveKey(KDFInfo.ODIS_KEY_HARDENING, [key, odisOutput]))
}

/**
 * Derive from the nonce a private key and use it to instantiate a wallet for request signing
 *
 * @remarks It is important that the auth key does not mix in entropy from the password value. If
 * it did, then the derived address and signatures would act as a commitment to the underlying
 * password value and would allow offline brute force attacks when combined with the other values
 * mixed into the key value.
 */
export function odisQueryAuthorizer(nonce: Buffer): { address: Address; wallet: EIP712Wallet } {
  // Derive the domain's request authorization key from the backup nonce.
  const authKey = deriveKey(KDFInfo.ODIS_AUTH_KEY, [nonce])
  const wallet = new LocalWallet()
  wallet.addAccount(authKey.toString('hex'))
  const address = wallet.getAccounts()[0]
  if (address === undefined) {
    // Throw the error instead if returning it as this is more akin to a panic.
    throw new Error('Implementation error: LocalWallet with an added account returned no accounts')
  }
  return { address, wallet }
}

async function requestOdisQuotaStatus(
  domain: SequentialDelayDomain,
  environment: OdisServiceContext,
  sessionID: string,
  wallet?: EIP712Wallet
): Promise<Result<DomainQuotaStatusResponseSuccess, BackupError>> {
  const quotaStatusReq: DomainQuotaStatusRequest<SequentialDelayDomain> = {
    domain,
    options: {
      signature: noString,
      nonce: noNumber,
    },
    sessionID: defined(sessionID),
  }

  // If a query authorizer is defined in the domain, include a siganture over the request.
  const authorizer = domain.address.defined ? domain.address.value : undefined
  if (authorizer !== undefined) {
    if (wallet === undefined || !wallet.hasAccount(authorizer)) {
      return Err(
        new AuthorizationError(
          new Error('key for signing ODIS quota status request is unavailable')
        )
      )
    }
    quotaStatusReq.options.signature = defined(
      await wallet.signTypedData(authorizer, domainQuotaStatusRequestEIP712(quotaStatusReq))
    )
  }

  let quotaResp: DomainQuotaStatusResponse
  try {
    quotaResp = await queryOdis<DomainQuotaStatusResponse>(
      { authenticationMethod: AuthenticationMethod.NONE },
      quotaStatusReq,
      environment,
      Endpoints.DOMAIN_QUOTA_STATUS
    )
  } catch (error) {
    if ((error as Error).message?.includes(ErrorMessages.ODIS_FETCH_ERROR)) {
      return Err(new FetchError(error as Error))
    }
    return Err(new OdisServiceError(error as Error))
  }
  if (!quotaResp.success) {
    return Err(new OdisServiceError(new Error(quotaResp.error), quotaResp.version))
  }

  return Ok(quotaResp)
}

async function requestOdisDomainSignature(
  blindedMessage: string,
  counter: number,
  domain: SequentialDelayDomain,
  environment: OdisServiceContext,
  sessionID: string,
  wallet?: EIP712Wallet
): Promise<Result<DomainRestrictedSignatureResponseSuccess, BackupError>> {
  const signatureReq: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
    domain,
    options: {
      signature: noString,
      nonce: defined(counter),
    },
    blindedMessage,
    sessionID: defined(sessionID),
  }

  // If a query authorizer is defined in the domain, include a siganture over the request.
  // DO NOT MERGE(victor): Also error if the user provides a wallet, but the domain is unauthorized.
  const authorizer = domain.address.defined ? domain.address.value : undefined
  if (authorizer !== undefined) {
    if (wallet === undefined || !wallet.hasAccount(authorizer)) {
      return Err(
        new AuthorizationError(
          new Error('key for signing ODIS domain signature request is unavailable')
        )
      )
    }
    signatureReq.options.signature = defined(
      await wallet.signTypedData(authorizer, domainRestrictedSignatureRequestEIP712(signatureReq))
    )
  }

  let signatureResp: DomainRestrictedSignatureResponse
  try {
    signatureResp = await queryOdis<DomainRestrictedSignatureResponse>(
      { authenticationMethod: AuthenticationMethod.NONE },
      signatureReq,
      environment,
      Endpoints.DOMAIN_SIGN
    )
  } catch (error) {
    if ((error as Error).message?.includes(ErrorMessages.ODIS_FETCH_ERROR)) {
      return Err(new FetchError(error as Error))
    }
    if ((error as Error).message?.includes(ErrorMessages.ODIS_RATE_LIMIT_ERROR)) {
      return Err(new OdisRateLimitingError(undefined, error as Error))
    }
    return Err(new OdisServiceError(error as Error))
  }
  if (!signatureResp.success) {
    return Err(new OdisServiceError(new Error(signatureResp.error), signatureResp.version))
  }

  return Ok(signatureResp)
}

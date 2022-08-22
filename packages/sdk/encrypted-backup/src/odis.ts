import { Address } from '@celo/base/lib/address'
import { Err, Ok, Result } from '@celo/base/lib/result'
import {
  ErrorMessages,
  sendOdisDomainRequest,
  ServiceContext as OdisServiceContext,
} from '@celo/identity/lib/odis/query'
import {
  checkSequentialDelayRateLimit,
  DomainEndpoint,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponse,
  domainQuotaStatusResponseSchema,
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSchema,
  DomainRestrictedSignatureResponseSuccess,
  genSessionID,
  PoprfClient,
  SequentialDelayDomain,
  SequentialDelayDomainState,
  SequentialDelayDomainStateSchema,
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
  UsageError,
} from './errors'
import { deriveKey, EIP712Wallet, KDFInfo } from './utils'

/**
 * Builds an ODIS SequentialDelayDomain with the given hardening configuration.
 *
 * @param authorizer Address of the key that should authorize requests to ODIS.
 * @returns A SequentialDelayDomain with the provided rate limiting configuration.
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

/**
 * Returns a hardened key derived from the input key material and a POPRF evaluation on that keying
 * material under the given rate limiting domain.
 *
 * @param key Input key material which will be the blinded input to the ODIS POPRF.
 * @param domain Rate limiting configuration and domain input to the ODIS POPRF.
 * @param environment Information for the targeted ODIS environment.
 * @param wallet Wallet with access to the authorizer signing key specified in the domain input.
 *        Should be provided if the input domain is authenticated.
 */
export async function odisHardenKey(
  key: Buffer,
  domain: SequentialDelayDomain,
  environment: OdisServiceContext,
  wallet?: EIP712Wallet
): Promise<Result<Buffer, BackupError>> {
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
  // NOTE: We do not include a response aggregation step here because it is assumed that we are
  // talking to the combiner service, as opposed to talking directly to the signers.
  const blindingSeed = crypto.randomBytes(16)
  const poprfClient = new PoprfClient(
    Buffer.from(environment.odisPubKey, 'base64'),
    domainHash(domain),
    key,
    blindingSeed
  )

  // Request the partial oblivious signature from ODIS.
  // Note that making this request will, if successful, result in quota being used in the domain.
  const signatureResp = await requestOdisDomainSignature(
    poprfClient.blindedMessage.toString('base64'),
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
    odisOutput = await poprfClient.unblindResponse(
      Buffer.from(signatureResp.result.signature, 'base64')
    )
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
  } else if (wallet !== undefined) {
    return Err(new UsageError(new Error('wallet provided but the domain is unauthenticated')))
  }

  let quotaResp: DomainQuotaStatusResponse
  try {
    quotaResp = await sendOdisDomainRequest(
      quotaStatusReq,
      environment,
      DomainEndpoint.DOMAIN_QUOTA_STATUS,
      domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)
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
  } else if (wallet !== undefined) {
    return Err(new UsageError(new Error('wallet provided but the domain is unauthenticated')))
  }

  let signatureResp: DomainRestrictedSignatureResponse
  try {
    signatureResp = await sendOdisDomainRequest(
      signatureReq,
      environment,
      DomainEndpoint.DOMAIN_SIGN,
      DomainRestrictedSignatureResponseSchema
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

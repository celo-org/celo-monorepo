import { Address } from '@celo/base/lib/address'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ReadOnlyWallet } from '@celo/connect'
import {
  AuthenticationMethod,
  checkSequentialDelayRateLimit,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusResponse,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  Endpoints,
  SequentialDelayDomain,
  SequentialDelayDomainState,
  genSessionID,
} from '@celo/phone-number-privacy-common'
import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import { queryOdis, ServiceContext } from '@celo/identity/lib/odis/query'
import { defined, noBool, noString, noNumber } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import { BackupError, ImplementationError, OdisError, RateLimitingError } from './errors'
import { deriveKey, EIP712Wallet, KDFInfo } from './utils'

export function pinHardeningDomain(authorizer: Address): SequentialDelayDomain {
  return {
    name: DomainIdentifiers.SequentialDelay,
    version: '1',
    stages: [
      // First stage is setup, as the user will need to make a single query to create their backup.
      {
        delay: defined(0),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      // On the first day, the client has 10 attempts. 5 within 10s. 5 more over roughly 45 minutes.
      {
        delay: defined(0),
        resetTimer: defined(true),
        batchSize: defined(3),
        repetitions: noNumber,
      },
      {
        delay: defined(10),
        resetTimer: defined(true),
        batchSize: defined(2),
        repetitions: noNumber,
      },
      {
        delay: defined(30),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(60),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(300),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(900),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(1800),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      // On seconds day, the client has 5 attempts over roughly 2 minutes.
      {
        delay: defined(86400),
        resetTimer: defined(true),
        batchSize: defined(2),
        repetitions: noNumber,
      },
      {
        delay: defined(10),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(30),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(60),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      // On third day, the client has 3 attempts over roughly 40 seconds.
      {
        delay: defined(86400),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(10),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(30),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      // On fourth day, the client has 2 attempts over roughly 10 seconds.
      {
        delay: defined(86400),
        resetTimer: defined(true),
        batchSize: defined(1),
        repetitions: noNumber,
      },
      {
        delay: defined(10),
        resetTimer: defined(false),
        batchSize: defined(1),
        repetitions: noNumber,
      },
    ],
    address: authorizer,
    salt: noString,
  }
}

// TODO(victor): See what logic might be moved into @celo/identity
export async function odisHardenKey(
  key: Buffer,
  wallet: EIP712Wallet,
  domain: SequentialDelayDomain,
  context: ServiceContext
): Result<Buffer, BackupError> {
  const authorizer: Address = domain.address.defined ? domain.address.value : undefined
  if (authorizer !== undefined && !wallet.hasAccount(authorizer)) {
    return Err(new AuthorizationError())
  }

  // Session ID for logging requsests.
  const sessionID = genSessionID()

  // Request the quota status the domain to get the state, including the quota counter.
  const quotaResp = await requestOdisQuotaStatus(wallet, domain, context, sessionID)
  if (!quotaResp.ok) {
    return quotaResp
  }

  // Check locally whether or not we should expect to be able to make a query to ODIS right now.
  const quotaState = quotaResp.result.status as SequentialDelayDomainState
  const { accepted, notBefore } = checkSequentialDelayRateLimit(
    domain,
    Date.now() / 1000,
    quotaState
  )
  if (!accepted) {
    return Err(new RateLimitingError(notBefore))
  }

  // Instantiate a blinding client and blind the key, containing the users password to be hardended.
  const blindingSeed = crypto.randomBytes(16)
  const blindingClient = new WasmBlsBlindingClient(context.odisPubKey)
  const blindedMessage = await blindingClient.blindedMessage(key.toString('base64'), blindingSeed)

  // Request the partial oblivious signature from ODIS.
  // Note that making this request will, if successful, result in quota being used in the domain.
  const signatureResp = await requestOdisDomainSignature(
    blindedMessage,
    wallet,
    domain,
    context,
    sessionID
  )
  if (!signatureResp.ok) {
    return signatureResp
  }

  // Unblind the signature response received from ODIS to get the POPRF output.
  let odisOutput: Buffer
  try {
    const odisOutputBase64 = await blindingClient.unblindAndVerifyMessage(
      signatureResp.result.signature
    )
    odisOutput = Buffer.from(odisOutputBase64, 'base64')
  } catch (error) {
    return Err(new OdisError(error))
  }

  // Mix the key with the output from ODIS to get the hardened key.
  return Ok(deriveKey(KDFInfo.ODIS_KEY_HARDENING, [key, odisOutput]))
}

/**
 * Derive from the nonce a private key and use it to instanciate a wallet for request signing
 *
 * @remarks It is important that the auth key does not mix in entropy from the input key value. If
 * it did, then the derived address and signatures would act as a commitment to the underlying
 * password value and would allow offline brute force attacks when combined with the other values
 * mixed into the key value.
 */
export function odisQueryAuthorizer(nonce: Buffer): { address: Address; wallet: EIP712Wallet } {
  // Derive the domain's request authorization key from the backup nonce.
  const authKey = deriveKey(KDFInfo.ODIS_AUTH_KEY, [nonce], 32)
  const wallet = new LocalWallet()
  wallet.addAccount(authKey)
  const address = wallet.getAccounts()[0]
  if (address === undefined) {
    throw new Error('Implementation error: LocalWallet with an added account returned no accounts')
  }
  return { address, wallet }
}

async function requestOdisQuotaStatus(
  wallet: EIP712Wallet,
  domain: SequentialDelayDomain,
  context: ServiceContext,
  sessionID: string
): Result<DomainQuotaStatusResponseSuccess, OdisError> {
  const quotaStatusReq: DomainQuotaStatusRequest<SequentialDelayDomain> = {
    domain,
    options: {
      signature: noString,
      nonce: noNumber,
    },
    sessionID: defined(sessionID),
  }
  quotaStatusReq.options.signature = defined(
    await wallet.signTypedData(authorizer, domainQuotaStatusRequestEIP712(quotaStatusReq))
  )
  try {
    const quotaResp = await queryOdis<DomainQuotaStatusResponse>(
      { authenticationMethod: AuthenticationMethod.NONE },
      quotaStatusReq,
      context,
      Endpoints.DOMAIN_QUOTA_STATUS
    )
  } catch (error) {
    return Err(new OdisError(error))
  }
  if (!quotaResp.success) {
    return Err(new OdisError(new Error(quotaResp.error), quotaResp.version))
  }

  return Ok(quotaResp)
}

async function requestOdisDomainSignature(
  blindedMessage: string,
  wallet: EIP712Wallet,
  domain: SequentialDelayDomain,
  context: ServiceContext,
  sessionID: string
): Result<DomainRestrictedSignatureResponseSuccess, OdisError> {
  const signatureReq: DomainQuotaStatusRequest<SequentialDelayDomain> = {
    domain,
    options: {
      signature: noString,
      nonce: defined(quotaState.counter),
    },
    blindedMessage,
    sessionID: defined(sessionID),
  }
  signatureReq.options.signature = defined(
    await wallet.signTypedData(authorizer, domainRestrictedSignatureRequestEIP712(signatureReq))
  )
  try {
    const signatureResp = await queryOdis<DomainRestrictedSignatureResponse>(
      { authenticationMethod: AuthenticationMethod.NONE },
      signatureReq,
      context,
      Endpoints.DOMAIN_SIGN
    )
  } catch (error) {
    return Err(new OdisError(error))
  }
  if (!signatureResp.success) {
    return Err(new OdisError(new Error(signatureResp.error), signatureResp.version))
  }

  return Ok(signatureResp)
}

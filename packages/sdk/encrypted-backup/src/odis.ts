import { Err, Ok, Result } from '@celo/base/lib/result'
import {
  domainHash,
  DomainRestrictedSignatureRequest,
  SequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import { queryOdis, ServiceContext } from '@celo/identity/lib/odis/query'
import { LocalWallet } from '@celo/wallet-local'
import { BackupError, ImplementationError } from './errors'
import { deriveKey, KDFInfo } from './utils'

// TODO(victor): See what logic might be moved into @celo/identity
export async function odisHardenKey(
  key: Buffer,
  nonce: Buffer,
  domain: SequentialDelayDomain,
  context: ServiceContext
): Result<Buffer, BackupError> {
  // Derive the domain's request authorization key from the backup nonce.
  // NOTE: It is important that the auth key does not mix in entropy from the input key value. If it
  // did, then the derived address and signatures would act as a commitment to the underlying
  // password value and would allow offline brute force attacks when combined with the other values
  // mixed into the key value.
  const authKey = deriveKey(KDFInfo.ODIS_AUTH_KEY, [nonce], 32)
  const wallet = new LocalWallet()
  wallet.addAccount(authKey)
  const [authAddress] = wallet.getAccounts()
  if (authAddress === undefined) {
    // If authAddress is not defined, there is an error in the implementation of LocalWallet.
    return Err(new ImplementationError())
  }

  const quotaStatusReq: DomainQuotaStatusRequest<SequentialDelayDomain> = {}

  const request: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {}
}

import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { logger } from '@celo/phone-number-privacy-common'
import { getContractKit } from '../web3/contracts'

export async function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
  // TODO (amyslawson) wrap forno request in retry
  const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
  const {
    isVerified: _isVerified,
    completed,
    numAttestationsRemaining,
    total,
  } = await attestationsWrapper.getVerifiedStatus(hashedPhoneNumber, account)

  logger.debug({
    account,
    isVerified: _isVerified,
    completedAttestations: completed,
    remainingAttestations: numAttestationsRemaining,
    totalAttestationsRequested: total,
  })
  return _isVerified
}

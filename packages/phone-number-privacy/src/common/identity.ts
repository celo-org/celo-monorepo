import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import config from '../config'
import { getContractKit } from '../web3/contracts'
import logger from './logger'

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 */
export function authenticateUser() {
  logger.debug('Authenticating user')
  // TODO [amyslawson]
  return
}

export async function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
  // TODO (amyslawson) wrap forno request in retry
  // TODO (aslawson) update to work with hashed phoneNumber
  const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
  const attestationStats = await attestationsWrapper.getAttestationStat(hashedPhoneNumber, account)
  const numAttestationsCompleted = attestationStats.completed
  const numAttestationsRemaining =
    config.attestations.numberAttestationsRequired - numAttestationsCompleted
  return numAttestationsRemaining <= 0
}

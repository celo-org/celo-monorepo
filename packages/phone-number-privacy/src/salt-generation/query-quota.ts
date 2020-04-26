import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import config from '../config'
import { getPerformedQueryCount } from '../database/wrappers/account'
import { getContractKit } from '../web3/contracts'

export default class QueryQuota {
  /*
   * Returns how many queries the account can make based on the
   * calculated query quota and the number of queries already performed.
   */
  async getRemainingQueryCount(account: string, hashedPhoneNumber: string) {
    const queryQuota = await this.getQueryQuota(account, hashedPhoneNumber)
    const performedQueryCount = await getPerformedQueryCount(account)
    return queryQuota - performedQueryCount
  }

  /*
   * Calculates how many queries the caller has unlocked based on the algorithm
   * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
   */
  async getQueryQuota(account: string, hashedPhoneNumber: string) {
    // TODO (amyslawson) check balance meets a minimum before granting any quota
    let queryQuota = config.salt.unverifiedQueryMax
    if (await this.isVerified(account, hashedPhoneNumber)) {
      queryQuota += config.salt.additionalVerifiedQueryMax
      const transactionCount = await this.getTransactionCountFromAccount(account)
      queryQuota += config.salt.queryPerTransaction * transactionCount
    }
    return queryQuota
  }

  async isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
    // TODO (amyslawson) wrap forno request in retry
    // TODO (aslawson) update to work with hashed phoneNumber
    const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
    const attestationStats = await attestationsWrapper.getAttestationStat(
      hashedPhoneNumber,
      account
    )
    const numAttestationsCompleted = attestationStats.completed
    const numAttestationsRemaining =
      config.attestations.numberAttestationsRequired - numAttestationsCompleted
    return numAttestationsRemaining <= 0
  }

  async getTransactionCountFromAccount(account: string): Promise<number> {
    // TODO (amyslawson) wrap forno request in retry
    return getContractKit().web3.eth.getTransactionCount(account)
  }
}

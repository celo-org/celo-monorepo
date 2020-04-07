import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import fetch from 'node-fetch'
import config from '../config'
import { getPerformedQueryCount } from '../database/wrappers/accout'
import { getContractKit } from '../web3/contracts'

const NUM_ATTESTATIONS_REQUIRED = 3
const contractKit = getContractKit()

/*
 * Returns how many queries the account can make based on the
 * calculated query quota and the number of queries already performed.
 */
export async function getRemainingQueryCount(account: string, phoneNumber: string) {
  const queryQuota = await getQueryQuota(account, phoneNumber)
  const performedQueryCount = await getPerformedQueryCount(account).catch((reason) => {
    // TODO [amyslawson] think of failure case here
    console.error(reason)
    return 0
  })
  return queryQuota - performedQueryCount
}

/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 */
async function getQueryQuota(account: string, phoneNumber: string) {
  let queryQuota: number = config.salt.unverifiedQueryMax
  if (await isVerified(account, phoneNumber)) {
    queryQuota += config.salt.additionalVerifiedQueryMax
    const transactionCount = await getTransactionCountFromAccount(account)
    queryQuota += config.salt.queryPerTransaction * transactionCount
  }
  return queryQuota
}

async function isVerified(account: string, phoneNumber: string): Promise<boolean> {
  const attestationsWrapper: AttestationsWrapper = await contractKit.contracts.getAttestations()
  const attestationStats = await attestationsWrapper.getAttestationStat(phoneNumber, account)
  const numAttestationsCompleted = attestationStats.completed
  const numAttestationsRemaining = NUM_ATTESTATIONS_REQUIRED - numAttestationsCompleted
  return numAttestationsRemaining <= 0
}

async function getTransactionCountFromAccount(account: string): Promise<number> {
  // TODO [amyslawson] consider adding retry
  const transactionUrl = `${config.blockchain.blockscout}/api?module=account&action=tokentx&address=${account}`
  const resp = await fetch(transactionUrl)
  const jsonResp = await resp.json()
  if (jsonResp == null || jsonResp.result == null) {
    console.error(`Failed to get valid response for ${transactionUrl}`)
    return 0
  }
  return jsonResp.result.filter((transaction: any) => transaction.from === account).length
}

import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { BLINDBLS } from 'bls12377js-blind'
import * as functions from 'firebase-functions'
import fetch from 'node-fetch'
import config, { connectToDatabase } from './config'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from './models/account'
import { getContractKit } from './web3/contracts'

export const NUM_ATTESTATIONS_REQUIRED = 3

const contractKit = getContractKit()
const knex = connectToDatabase()

export const getSalt = functions.https.onRequest(async (request, response) => {
  confirmUser()
  const remainingQueryCount = await getRemainingQueryCount(
    request.body.account,
    request.body.phoneNumber
  )
  if (remainingQueryCount <= 0) {
    response.status(400).send('Requester exceeded salt service query quota')
    return
  }
  const salt = computeBLSSalt(request.body.queryPhoneNumber, response)
  await incrementQueryCount(request.body.account)
  response.json({ success: true, salt })
})

/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 */
function confirmUser() {
  //TODO [amyslawson]
  return
}

/*
 * Computes the BLS Salt for the blinded phone number.
 */
function computeBLSSalt(queryPhoneNumber: string, response: functions.Response) {
  try {
    const privateKey = new Buffer(config.salt.key)
    return BLINDBLS.computePRF(privateKey, new Buffer(queryPhoneNumber))
  } catch (e) {
    console.error('Failed to compute salt', e)
    response.status(500).send('Failed to compute salt')
  }
}

/*
 * Returns how many queries the account can make based on the
 * calculated query quota and the number of queries already performed.
 */
async function getRemainingQueryCount(account: string, phoneNumber: string) {
  const queryQuota = await getQueryQuota(account, phoneNumber)
  const performedQueryCount = await getPerformedQueryCount(account)
  return queryQuota - performedQueryCount
}

/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 */
async function getQueryQuota(account: string, phoneNumber: string) {
  let queryQuota: number = config.salt.unverifiedQueryCount
  if (await isVerified(account, phoneNumber)) {
    queryQuota += config.salt.verifiedQueryCount
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

/*
 * Returns how many queries the account has already performed.
 */
async function getPerformedQueryCount(account: string): Promise<number> {
  return knex(ACCOUNTS_TABLE)
    .where(ACCOUNTS_COLUMNS.address, account)
    .select(ACCOUNTS_COLUMNS.numLookups)
    .first()
    .then((object) => {
      return object === undefined ? 0 : object[ACCOUNTS_COLUMNS.numLookups]
    })
    .catch((reason) => {
      // TODO [amyslawson] think of failure case here
      console.error(reason)
      return 0
    })
}

/*
 * Increments query count in database.
 */
async function incrementQueryCount(account: string) {
  const data = {
    [ACCOUNTS_COLUMNS.address]: account,
    [ACCOUNTS_COLUMNS.createdAt]: new Date(),
    [ACCOUNTS_COLUMNS.numLookups]: 1,
  }
  return (
    (await knex(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .increment(ACCOUNTS_COLUMNS.numLookups, 1)
      .catch((error) => console.error(error))) ||
    // tslint:disable-next-line: no-return-await
    (await knex(ACCOUNTS_TABLE)
      .insert(data)
      .then(() => console.log('successful insertion'))
      .catch((error) => {
        // TODO [amyslawson] think of failure case here
        console.error(error)
      }))
  )
}

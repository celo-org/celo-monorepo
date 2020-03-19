import BigNumber from 'bignumber.js'
import { Contract } from 'web3-eth-contract'
import {
  getAttestations,
  getGoldToken,
  getStableToken,
  getTokenContract,
  getTokenType,
  networkid,
  poolAddress,
  poolPrivateKey,
  web3,
} from './config'
import {
  deleteMessage,
  getMessagesForState,
  getVerifier,
  setMessageState,
  setVerifierProperties,
} from './database'
import { signTransaction } from './signing-utils'
import { MessageState, RewardableSMSMessage, SMSMessage, TokenType } from './types'

const REWARDS_TIMEOUT = 1000 * 60 * 60 // 1 hour

export async function distributeAllPendingRewards() {
  const sentMessages = await getMessagesForState(MessageState.SENT)
  if (!sentMessages || Object.keys(sentMessages).length === 0) {
    console.info('No pending rewards.')
    return
  }

  // Iterate through all sent messages and find the rewardable ones
  const pendingRewardsMessages: RewardableSMSMessage[] = []
  for (const id of Object.keys(sentMessages)) {
    const message = sentMessages[id]

    if (!message.verifierId || message.verifierId.toLowerCase() === 'twilio') {
      console.warn('Message sent by twilio or was improperly claimed')
      deleteMessage(id)
      continue
    }

    if (isMessageExpired(message)) {
      console.warn(`Rewards expired for message ${id}`)
      // TODO(Rossy) Consider deleting this messages instead of leaving them in DB
      setMessageState(id, MessageState.EXPIRED)
      continue
    }

    const verificationInfo = await getVerificationInfo(message)
    if (!verificationInfo || !verificationInfo.isCompleted) {
      console.info('Verification not completed. skipping.', id)
      continue
    }

    const rewardToken = await getTokenType(verificationInfo.rewardsTokenAddress)
    if (!rewardToken) {
      console.error('Unable to resolve token type. skipping', id)
      continue
    }

    pendingRewardsMessages.push({ ...message, id, rewardToken })
  }

  if (!pendingRewardsMessages.length) {
    console.info('No rewardable messages found.')
    return
  }

  const goldTx = await withdrawRewardsIfPresent(
    (await getGoldToken()).options.address,
    TokenType.GOLD
  )
  const stableTx = await withdrawRewardsIfPresent(
    (await getStableToken()).options.address,
    TokenType.DOLLAR
  )

  if (goldTx === null && stableTx === null) {
    console.info('No tokens to withdraw.')
  }

  // TODO: Make sure our balance is high enough to pay out.
  let distributeRewardsPromises: Array<Promise<any> | null> = []
  const verifierToMessages = getVerifierToMessagesMap(pendingRewardsMessages)
  // Iterate through all verifiers and pay out rewards for their messages
  for (const [verifierId, messages] of verifierToMessages) {
    const verifierInfo = await getVerifierInfo(verifierId)
    if (!verifierInfo) {
      console.warn(`Could not find verifier ${verifierId}`)
      continue
    }

    // Lookup will return 0 if the user is not yet verified.
    if (new BigNumber(verifierInfo.address).isZero()) {
      console.info(`Verifier ${verifierId} not verified, so no rewards distributed.`)
      continue
    }
    // We set the resolved verifier address so the app can use it
    // and we reset the attemptCount back to 0
    setVerifierProperties(verifierId, { address: verifierInfo.address, attemptCount: 0 })

    distributeRewardsPromises = distributeRewardsPromises.concat(
      distributeRewardsForVerifier(verifierInfo.address, verifierInfo.phoneNum, messages)
    )
  }
  await Promise.all(distributeRewardsPromises)

  console.info('Done distributing rewards')
}

export async function deleteRewardedMessages() {
  const rewardedMessages = await getMessagesForState(MessageState.REWARDED)
  if (!rewardedMessages || Object.keys(rewardedMessages).length === 0) {
    console.info('No rewarded messages to delete.')
    return
  }

  console.info('Deleting expired rewarded messages')
  await Promise.all(
    Object.keys(rewardedMessages).map((id) => {
      return isMessageExpired(rewardedMessages[id]) ? deleteMessage(id) : undefined
    })
  )
  console.info('Done deleting expired rewarded messages.')
}

async function getVerifierInfo(
  verifierId: string
): Promise<{ address: string; phoneNum: string } | null> {
  const verifer = await getVerifier(verifierId)
  if (!verifer) {
    return null
  }

  // @ts-ignore
  const verifierPhoneHash = web3.utils.soliditySha3({ type: 'string', value: verifer.phoneNum })
  const verifierAddress = await (await getAttestations()).methods.lookup(verifierPhoneHash).call()
  return {
    address: verifierAddress,
    phoneNum: verifer.phoneNum,
  }
}

// TODO use SDK or abe-utils for this
const verificationCodeRegex = new RegExp(
  /(.* |^)([a-zA-Z0-9=_-]{87,88}:[0-9]+:[0-9]+:[a-zA-Z0-9=_-]{27,28})($| .*)/
)
function extractVerificationCodeFromMessage(message: string) {
  const matches = message.match(verificationCodeRegex)
  if (!matches || matches.length < 3) {
    return null
  }
  return matches[2]
}

async function getVerificationInfo(
  message: SMSMessage
): Promise<{ rewardsTokenAddress: string; isCompleted: boolean } | null> {
  // TODO(asa): Use parseVerificationSms from SDK.
  const code = extractVerificationCodeFromMessage(message.message)
  if (!code) {
    console.error('Could not extract code from verification message')
    return null
  }

  const messagePieces = code.split(':')
  const requestIndex = new BigNumber(messagePieces[1])
  const verificationIndex = new BigNumber(messagePieces[2]).toNumber()

  // @ts-ignore soliditySha3 can take an object
  const requesterPhoneHash = web3.utils.soliditySha3({ type: 'string', value: message.phoneNum })
  // TODO(asa): Use parseVerificationRequest from SDK
  const verificationRequest = await (await getAttestations()).methods
    .getVerificationRequest(requesterPhoneHash, message.address, requestIndex)
    .call()

  if (verificationRequest[3][verificationIndex]) {
    console.info(
      'Verification',
      requestIndex.toString(),
      verificationIndex.toString(),
      'for',
      message.phoneNum,
      message.address,
      'completed, eligible to distribute rewards.'
    )
  }

  return {
    rewardsTokenAddress: verificationRequest[2],
    isCompleted: verificationRequest[3][verificationIndex],
  }
}

function getVerifierToMessagesMap(pendingRewardsMessages: RewardableSMSMessage[]) {
  const verifierToMessages = new Map<string, Set<RewardableSMSMessage>>()
  for (const message of pendingRewardsMessages) {
    if (!message.verifierId) {
      continue
    }
    if (!(message.verifierId in verifierToMessages)) {
      verifierToMessages.set(message.verifierId, new Set<RewardableSMSMessage>())
    }
    verifierToMessages.get(message.verifierId)!.add(message)
  }
  return verifierToMessages
}

function distributeRewardsForVerifier(
  verifierAddress: string,
  verifierPhoneNum: string,
  messages: Set<RewardableSMSMessage>
) {
  if (!messages || !messages.size) {
    console.info('No messages to distribute for.')
    return null
  }

  // Group messages by their reward token
  const tokenToMessages = new Map<TokenType, RewardableSMSMessage[]>()
  for (const m of messages) {
    if (!tokenToMessages.has(m.rewardToken)) {
      tokenToMessages.set(m.rewardToken, [])
    }
    tokenToMessages.get(m.rewardToken)!.push(m)
  }

  const distributionPromises: Array<Promise<any>> = []
  for (const [token, tokenMessages] of tokenToMessages) {
    distributionPromises.push(
      distributeRewardsForToken(token, verifierAddress, verifierPhoneNum, tokenMessages)
    )
  }
  return distributionPromises
}

async function distributeRewardsForToken(
  token: TokenType,
  verifierAddress: string,
  verifierPhoneNum: string,
  messages: RewardableSMSMessage[]
) {
  if (!messages || !messages.length) {
    console.info('No messages to distribute for.')
    return null
  }

  const tokenContract = await getTokenContract(token)
  const attestationsContract = await getAttestations()

  if (!tokenContract) {
    console.warn('Token contract is null')
    return null
  }

  const rewardAmount = new BigNumber(
    (await attestationsContract.methods.getIncentive(tokenContract.options.address).call())[1]
  ).multipliedBy(messages.length)

  // TODO: Reward amount should be human readable.
  console.info(
    `Distributing ${rewardAmount.valueOf()} ${token} to ${verifierPhoneNum} for ${
      messages.length
    } verifications`
  )
  const txcomment = messages.map((m) => m.id).join(',')
  try {
    await sendTransaction(
      tokenContract.options.address,
      tokenContract.methods.transferWithComment(verifierAddress, rewardAmount, txcomment)
    )
    return Promise.all(messages.map((m) => setMessageState(m.id, MessageState.REWARDED)))
  } catch (err) {
    console.error(`Unable to distribute token rewards for ${verifierPhoneNum}`, err)
    return null
  }
}

async function withdrawRewardsIfPresent(tokenAddress: string, tokenType: TokenType) {
  console.info('Attempting to withdraw rewards for token', tokenType)
  const addressBasedEncryption: Contract = await getAttestations()
  const pendingRewards = await addressBasedEncryption.methods
    .pendingWithdrawals(tokenAddress, poolAddress)
    .call()
  if (new BigNumber(pendingRewards).isZero()) {
    console.info('No rewards found for token', tokenType)
    return null
  }
  console.info(`Withdrawing ${pendingRewards} tokens`)
  return sendTransaction(
    addressBasedEncryption.options.address,
    addressBasedEncryption.methods.withdraw(tokenAddress)
  )
}

async function sendTransaction(address: string, tx: any, value = new BigNumber(0)) {
  const estimatedGas = await tx.estimateGas({ from: poolAddress, value })
  // TODO(asa): Set gasPrice.
  const txObj = {
    from: poolAddress,
    to: address,
    gas: estimatedGas,
    data: tx.encodeABI(),
    chainId: networkid,
    value: value.toString(),
  }
  const signedTx = await signTransaction(web3, txObj, poolPrivateKey)
  // @ts-ignore
  return web3.eth.sendSignedTransaction(signedTx.rawTransaction)
}

function isMessageExpired(message: SMSMessage) {
  return message.finishTime && Date.now() - message.finishTime > REWARDS_TIMEOUT
}

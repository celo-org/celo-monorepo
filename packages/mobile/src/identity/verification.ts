import {
  ActionableAttestation,
  extractAttestationCodeFromMessage,
  findMatchingIssuer,
  getActionableAttestations,
  getAttestationsContract,
  getDataEncryptionKey,
  getStableTokenContract,
  getWalletAddress,
  lookupPhoneNumbers,
  makeApproveAttestationFeeTx,
  makeCompleteTx,
  makeRequestTx,
  makeRevealTx,
  makeSetAccountTx,
  validateAttestationCode,
} from '@celo/contractkit'
import { Attestations as AttestationsType } from '@celo/contractkit/types/Attestations'
import { StableToken as StableTokenType } from '@celo/contractkit/types/StableToken'
import { compressedPubKey, stripHexLeader } from '@celo/utils/src/commentEncryption'
import { getPhoneHash, isE164Number } from '@celo/utils/src/phoneNumbers'
import BigNumber from 'bignumber.js'
import { Task } from 'redux-saga'
import { all, call, delay, fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  completeAttestationCode,
  endVerification,
  inputAttestationCode,
  InputAttestationCodeAction,
  ReceiveAttestationMessageAction,
  resetVerification,
} from 'src/identity/actions'
import { attestationCodesSelector } from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { RootState } from 'src/redux/reducers'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const VERIFICATION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
export const ERROR_DURATION = 5000 // 5 seconds
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum CodeInputType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export interface AttestationCode {
  code: string
  issuer: string
}

export function* waitForUserVerified() {
  const isVerified = yield select((state: RootState) => state.app.numberVerified)
  if (isVerified) {
    return
  }
  yield take(Actions.END_VERIFICATION)
}

export function* startVerification() {
  yield put(resetVerification())
  yield call(getConnectedAccount)

  Logger.debug(TAG, 'Starting verification')
  CeloAnalytics.track(CustomEventNames.verification_start)
  const startTime = Date.now()

  const { result, cancel, timeout } = yield race({
    result: call(doVerificationFlow),
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
  })

  if (result === true) {
    Logger.debug(TAG, 'Verification completed successfully')
    CeloAnalytics.track(CustomEventNames.verification_complete, {
      duration: Date.now() - startTime,
    })
  } else if (result === false) {
    Logger.debug(TAG, 'Verification failed')
    CeloAnalytics.track(CustomEventNames.verification_failure, {
      duration: Date.now() - startTime,
    })
  } else if (cancel) {
    Logger.debug(TAG, 'Verification cancelled')
    CeloAnalytics.track(CustomEventNames.verification_cancel)
  } else if (timeout) {
    Logger.debug(TAG, 'Verification timed out')
    CeloAnalytics.track(CustomEventNames.verification_timeout)
    yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT, ERROR_DURATION))
    // TODO #1955: Add logic in this case to request more SMS messages
  }
  Logger.debug(TAG, 'Done verification')

  yield put(refreshAllBalances())
}

export function* doVerificationFlow() {
  try {
    const account: string = yield call(getConnectedUnlockedAccount)
    const privDataKey = yield select(privateCommentKeySelector)
    const dataKey = compressedPubKey(Buffer.from(privDataKey, 'hex'))

    const [e164Number, e164NumberHash]: string[] = yield call(getE164NumberHash)
    const attestationsContract: AttestationsType = yield call(getAttestationsContract, web3)
    const stableTokenContract: StableTokenType = yield call(getStableTokenContract, web3)

    // Get all relevant info about the account's verification status
    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsContract,
      account,
      e164NumberHash
    )

    if (status.isVerified) {
      yield put(endVerification())
      yield put(setNumberVerified(true))
      return true
    }

    // Mark codes completed in previous attempts
    yield put(completeAttestationCode(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

    // Request any additional attestations needed to be verified
    yield call(
      requestNeededAttestations,
      attestationsContract,
      stableTokenContract,
      status.numAttestationsRequestsNeeded,
      e164NumberHash,
      account
    )

    // Get actionable attestation details
    const attestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsContract,
      e164NumberHash,
      account
    )
    const issuers = attestations.map((a) => a.issuer)

    // Start listening for manual and/or auto message inputs
    const receiveMessageTask: Task = yield takeEvery(
      Actions.RECEIVE_ATTESTATION_MESSAGE,
      attestationCodeReceiver(attestationsContract, e164NumberHash, account, issuers)
    )
    const autoRetrievalTask: Task = yield fork(startAutoSmsRetrieval)

    // This needs to go before revealing the attesttions because that depends on the public data key being set.
    yield call(setAccount, attestationsContract, account, dataKey)

    // Request codes for the attestations needed
    yield call(
      revealNeededAttestations,
      attestationsContract,
      account,
      e164Number,
      e164NumberHash,
      attestations
    )

    receiveMessageTask.cancel()
    autoRetrievalTask.cancel()

    yield put(endVerification())
    yield put(setNumberVerified(true))
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message in ErrorMessages) {
      yield put(showError(error.message, ERROR_DURATION))
    } else {
      yield put(showError(ErrorMessages.VERIFICATION_FAILURE, ERROR_DURATION))
    }
    yield put(endVerification(false))
    return false
  }
}

function* getE164NumberHash() {
  try {
    const e164Number: string = yield select(e164NumberSelector)
    const e164NumberHash = getPhoneHash(e164Number)
    return [e164Number, e164NumberHash]
  } catch (error) {
    Logger.error(TAG, 'Error hasing e164Number', error)
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }
}

interface AttestationsStatus {
  isVerified: boolean // user has sufficiently many attestations?
  numAttestationsRemaining: number // number of attestations still needed
  numAttestationsRequestsNeeded: number // number of new request txs needed
}

async function getAttestationsStatus(
  attestationsContract: AttestationsType,
  account: string,
  e164NumberHash: string
): Promise<AttestationsStatus> {
  Logger.debug(TAG + '@getAttestationsStatus', 'Getting verification status from contract')

  const attestationStats = await attestationsContract.methods
    .getAttestationStats(e164NumberHash, account)
    .call()
  // Number of complete (verified) attestations
  const numAttestationsCompleted = new BigNumber(attestationStats[0]).toNumber()
  // Total number of attestation requests made
  const numAttestationRequests = new BigNumber(attestationStats[1]).toNumber()
  // Number of attestations remaining to be verified
  const numAttestationsRemaining = NUM_ATTESTATIONS_REQUIRED - numAttestationsCompleted
  // Number of attestation requests that were not completed (some may be expired)
  const numIncompleteAttestationRequests = numAttestationRequests - numAttestationsCompleted
  Logger.debug(
    TAG + '@getAttestationsStatus',
    `${numAttestationsRemaining} verifications remaining. Total of ${numAttestationRequests} requested.`
  )

  if (numAttestationsRemaining <= 0) {
    Logger.debug(TAG + '@getAttestationsStatus', 'User is already verified')
    return {
      isVerified: true,
      numAttestationsRemaining,
      numAttestationsRequestsNeeded: 0,
    }
  }

  // Number of incomplete attestations that are still valid (not expired)
  const numValidIncompleteAttestations =
    numIncompleteAttestationRequests > 0
      ? (await getActionableAttestations(attestationsContract, e164NumberHash, account)).length
      : 0

  // Number of new attestion requests that will be made to satisfy verificaiton requirements
  const numAttestationsRequestsNeeded = numAttestationsRemaining - numValidIncompleteAttestations
  Logger.debug(
    TAG + '@getAttestationsStatus',
    `${numAttestationsRequestsNeeded} new attestation requests needed to fulfill ${numAttestationsRemaining} required attestations`
  )

  return {
    isVerified: false,
    numAttestationsRemaining,
    numAttestationsRequestsNeeded,
  }
}

export async function requestNeededAttestations(
  attestationsContract: AttestationsType,
  stableTokenContract: StableTokenType,
  numAttestationsRequestsNeeded: number,
  e164NumberHash: string,
  account: string
) {
  if (numAttestationsRequestsNeeded <= 0) {
    Logger.debug(`${TAG}@requestNeededAttestations`, 'No additional attestations requests needed')
    return
  }

  Logger.debug(
    `${TAG}@requestNeededAttestations`,
    `Approving ${numAttestationsRequestsNeeded} new attestations`
  )

  const approveTx = await makeApproveAttestationFeeTx(
    attestationsContract,
    stableTokenContract,
    numAttestationsRequestsNeeded
  )

  await sendTransaction(approveTx, account, TAG, 'Approve Attestations')

  Logger.debug(
    `${TAG}@requestNeededAttestations`,
    `Requesting ${numAttestationsRequestsNeeded} new attestations`
  )

  const requestTx = makeRequestTx(
    attestationsContract,
    e164NumberHash,
    numAttestationsRequestsNeeded,
    stableTokenContract
  )
  await sendTransaction(requestTx, account, TAG, 'Request Attestations')
}

function attestationCodeReceiver(
  attestationsContract: AttestationsType,
  e164NumberHash: string,
  account: string,
  allIssuers: string[]
) {
  return function*(action: ReceiveAttestationMessageAction) {
    if (!action || !action.message) {
      Logger.error(TAG + '@attestationCodeReceiver', 'Received empty code. Ignoring.')
      return
    }

    try {
      const code = extractAttestationCodeFromMessage(action.message)
      if (!code) {
        throw new Error('No code extracted from message')
      }

      const issuer = findMatchingIssuer(e164NumberHash, account, code, allIssuers)
      if (!issuer) {
        throw new Error('No issuer found for attestion code')
      }

      const existingCode = yield call(getCodeForIssuer, issuer)
      if (existingCode) {
        Logger.warn(TAG + '@attestationCodeReceiver', 'Code already exists store, skipping.')
        if (action.inputType === CodeInputType.MANUAL) {
          yield put(showError(ErrorMessages.REPEAT_VERIFICATION_CODE, ERROR_DURATION))
        }
        return
      }

      Logger.debug(TAG + '@attestationCodeReceiver', `Received code for issuer ${issuer}`)

      const isValidRequest = yield call(
        validateAttestationCode,
        attestationsContract,
        e164NumberHash,
        account,
        issuer,
        code
      )
      if (isValidRequest === NULL_ADDRESS) {
        throw new Error('Code is not valid')
      }

      yield put(inputAttestationCode({ code, issuer }))

      CeloAnalytics.track(CustomEventNames.verification_code_entered, {
        inputType: action.inputType,
      })
    } catch (error) {
      Logger.error(TAG + '@attestationCodeReceiver', 'Error processing attestation code', error)
      yield put(showError(ErrorMessages.INVALID_ATTESTATION_CODE))
    }
  }
}

function* getCodeForIssuer(issuer: string) {
  const existingCodes: AttestationCode[] = yield select(attestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
}

function* revealNeededAttestations(
  attestationsContract: AttestationsType,
  account: string,
  e164Number: string,
  e164NumberHash: string,
  attestations: ActionableAttestation[]
) {
  Logger.debug(TAG + '@revealNeededAttestations', `Revealing ${attestations.length} attestations`)
  yield all(
    attestations.map((attestation) => {
      return call(
        revealAndCompleteAttestation,
        attestationsContract,
        account,
        e164Number,
        e164NumberHash,
        attestation.issuer
      )
    })
  )
}

function* revealAndCompleteAttestation(
  attestationsContract: AttestationsType,
  account: string,
  e164Number: string,
  e164NumberHash: string,
  issuer: string
) {
  Logger.debug(TAG + '@revealAttestation', `Revealing an attestation for issuer: ${issuer}`)
  const revealTx = yield call(makeRevealTx, attestationsContract, e164Number, issuer)
  yield call(sendTransaction, revealTx, account, TAG, `Reveal ${issuer}`)

  const code: AttestationCode = yield call(waitForAttestationCode, issuer)

  Logger.debug(TAG + '@revealAttestation', `Completing code for issuer: ${code.issuer}`)

  const completeTx = makeCompleteTx(
    attestationsContract,
    e164NumberHash,
    account,
    code.issuer,
    code.code
  )
  yield call(sendTransaction, completeTx, account, TAG, `Confirmation ${issuer}`)

  yield put(completeAttestationCode())
  Logger.debug(TAG + '@revealAttestation', `Attestation for issuer ${issuer} completed`)
}

// Get the code from the store if it's already there, otherwise wait for it
function* waitForAttestationCode(issuer: string) {
  Logger.debug(TAG + '@waitForAttestationCode', `Waiting for code for issuer ${issuer}`)
  const code = yield call(getCodeForIssuer, issuer)
  if (code) {
    return code
  }

  while (true) {
    const action: InputAttestationCodeAction = yield take(Actions.INPUT_ATTESTATION_CODE)
    if (action.code.issuer === issuer) {
      return action.code
    }
  }
}

async function setAccount(
  attestationsContract: AttestationsType,
  address: string,
  dataKey: string
) {
  Logger.debug(TAG, 'Setting wallet address and public data encryption key')
  const currentWalletAddress = await getWalletAddress(attestationsContract, address)
  const currentWalletDEK = await getDataEncryptionKey(attestationsContract, address)
  if (currentWalletAddress !== address || stripHexLeader(currentWalletDEK) !== dataKey) {
    const setAccountTx = makeSetAccountTx(attestationsContract, address, dataKey)
    return sendTransaction(setAccountTx, address, TAG, `Set Wallet Address & DEK`)
  }
}

export function* revokeVerification() {
  try {
    Logger.debug(TAG + '@revokeVerification', 'Revoking previous verification')
    const account = yield call(getConnectedUnlockedAccount)
    const [, e164NumberHash]: string[] = yield call(getE164NumberHash)

    yield put(resetVerification())

    const attestationsContract: AttestationsType = yield getAttestationsContract(web3)
    const currentAccounts:
      | string[]
      | undefined = yield attestationsContract.methods
      .lookupAccountsForIdentifier(e164NumberHash)
      .call()
    if (!currentAccounts) {
      Logger.warn(TAG + '@revokeVerification', 'No accounts found for phone number')
      return
    }

    const index = currentAccounts.map((a) => a.toLowerCase()).indexOf(account)
    if (index < 0) {
      Logger.warn(TAG + '@revokeVerification', 'Account not found')
      return
    }

    const revokeTx = attestationsContract.methods.revoke(e164NumberHash, index)
    yield call(sendTransaction, revokeTx, account, TAG, 'Revoke attestation')

    yield put(setNumberVerified(false))
    Logger.debug(TAG + '@revokeVerification', 'Done revoking previous verification')
    Logger.showMessage('Done revoking phone verification')
  } catch (error) {
    Logger.error(TAG + '@revokeVerification', 'Error revoking verification', error)
  }
}

// TODO(Rossy) This is currently only used in one place, would be better
// to have consumer use the e164NumberToAddress map instead
export async function lookupPhoneNumberAddress(e164Number: string) {
  Logger.debug(TAG + '@lookupPhoneNumberAddress', `Checking Phone Number Address`)

  try {
    const phoneHash = getPhoneHash(e164Number)
    const attestationsContract = await getAttestationsContract(web3)
    const results = await lookupPhoneNumbers(attestationsContract, [phoneHash])
    if (!results || !results[phoneHash]) {
      return null
    }

    // TODO(Rossy) Add support for handling multiple addresses per number
    const address = Object.keys(results[phoneHash]!)[0]
    if (new BigNumber(address).isZero()) {
      return null
    }
    return address.toLowerCase()
  } catch (e) {
    Logger.error(TAG + '@isPhoneNumberVerified', `Error checking status of phone number`, e)
    return null
  }
}

export async function isPhoneNumberVerified(phoneNumber: string | null | undefined) {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    return false
  }

  return (await lookupPhoneNumberAddress(phoneNumber)) != null
}

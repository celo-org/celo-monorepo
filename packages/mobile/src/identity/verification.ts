import { compressedPubKey } from '@celo/utils/src/commentEncryption'
import { getPhoneHash, isE164Number } from '@celo/utils/src/phoneNumbers'
import { areAddressesEqual } from '@celo/utils/src/signatureUtils'
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
} from '@celo/walletkit'
import { Attestations as AttestationsType } from '@celo/walletkit/types/Attestations'
import { StableToken as StableTokenType } from '@celo/walletkit/types/StableToken'
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
import { sendTransaction, sendTransactionPromises } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const VERIFICATION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
export const ERROR_DURATION = 5000 // 5 seconds
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
// Gas estimation for concurrent pending transactions is currently not support for
// light clients, so we have to statically specify the gas here. Furthermore, the
// current request function does a whole validator election which is why it is very
// expensive. When https://github.com/celo-org/celo-monorepo-old/issues/3818 gets
// merged we should significantly reduce this number
export const REQUEST_TX_GAS = 7000000
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

  const { result, cancel, timeout } = yield race({
    result: call(doVerificationFlow),
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
  })

  if (result === true) {
    CeloAnalytics.track(CustomEventNames.verification_success)
    Logger.debug(TAG, 'Verification completed successfully')
  } else if (result === false) {
    CeloAnalytics.track(CustomEventNames.verification_failed)
    Logger.debug(TAG, 'Verification failed')
  } else if (cancel) {
    CeloAnalytics.track(CustomEventNames.verification_cancelled)
    Logger.debug(TAG, 'Verification cancelled')
  } else if (timeout) {
    CeloAnalytics.track(CustomEventNames.verification_timed_out)
    Logger.debug(TAG, 'Verification timed out')
    yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT, ERROR_DURATION))
    yield put(endVerification(false))
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

    CeloAnalytics.track(CustomEventNames.verification_setup)

    // Get all relevant info about the account's verification status
    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsContract,
      account,
      e164NumberHash
    )

    CeloAnalytics.track(CustomEventNames.verification_get_status)

    if (status.isVerified) {
      yield put(endVerification())
      yield put(setNumberVerified(true))
      return true
    }

    // Mark codes completed in previous attempts
    yield put(completeAttestationCode(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

    const attestations: ActionableAttestation[] = yield call(
      requestAndRetrieveAttestations,
      attestationsContract,
      stableTokenContract,
      e164NumberHash,
      account,
      status.numAttestationsRemaining
    )

    const issuers = attestations.map((a) => a.issuer)

    // Start listening for manual and/or auto message inputs
    const receiveMessageTask: Task = yield takeEvery(
      Actions.RECEIVE_ATTESTATION_MESSAGE,
      attestationCodeReceiver(attestationsContract, e164NumberHash, account, issuers)
    )
    const autoRetrievalTask: Task = yield fork(startAutoSmsRetrieval)

    yield all([
      // Set acccount and data encryption key in contract
      call(setAccount, attestationsContract, account, dataKey),
      // Request codes for the attestations needed
      call(
        revealNeededAttestations,
        attestationsContract,
        account,
        e164Number,
        e164NumberHash,
        attestations
      ),
    ])

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
}

// Requests if necessary additional attestations and returns all revealable attetations
export async function requestAndRetrieveAttestations(
  attestationsContract: AttestationsType,
  stableTokenContract: StableTokenType,
  e164NumberHash: string,
  account: string,
  attestationsRemaining: number
) {
  // The set of attestations we can reveal right now
  let attestations: ActionableAttestation[] = await getActionableAttestations(
    attestationsContract,
    e164NumberHash,
    account
  )

  while (attestations.length < attestationsRemaining) {
    // Request any additional attestations beyond the original set
    await requestAttestations(
      attestationsContract,
      stableTokenContract,
      attestationsRemaining - attestations.length,
      e164NumberHash,
      account
    )

    CeloAnalytics.track(CustomEventNames.verification_actionable_attestation_start)
    // Check if we have a sufficient set now by fetching the new total set
    attestations = await getActionableAttestations(attestationsContract, e164NumberHash, account)
    CeloAnalytics.track(CustomEventNames.verification_actionable_attestation_finish)
  }

  return attestations
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

  Logger.debug(
    TAG + '@getAttestationsStatus',
    `${numAttestationsRemaining} verifications remaining. Total of ${numAttestationRequests} requested.`
  )

  if (numAttestationsRemaining <= 0) {
    Logger.debug(TAG + '@getAttestationsStatus', 'User is already verified')
    return {
      isVerified: true,
      numAttestationsRemaining,
    }
  }

  return {
    isVerified: false,
    numAttestationsRemaining,
  }
}

async function requestAttestations(
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
  CeloAnalytics.track(CustomEventNames.verification_request_attestations)
  Logger.debug(
    `${TAG}@requestNeededAttestations`,
    `Approving ${numAttestationsRequestsNeeded} new attestations`
  )

  const approveTx = await makeApproveAttestationFeeTx(
    attestationsContract,
    stableTokenContract,
    numAttestationsRequestsNeeded
  )

  const {
    confirmation: approveConfirmationPromise,
    transactionHash: approveTransactionHashPromise,
  } = await sendTransactionPromises(approveTx, account, TAG, 'Approve Attestations')

  await approveTransactionHashPromise

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

  await Promise.all([
    approveConfirmationPromise,
    sendTransaction(requestTx, account, TAG, 'Request Attestations', REQUEST_TX_GAS),
  ])

  CeloAnalytics.track(CustomEventNames.verification_requested_attestations)
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
          yield put(showError(ErrorMessages.REPEAT_ATTESTATION_CODE, ERROR_DURATION))
        }
        return
      }

      Logger.debug(TAG + '@attestationCodeReceiver', `Received code for issuer ${issuer}`)

      CeloAnalytics.track(CustomEventNames.verification_validate_code_start, { issuer })
      const isValidRequest = yield call(
        validateAttestationCode,
        attestationsContract,
        e164NumberHash,
        account,
        issuer,
        code
      )
      CeloAnalytics.track(CustomEventNames.verification_validate_code_finish, { issuer })

      if (isValidRequest === NULL_ADDRESS) {
        throw new Error('Code is not valid')
      }

      yield put(inputAttestationCode({ code, issuer }))
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
    attestations.map((attestation, index) => {
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
  CeloAnalytics.track(CustomEventNames.verification_reveal_attestation, { issuer })
  const revealTx = yield call(makeRevealTx, attestationsContract, e164Number, issuer)
  // Crude way to prevent sendTransaction being called in parallel and use the same nonces.
  yield call(sendTransaction, revealTx, account, TAG, `Reveal ${issuer}`)

  CeloAnalytics.track(CustomEventNames.verification_revealed_attestation, { issuer })

  const code: AttestationCode = yield call(waitForAttestationCode, issuer)

  Logger.debug(TAG + '@revealAttestation', `Completing code for issuer: ${code.issuer}`)

  CeloAnalytics.track(CustomEventNames.verification_complete_attestation, { issuer })

  const completeTx = makeCompleteTx(
    attestationsContract,
    e164NumberHash,
    account,
    code.issuer,
    code.code
  )
  yield call(sendTransaction, completeTx, account, TAG, `Confirmation ${issuer}`)

  CeloAnalytics.track(CustomEventNames.verification_completed_attestation, { issuer })

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
  if (
    !areAddressesEqual(currentWalletAddress, address) ||
    !areAddressesEqual(currentWalletDEK, dataKey)
  ) {
    const setAccountTx = makeSetAccountTx(attestationsContract, address, dataKey)
    await sendTransaction(setAccountTx, address, TAG, `Set Wallet Address & DEK`)
    CeloAnalytics.track(CustomEventNames.verification_set_account)
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
export async function lookupAddressFromPhoneNumber(e164Number: string) {
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

  return (await lookupAddressFromPhoneNumber(phoneNumber)) != null
}

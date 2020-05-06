import { CeloTransactionObject } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import {
  ActionableAttestation,
  AttestationsWrapper,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { eqAddress } from '@celo/utils/src/address'
import { retryAsync } from '@celo/utils/src/async'
import { extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import { compressedPubKey } from '@celo/utils/src/commentEncryption'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { Platform } from 'react-native'
import { Task } from 'redux-saga'
import { all, call, delay, fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { USE_PHONE_NUMBER_PRIVACY } from 'src/config'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  completeAttestationCode,
  inputAttestationCode,
  InputAttestationCodeAction,
  ReceiveAttestationMessageAction,
  resetVerification,
  setVerificationStatus,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate, PhoneNumberHashDetails } from 'src/identity/privacy'
import { acceptedAttestationCodesSelector, attestationCodesSelector } from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const VERIFICATION_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export enum VerificationStatus {
  Failed = -1,
  Stopped = 0,
  Prepping = 1,
  GettingStatus = 2,
  RequestingAttestations = 3,
  RevealingNumber = 4,
  RevealAttemptFailed = 5,
  Done = 6,
}

export enum CodeInputType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  DEEP_LINK = 'deepLink',
}

export interface AttestationCode {
  code: string
  issuer: string
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
    yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT))
    yield put(setVerificationStatus(VerificationStatus.Failed))
  }
  Logger.debug(TAG, 'Done verification')

  yield put(refreshAllBalances())
}

export function* doVerificationFlow() {
  try {
    yield put(setVerificationStatus(VerificationStatus.Prepping))
    const account: string = yield call(getConnectedUnlockedAccount)
    const e164Number: string = yield select(e164NumberSelector)
    // TODO cleanup when feature flag is removed
    let phoneHash: string
    let phoneHashDetails: PhoneNumberHashDetails
    if (USE_PHONE_NUMBER_PRIVACY) {
      phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
      phoneHash = phoneHashDetails.phoneHash
    } else {
      phoneHash = getPhoneHash(e164Number)
      phoneHashDetails = {
        e164Number,
        phoneHash,
        // @ts-ignore
        salt: undefined,
      }
    }
    const privDataKey = yield select(privateCommentKeySelector)
    const dataKey = compressedPubKey(Buffer.from(privDataKey, 'hex'))

    const contractKit = yield call(getContractKit)

    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    const accountsWrapper: AccountsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAccounts,
    ])

    CeloAnalytics.track(CustomEventNames.verification_setup)

    // Get all relevant info about the account's verification status
    yield put(setVerificationStatus(VerificationStatus.GettingStatus))

    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      account,
      phoneHash
    )

    CeloAnalytics.track(CustomEventNames.verification_get_status)

    if (status.isVerified) {
      yield put(setVerificationStatus(VerificationStatus.Done))
      yield put(setNumberVerified(true))
      return true
    }

    // Mark codes completed in previous attempts
    yield put(completeAttestationCode(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

    yield put(setVerificationStatus(VerificationStatus.RequestingAttestations))
    const attestations: ActionableAttestation[] = yield call(
      requestAndRetrieveAttestations,
      attestationsWrapper,
      phoneHash,
      account,
      status.numAttestationsRemaining
    )

    const issuers = attestations.map((a) => a.issuer)

    // Start listening for manual and/or auto message inputs
    const receiveMessageTask: Task = yield takeEvery(
      Actions.RECEIVE_ATTESTATION_MESSAGE,
      attestationCodeReceiver(attestationsWrapper, phoneHash, account, issuers)
    )

    let autoRetrievalTask: Task | undefined
    if (Platform.OS === 'android') {
      autoRetrievalTask = yield fork(startAutoSmsRetrieval)
    }

    yield put(setVerificationStatus(VerificationStatus.RevealingNumber))
    yield all([
      // Set acccount and data encryption key in contract
      call(setAccount, accountsWrapper, account, dataKey),
      // Request codes for the attestations needed
      call(revealNeededAttestations, attestationsWrapper, account, phoneHashDetails, attestations),
    ])

    receiveMessageTask.cancel()
    if (Platform.OS === 'android' && autoRetrievalTask) {
      autoRetrievalTask.cancel()
    }

    yield put(setVerificationStatus(VerificationStatus.Done))
    yield put(setNumberVerified(true))
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message in ErrorMessages) {
      yield put(showError(error.message))
    } else {
      yield put(showError(ErrorMessages.VERIFICATION_FAILURE))
    }
    yield put(setVerificationStatus(VerificationStatus.Failed))
    return false
  }
}

interface AttestationsStatus {
  isVerified: boolean // user has sufficiently many attestations?
  numAttestationsRemaining: number // number of attestations still needed
}

// Requests if necessary additional attestations and returns all revealable attetations
export function* requestAndRetrieveAttestations(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  account: string,
  attestationsRemaining: number
) {
  // The set of attestations we can reveal right now
  let attestations: ActionableAttestation[] = yield call(
    getActionableAttestations,
    attestationsWrapper,
    phoneHash,
    account
  )

  while (attestations.length < attestationsRemaining) {
    // Request any additional attestations beyond the original set
    yield call(
      requestAttestations,
      attestationsWrapper,
      attestationsRemaining - attestations.length,
      phoneHash,
      account
    )

    // Check if we have a sufficient set now by fetching the new total set
    attestations = yield call(getActionableAttestations, attestationsWrapper, phoneHash, account)
  }

  return attestations
}

async function getActionableAttestations(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  account: string
) {
  CeloAnalytics.track(CustomEventNames.verification_actionable_attestation_start)
  const attestations = await retryAsync(
    attestationsWrapper.getActionableAttestations.bind(attestationsWrapper),
    3,
    [phoneHash, account]
  )
  CeloAnalytics.track(CustomEventNames.verification_actionable_attestation_finish)
  return attestations
}

async function getAttestationsStatus(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHash: string
): Promise<AttestationsStatus> {
  Logger.debug(TAG + '@getAttestationsStatus', 'Getting verification status from contract')

  const attestationStats = await attestationsWrapper.getAttestationStat(phoneHash, account)
  // Number of complete (verified) attestations
  const numAttestationsCompleted = attestationStats.completed
  // Total number of attestation requests made
  const numAttestationRequests = attestationStats.total
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

function* requestAttestations(
  attestationsWrapper: AttestationsWrapper,
  numAttestationsRequestsNeeded: number,
  phoneHash: string,
  account: string
) {
  if (numAttestationsRequestsNeeded <= 0) {
    Logger.debug(`${TAG}@requestNeededAttestations`, 'No additional attestations requests needed')
    return
  }
  CeloAnalytics.track(CustomEventNames.verification_request_attestations)

  const unselectedRequest: UnselectedRequest = yield call(
    [attestationsWrapper, attestationsWrapper.getUnselectedRequest],
    phoneHash,
    account
  )

  if (unselectedRequest.blockNumber === 0) {
    Logger.debug(
      `${TAG}@requestNeededAttestations`,
      `Approving ${numAttestationsRequestsNeeded} new attestations`
    )
    const approveTx: CeloTransactionObject<boolean> = yield call(
      [attestationsWrapper, attestationsWrapper.approveAttestationFee],
      numAttestationsRequestsNeeded
    )

    yield call(sendTransaction, approveTx.txo, account, TAG, 'Approve Attestations')

    Logger.debug(
      `${TAG}@requestNeededAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )

    const requestTx: CeloTransactionObject<void> = yield call(
      [attestationsWrapper, attestationsWrapper.request],
      phoneHash,
      numAttestationsRequestsNeeded
    )

    yield call(sendTransaction, requestTx.txo, account, TAG, 'Request Attestations')
  } else {
    Logger.debug(
      `${TAG}@requestNeededAttestations`,
      `Unselected request found, skipping approval/request`
    )
  }

  Logger.debug(`${TAG}@requestNeededAttestations`, 'Waiting for block to select issuer')

  yield call([attestationsWrapper, attestationsWrapper.waitForSelectingIssuers], phoneHash, account)

  Logger.debug(`${TAG}@requestNeededAttestations`, 'Selecting issuer')

  const selectIssuersTx = attestationsWrapper.selectIssuers(phoneHash)

  yield call(sendTransaction, selectIssuersTx.txo, account, TAG, 'Select Issuer')

  CeloAnalytics.track(CustomEventNames.verification_requested_attestations)
}

function attestationCodeReceiver(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
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

      const existingCode = yield call(isCodeAlreadyAccepted, code)
      if (existingCode) {
        Logger.warn(TAG + '@attestationCodeReceiver', 'Code already exists in store, skipping.')
        if (
          CodeInputType.MANUAL === action.inputType ||
          CodeInputType.DEEP_LINK === action.inputType
        ) {
          yield put(showError(ErrorMessages.REPEAT_ATTESTATION_CODE))
        }
        return
      }

      const issuer = yield call(
        [attestationsWrapper, attestationsWrapper.findMatchingIssuer],
        phoneHash,
        account,
        code,
        allIssuers
      )
      if (!issuer) {
        throw new Error('No issuer found for attestion code')
      }

      Logger.debug(TAG + '@attestationCodeReceiver', `Received code for issuer ${issuer}`)

      CeloAnalytics.track(CustomEventNames.verification_validate_code_start, { issuer })
      const isValidRequest = yield call(
        [attestationsWrapper, attestationsWrapper.validateAttestationCode],
        phoneHash,
        account,
        issuer,
        code
      )
      CeloAnalytics.track(CustomEventNames.verification_validate_code_finish, { issuer })

      if (!isValidRequest) {
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

function* isCodeAlreadyAccepted(code: string) {
  const existingCodes: AttestationCode[] = yield select(acceptedAttestationCodesSelector)
  return existingCodes.find((c) => c.code === code)
}

function* revealNeededAttestations(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(TAG + '@revealNeededAttestations', `Revealing ${attestations.length} attestations`)
  yield all(
    attestations.map((attestation) => {
      return call(
        revealAndCompleteAttestation,
        attestationsWrapper,
        account,
        phoneHashDetails,
        attestation
      )
    })
  )
}

function* revealAndCompleteAttestation(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer

  yield call(tryRevealPhoneNumber, attestationsWrapper, account, phoneHashDetails, attestation)

  const code: AttestationCode = yield call(waitForAttestationCode, issuer)

  Logger.debug(TAG + '@revealAttestation', `Completing code for issuer: ${code.issuer}`)

  CeloAnalytics.track(CustomEventNames.verification_complete_attestation, { issuer })

  const completeTx: CeloTransactionObject<void> = yield call(
    [attestationsWrapper, attestationsWrapper.complete],
    phoneHashDetails.phoneHash,
    account,
    code.issuer,
    code.code
  )
  yield call(sendTransaction, completeTx.txo, account, TAG, `Complete ${issuer}`)

  CeloAnalytics.track(CustomEventNames.verification_completed_attestation, { issuer })

  yield put(completeAttestationCode())
  Logger.debug(TAG + '@revealAttestation', `Attestation for issuer ${issuer} completed`)
}

function* tryRevealPhoneNumber(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer
  Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing an attestation for issuer: ${issuer}`)
  CeloAnalytics.track(CustomEventNames.verification_reveal_attestation, { issuer })

  try {
    const response = yield call(
      [attestationsWrapper, attestationsWrapper.revealPhoneNumberToIssuer],
      phoneHashDetails.e164Number,
      account,
      attestation.issuer,
      attestation.attestationServiceURL,
      phoneHashDetails.salt
    )
    if (!response.ok) {
      const body = yield response.json()
      Logger.error(TAG + '@tryRevealPhoneNumber', `Reveal response not okay: ${body.error}`)
      throw new Error(
        `Error revealing to issuer ${attestation.attestationServiceURL}. Status code: ${response.status}`
      )
    }

    Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing for issuer ${issuer} successful`)
  } catch (error) {
    // This is considered a recoverable error because the user may have received the code in a previous run
    // So instead of propagating the error, we catch it just update status. This will trigger the modal,
    // allowing the user to enter codes manually or skip verification.
    Logger.error(TAG + '@tryRevealPhoneNumber', `Reveal for issuer ${issuer} failed`, error)
    yield put(showError(ErrorMessages.REVEAL_ATTESTATION_FAILURE))
    yield put(setVerificationStatus(VerificationStatus.RevealAttemptFailed))
  }
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

function* setAccount(accountsWrapper: AccountsWrapper, address: string, dataKey: string) {
  Logger.debug(TAG, 'Setting wallet address and public data encryption key')
  const upToDate: boolean = yield call(isAccountUpToDate, accountsWrapper, address, dataKey)
  if (upToDate) {
    return
  }
  const setAccountTx = accountsWrapper.setAccount('', dataKey, address)
  yield call(sendTransaction, setAccountTx.txo, address, TAG, 'Set Wallet Address & DEK')
  CeloAnalytics.track(CustomEventNames.verification_set_account)
}

async function isAccountUpToDate(
  accountsWrapper: AccountsWrapper,
  address: string,
  dataKey: string
) {
  const [currentWalletAddress, currentDEK] = await Promise.all([
    accountsWrapper.getWalletAddress(address),
    // getDataEncryptionKey actually returns a string instead of an array
    accountsWrapper.getDataEncryptionKey(address).then((key) => [key]),
  ])
  return (
    eqAddress(currentWalletAddress, address) && currentDEK && eqAddress(currentDEK.join(), dataKey)
  )
}

export function* revokeVerification() {
  try {
    Logger.debug(TAG + '@revokeVerification', 'Revoking previous verification')

    // TODO: https://github.com/celo-org/celo-monorepo/issues/1830
    yield put(
      showMessage('Revocation not currently supported. Just resetting local verification state')
    )
    yield put(resetVerification())
    yield put(setNumberVerified(false))

    // const account = yield call(getConnectedUnlockedAccount)
    // const [, e164NumberHash]: string[] = yield call(getE164NumberHash)
    // const attestationsWrapper: AttestationsWrapper = yield getattestationsWrapper(web3)
    // const currentAccounts:
    //   | string[]
    //   | undefined = yield attestationsWrapper.methods
    //   .lookupAccountsForIdentifier(e164NumberHash)
    //   .call()
    // if (!currentAccounts) {
    //   Logger.warn(TAG + '@revokeVerification', 'No accounts found for phone number')
    //   return
    // }

    // const index = currentAccounts.map((a) => a.toLowerCase()).indexOf(account)
    // if (index < 0) {
    //   Logger.warn(TAG + '@revokeVerification', 'Account not found')
    //   return
    // }

    // const revokeTx = attestationsWrapper.methods.revoke(e164NumberHash, index)
    // yield call(sendTransaction, revokeTx, account, TAG, 'Revoke attestation')

    // Logger.debug(TAG + '@revokeVerification', 'Done revoking previous verification')
    // Logger.showMessage('Done revoking phone verification')
  } catch (error) {
    Logger.error(TAG + '@revokeVerification', 'Error revoking verification', error)
  }
}

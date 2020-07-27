import { CeloTransactionObject } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttesationServiceRevealRequest,
  AttestationsWrapper,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { retryAsync } from '@celo/utils/src/async'
import { AttestationsStatus, extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import functions from '@react-native-firebase/functions'
import BigNumber from 'bignumber.js'
import { Platform } from 'react-native'
import { Task } from 'redux-saga'
import { all, call, delay, fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { setRetryVerificationWithForno } from 'src/account/actions'
import { e164NumberSelector } from 'src/account/selectors'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_TESTNET, SMS_RETRIEVER_APP_SIGNATURE, USE_PHONE_NUMBER_PRIVACY } from 'src/config'
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
import { fetchPhoneHashPrivate, PhoneNumberHashDetails } from 'src/identity/privateHashing'
import { acceptedAttestationCodesSelector, attestationCodesSelector } from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { VerificationStatus } from 'src/identity/types'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const ESTIMATED_COST_PER_ATTESTATION = 0.07
export const VERIFICATION_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const REVEAL_RETRY_DELAY = 10 * 1000 // 10 seconds

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
  ValoraAnalytics.track(VerificationEvents.verification_start)

  yield put(resetVerification())
  yield call(getConnectedAccount)

  Logger.debug(TAG, 'Starting verification')

  const { result, cancel, timeout } = yield race({
    result: call(doVerificationFlow),
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
  })

  if (result === true) {
    ValoraAnalytics.track(VerificationEvents.verification_complete)
    Logger.debug(TAG, 'Verification completed successfully')
  } else if (result) {
    ValoraAnalytics.track(VerificationEvents.verification_error, { error: result })
    Logger.debug(TAG, 'Verification failed')
  } else if (cancel) {
    ValoraAnalytics.track(VerificationEvents.verification_cancel)
    Logger.debug(TAG, 'Verification cancelled')
  } else if (timeout) {
    ValoraAnalytics.track(VerificationEvents.verification_timeout)
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
    ValoraAnalytics.track(VerificationEvents.verification_hash_retrieved, {
      phoneHash,
      address: account,
    })

    const contractKit = yield call(getContractKit)

    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_start)

    // Get all relevant info about the account's verification status
    yield put(setVerificationStatus(VerificationStatus.GettingStatus))

    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      account,
      phoneHash
    )

    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_complete, {
      ...status,
    })

    if (!status.isVerified) {
      const balanceIsSufficient = yield call(
        balanceSufficientForAttestations,
        status.numAttestationsRemaining
      )
      if (!balanceIsSufficient) {
        yield put(setVerificationStatus(VerificationStatus.InsufficientBalance))
        // Return error message for logging purposes
        return ErrorMessages.INSUFFICIENT_BALANCE
      }

      // Mark codes completed in previous attempts
      yield put(
        completeAttestationCode(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining)
      )

      yield put(setVerificationStatus(VerificationStatus.RequestingAttestations))

      ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
        attestationsToRequest: status.numAttestationsRemaining,
      })
      const attestations: ActionableAttestation[] = yield call(
        requestAndRetrieveAttestations,
        attestationsWrapper,
        phoneHash,
        account,
        status.numAttestationsRemaining
      )

      const issuers = attestations.map((a) => a.issuer)
      ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
        issuers,
      })

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
      ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start)
      yield all([
        // Request codes for the attestations needed
        call(
          revealNeededAttestations,
          attestationsWrapper,
          account,
          phoneHashDetails,
          attestations
        ),
        // Set acccount and data encryption key in Accounts contract
        // This is done in other places too, intentionally keeping it for more coverage
        call(registerAccountDek, account),
      ])
      ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete)

      receiveMessageTask.cancel()
      if (Platform.OS === 'android' && autoRetrievalTask) {
        autoRetrievalTask.cancel()
      }
    }

    yield put(setVerificationStatus(VerificationStatus.Done))
    yield put(setNumberVerified(true))
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      yield put(setVerificationStatus(VerificationStatus.SaltQuotaExceeded))
    } else {
      yield put(setVerificationStatus(VerificationStatus.Failed))
      yield put(showErrorOrFallback(error, ErrorMessages.VERIFICATION_FAILURE))
    }
    return error.message
  }
}

export function* balanceSufficientForAttestations(attestationsRemaining: number) {
  const userBalance = yield select(stableTokenBalanceSelector)
  return new BigNumber(userBalance).isGreaterThan(
    attestationsRemaining * ESTIMATED_COST_PER_ATTESTATION
  )
}

// Requests if necessary additional attestations and returns all revealable attestations
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

  // Any verification failure past this point will be after sending a tx
  // so do not prompt forno retry as these failures are not always
  // light client related, and account may have insufficient balance
  yield put(setRetryVerificationWithForno(false))
  while (attestations.length < attestationsRemaining) {
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_start, {
      currentAttestation: attestations.length,
    })
    // Request any additional attestations beyond the original set
    yield call(
      requestAttestations,
      attestationsWrapper,
      attestationsRemaining - attestations.length,
      phoneHash,
      account
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_complete)

    // Check if we have a sufficient set now by fetching the new total set
    attestations = yield call(getActionableAttestations, attestationsWrapper, phoneHash, account)
    ValoraAnalytics.track(
      VerificationEvents.verification_request_all_attestations_refresh_progress,
      {
        attestationsRemaining: attestationsRemaining - attestations.length,
      }
    )
  }

  return attestations
}

async function getActionableAttestations(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  account: string
) {
  const attestations = await retryAsync(
    attestationsWrapper.getActionableAttestations.bind(attestationsWrapper),
    3,
    [phoneHash, account]
  )
  return attestations
}

export async function getAttestationsStatus(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHash: string
): Promise<AttestationsStatus> {
  Logger.debug(TAG + '@getAttestationsStatus', 'Getting verification status from contract')

  const attestationStatus = await attestationsWrapper.getVerifiedStatus(phoneHash, account)

  Logger.debug(
    TAG + '@getAttestationsStatus',
    `${attestationStatus.numAttestationsRemaining} verifications remaining. Total of ${attestationStatus.total} requested.`
  )

  if (attestationStatus.numAttestationsRemaining <= 0) {
    Logger.debug(TAG + '@getAttestationsStatus', 'User is already verified')
  }

  return attestationStatus
}

function* requestAttestations(
  attestationsWrapper: AttestationsWrapper,
  numAttestationsRequestsNeeded: number,
  phoneHash: string,
  account: string
) {
  if (numAttestationsRequestsNeeded <= 0) {
    Logger.debug(`${TAG}@requestAttestations`, 'No additional attestations requests needed')
    return
  }

  const unselectedRequest: UnselectedRequest = yield call(
    [attestationsWrapper, attestationsWrapper.getUnselectedRequest],
    phoneHash,
    account
  )
  let isUnselectedRequestValid = unselectedRequest.blockNumber !== 0
  if (isUnselectedRequestValid) {
    isUnselectedRequestValid = !(yield call(
      [attestationsWrapper, attestationsWrapper.isAttestationExpired],
      unselectedRequest.blockNumber
    ))
  }

  if (isUnselectedRequestValid) {
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Valid unselected request found, skipping approval/request`
    )
  } else {
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Approving ${numAttestationsRequestsNeeded} new attestations`
    )
    const approveTx: CeloTransactionObject<boolean> = yield call(
      [attestationsWrapper, attestationsWrapper.approveAttestationFee],
      numAttestationsRequestsNeeded
    )

    yield call(sendTransaction, approveTx.txo, account, TAG, 'Approve Attestations')
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent)

    Logger.debug(
      `${TAG}@requestAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )

    const requestTx: CeloTransactionObject<void> = yield call(
      [attestationsWrapper, attestationsWrapper.request],
      phoneHash,
      numAttestationsRequestsNeeded
    )

    yield call(sendTransaction, requestTx.txo, account, TAG, 'Request Attestations')
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent)
  }

  Logger.debug(`${TAG}@requestAttestations`, 'Waiting for block to select issuer')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_await_issuer_selection)

  yield call([attestationsWrapper, attestationsWrapper.waitForSelectingIssuers], phoneHash, account)

  Logger.debug(`${TAG}@requestAttestations`, 'Selecting issuer')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_select_issuer)

  const selectIssuersTx = attestationsWrapper.selectIssuers(phoneHash)

  yield call(sendTransaction, selectIssuersTx.txo, account, TAG, 'Select Issuer')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_issuer_tx_sent)
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
      ValoraAnalytics.track(VerificationEvents.verification_code_received, {
        context: 'Empty code',
      })
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
        ValoraAnalytics.track(VerificationEvents.verification_code_received, {
          context: 'Code already exists',
        })
        if (
          CodeInputType.MANUAL === action.inputType ||
          CodeInputType.DEEP_LINK === action.inputType
        ) {
          yield put(showError(ErrorMessages.REPEAT_ATTESTATION_CODE))
        }
        return
      }
      ValoraAnalytics.track(VerificationEvents.verification_code_received)
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

      ValoraAnalytics.track(VerificationEvents.verification_code_validate_start, { issuer })
      const isValidRequest = yield call(
        [attestationsWrapper, attestationsWrapper.validateAttestationCode],
        phoneHash,
        account,
        issuer,
        code
      )
      ValoraAnalytics.track(VerificationEvents.verification_code_validate_complete, { issuer })

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
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_start, { issuer })
  yield call(tryRevealPhoneNumber, attestationsWrapper, account, phoneHashDetails, attestation)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_start, {
    issuer,
  })
  const code: AttestationCode = yield call(waitForAttestationCode, issuer)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
  })

  Logger.debug(TAG + '@revealAttestation', `Completing code for issuer: ${code.issuer}`)

  const completeTx: CeloTransactionObject<void> = yield call(
    [attestationsWrapper, attestationsWrapper.complete],
    phoneHashDetails.phoneHash,
    account,
    code.issuer,
    code.code
  )
  yield call(sendTransaction, completeTx.txo, account, TAG, `Complete ${issuer}`)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_complete, { issuer })

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

  try {
    const smsRetrieverAppSig =
      Platform.OS === 'android' && USE_PHONE_NUMBER_PRIVACY
        ? SMS_RETRIEVER_APP_SIGNATURE
        : undefined

    const useProxy = DEFAULT_TESTNET === 'mainnet' // Proxy required for any network where attestation service domains are not static

    const revealRequestBody: AttesationServiceRevealRequest = {
      account,
      issuer,
      phoneNumber: phoneHashDetails.e164Number,
      salt: phoneHashDetails.salt,
      smsRetrieverAppSig,
    }

    const { ok, status, body } = yield call(
      postToAttestationService,
      attestationsWrapper,
      attestation.attestationServiceURL,
      revealRequestBody,
      useProxy
    )

    if (ok) {
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing for issuer ${issuer} successful`)
      ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
        neededRetry: false,
        issuer,
      })
      return
    }

    if (body.error && body.error.includes('Attestation already sent')) {
      Logger.warn(TAG + '@tryRevealPhoneNumber', `Ignore already sent SMS for issuer: ${issuer}`)
      return
    }

    if (body.error && body.error.includes('No incomplete attestation found')) {
      // Retry as attestation service might not yet have received the block where it was made responsible for an attestation
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Retrying revealing for issuer: ${issuer}`)

      yield delay(REVEAL_RETRY_DELAY)

      const { ok: retryOk, status: retryStatus } = yield call(
        postToAttestationService,
        attestationsWrapper,
        attestation.attestationServiceURL,
        revealRequestBody,
        useProxy
      )

      if (retryOk) {
        Logger.debug(`${TAG}@tryRevealPhoneNumber`, `Reveal retry for issuer ${issuer} successful`)
        ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
          neededRetry: true,
          issuer,
        })
        return
      }

      Logger.error(
        `${TAG}@tryRevealPhoneNumber`,
        `Reveal retry for issuer ${issuer} failed with status ${retryStatus}`
      )
    }

    Logger.error(TAG + '@tryRevealPhoneNumber', `Reveal response not okay. Status code: ${status}`)
    throw new Error(
      `Error revealing to issuer ${attestation.attestationServiceURL}. Status code: ${status}`
    )
  } catch (error) {
    // This is considered a recoverable error because the user may have received the code in a previous run
    // So instead of propagating the error, we catch it just update status. This will trigger the modal,
    // allowing the user to enter codes manually or skip verification.
    Logger.error(TAG + '@tryRevealPhoneNumber', `Reveal for issuer ${issuer} failed`, error)
    ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_error, {
      issuer,
      error: error.message,
    })
    yield put(showError(ErrorMessages.REVEAL_ATTESTATION_FAILURE))
    yield put(setVerificationStatus(VerificationStatus.RevealAttemptFailed))
  }
}

async function postToAttestationService(
  attestationsWrapper: AttestationsWrapper,
  attestationServiceUrl: string,
  revealRequestBody: AttesationServiceRevealRequest,
  useProxy: boolean
): Promise<{ ok: boolean; status: number; body: any }> {
  if (useProxy) {
    Logger.debug(
      `${TAG}@postToAttestationService`,
      `Posting to proxy for service url ${attestationServiceUrl}`
    )
    const fullUrl = attestationServiceUrl + '/attestations'
    const body = {
      ...revealRequestBody,
      attestationServiceUrl: fullUrl,
    }
    try {
      const proxyReveal = functions().httpsCallable('proxyReveal')
      const response = await proxyReveal(body)
      const { status, data } = response.data
      const ok = status >= 200 && status < 300
      return { ok, status, body: JSON.parse(data) }
    } catch (error) {
      Logger.error(`${TAG}@postToAttestationService`, 'Error calling proxyReveal', error)
      // The httpsCallable throws on any HTTP error code instead of
      // setting response.ok like fetch does, so catching errors here
      return { ok: false, status: 500, body: error }
    }
  } else {
    Logger.debug(
      `${TAG}@postToAttestationService`,
      `Revealing with contract kit for service url ${attestationServiceUrl}`
    )
    const response = await attestationsWrapper.revealPhoneNumberToIssuer(
      revealRequestBody.phoneNumber,
      revealRequestBody.account,
      revealRequestBody.issuer,
      attestationServiceUrl,
      revealRequestBody.salt,
      revealRequestBody.smsRetrieverAppSig
    )
    const body = await response.json()
    return { ok: response.ok, status: response.status, body }
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

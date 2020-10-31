import { CeloTransactionObject } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  ActionableAttestation,
  AttesationServiceRevealRequest,
  AttestationsWrapper,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { retryAsync } from '@celo/utils/src/async'
import { AttestationsStatus, extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
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
import { DEFAULT_TESTNET, SMS_RETRIEVER_APP_SIGNATURE } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  completeAttestationCode,
  inputAttestationCode,
  InputAttestationCodeAction,
  ReceiveAttestationMessageAction,
  reportRevealStatus,
  ReportRevealStatusAction,
  resetVerification,
  setCompletedCodes,
  setLastRevealAttempt,
  setVerificationStatus,
  StartVerificationAction,
  udpateVerificationState,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  acceptedAttestationCodesSelector,
  attestationCodesSelector,
  isBalanceSufficientForSigRetrievalSelector,
  isVerificationStateExpiredSelector,
  VerificationState,
  verificationStateSelector,
} from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { VerificationStatus } from 'src/identity/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/verification'

export const NUM_ATTESTATIONS_REQUIRED = 3
export const ESTIMATED_COST_PER_ATTESTATION = 0.051
export const VERIFICATION_TIMEOUT = 10 * 60 * 1000 // 10 minutes
export const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
export const MAX_ACTIONABLE_ATTESTATIONS = 5
const REVEAL_RETRY_DELAY = 10 * 1000 // 10 seconds
const ANDROID_DELAY_REVEAL_ATTESTATION = 5000 // 5 sec after each

export enum CodeInputType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  DEEP_LINK = 'deepLink',
}

export interface AttestationCode {
  code: string
  issuer: string
}

export function* fetchVerificationState() {
  try {
    const account: string = yield call(getConnectedUnlockedAccount)
    const e164Number: string = yield select(e164NumberSelector)
    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    const { timeout } = yield race({
      balances: all([
        call(waitFor, stableTokenBalanceSelector),
        call(waitFor, celoTokenBalanceSelector),
      ]),
      timeout: delay(BALANCE_CHECK_TIMEOUT),
    })
    if (timeout) {
      Logger.debug(TAG, '@fetchVerificationState', 'Token balances is null or undefined')
      return
    }
    const isBalanceSufficientForSigRetrieval = yield select(
      isBalanceSufficientForSigRetrievalSelector
    )
    if (!isBalanceSufficientForSigRetrieval) {
      Logger.debug(TAG, '@fetchVerificationState', 'Insufficient balance for sig retrieval')
      return
    }

    const phoneHashDetails = yield call(getPhoneHashDetails, e164Number)
    ValoraAnalytics.track(VerificationEvents.verification_hash_retrieved, {
      phoneHash: phoneHashDetails.phoneHash,
      address: account,
    })

    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_start)
    yield put(setVerificationStatus(VerificationStatus.GettingStatus))
    // Get all relevant info about the account's verification status
    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      account,
      phoneHashDetails.phoneHash
    )
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_complete, {
      ...status,
    })

    const actionableAttestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsWrapper,
      phoneHashDetails.phoneHash,
      account
    )

    yield put(
      udpateVerificationState({
        phoneHashDetails,
        actionableAttestations,
        status,
      })
    )
  } catch (error) {
    Logger.error(TAG, 'Error occured during fetching verification state', error)
  }
}

export function* startVerification(action: StartVerificationAction) {
  ValoraAnalytics.track(VerificationEvents.verification_start)

  Logger.debug(TAG, 'Starting verification')

  const { result, cancel, timeout } = yield race({
    result: call(restartableVerification, action.withoutRevealing),
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
  })

  if (result === true) {
    ValoraAnalytics.track(VerificationEvents.verification_complete)
    Logger.debug(TAG, 'Verification completed successfully')
  } else if (result) {
    ValoraAnalytics.track(VerificationEvents.verification_error, { error: result })
    Logger.debug(TAG, 'Verification failed')
    yield call(reportActionableAttestationsStatuses)
  } else if (cancel) {
    ValoraAnalytics.track(VerificationEvents.verification_cancel)
    Logger.debug(TAG, 'Verification cancelled')
    yield call(reportActionableAttestationsStatuses)
  } else if (timeout) {
    ValoraAnalytics.track(VerificationEvents.verification_timeout)
    Logger.debug(TAG, 'Verification timed out')
    yield put(showError(ErrorMessages.VERIFICATION_TIMEOUT))
    yield put(setVerificationStatus(VerificationStatus.Failed))
    yield call(reportActionableAttestationsStatuses)
  }
  Logger.debug(TAG, 'Done verification')

  yield put(refreshAllBalances())
}

export function* restartableVerification(initialWithoutRevealing: boolean) {
  let isRestarted = false
  while (true) {
    const withoutRevealing = !isRestarted && initialWithoutRevealing
    yield call(navigate, Screens.VerificationLoadingScreen, {
      withoutRevealing,
    })
    yield put(resetVerification())
    yield call(getConnectedAccount)
    if (isRestarted || (yield select(isVerificationStateExpiredSelector))) {
      yield call(fetchVerificationState)
    }

    const { verification, restart } = yield race({
      verification: call(doVerificationFlow, withoutRevealing),
      restart: take(Actions.RESEND_ATTESTATIONS),
    })

    if (restart) {
      isRestarted = true
      const { status }: VerificationState = yield select(verificationStateSelector)
      ValoraAnalytics.track(VerificationEvents.verification_resend_messages, {
        count: status.numAttestationsRemaining,
      })
      Logger.debug(TAG, 'Verification has been restarted')
      continue
    }

    return verification
  }
}

export function* doVerificationFlow(withoutRevealing: boolean = false) {
  let receiveMessageTask: Task | undefined
  let autoRetrievalTask: Task | undefined
  try {
    yield put(setVerificationStatus(VerificationStatus.Prepping))
    const {
      phoneHashDetails,
      status,
      actionableAttestations,
      isBalanceSufficient,
    }: VerificationState = yield select(verificationStateSelector)
    if (!status.isVerified) {
      const { phoneHash } = phoneHashDetails
      const account: string = yield call(getConnectedUnlockedAccount)

      const contractKit = yield call(getContractKit)

      const attestationsWrapper: AttestationsWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getAttestations,
      ])

      if (!isBalanceSufficient) {
        yield put(setVerificationStatus(VerificationStatus.InsufficientBalance))
        // Return error message for logging purposes
        return ErrorMessages.INSUFFICIENT_BALANCE
      }

      // Mark codes completed in previous attempts
      yield put(setCompletedCodes(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

      let attestations = actionableAttestations

      if (Platform.OS === 'android') {
        autoRetrievalTask = yield fork(startAutoSmsRetrieval)
      }

      let issuers = attestations.map((a) => a.issuer)
      // Start listening for manual and/or auto message inputs
      receiveMessageTask = yield takeEvery(
        Actions.RECEIVE_ATTESTATION_MESSAGE,
        attestationCodeReceiver(attestationsWrapper, phoneHash, account, issuers)
      )

      if (!withoutRevealing) {
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start)
        // Request codes for the already existing attestations if any.
        // We check after which ones were successful
        const reveals: boolean[] = yield call(
          revealAttestations,
          attestationsWrapper,
          account,
          phoneHashDetails,
          attestations
        )

        // count how much more attestations we need to request
        const attestationsToRequest =
          status.numAttestationsRemaining - reveals.filter((r: boolean) => r).length

        // check if we hit the limit for max actionable attestations at the same time
        if (attestationsToRequest + attestations.length > MAX_ACTIONABLE_ATTESTATIONS) {
          throw new Error(ErrorMessages.MAX_ACTIONABLE_ATTESTATIONS_EXCEEDED)
        }

        if (attestationsToRequest) {
          yield put(setVerificationStatus(VerificationStatus.RequestingAttestations))
          // request more attestations
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
            attestationsToRequest,
          })
          attestations = yield call(
            requestAndRetrieveAttestations,
            attestationsWrapper,
            phoneHash,
            account,
            attestations,
            attestations.length + attestationsToRequest
          )
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
            issuers,
          })

          // start listening for the new list of attestations
          receiveMessageTask?.cancel()
          issuers = attestations.map((a) => a.issuer)
          receiveMessageTask = yield takeEvery(
            Actions.RECEIVE_ATTESTATION_MESSAGE,
            attestationCodeReceiver(attestationsWrapper, phoneHash, account, issuers)
          )

          // Request codes for the new list of attestations. We ignore unsuccessfull reveals here,
          // cause we do not want to go into a loop of re-requesting more and more attestations
          yield call(
            revealAttestations,
            attestationsWrapper,
            account,
            phoneHashDetails,
            attestations
          )
        }
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete)
      }

      yield put(setVerificationStatus(VerificationStatus.CompletingAttestations))
      yield race({
        actionableAttestationCompleted: all([
          call(completeAttestations, attestationsWrapper, account, phoneHashDetails, attestations),
          // Set acccount and data encryption key in Accounts contract
          // This is done in other places too, intentionally keeping it for more coverage
          call(registerAccountDek, account),
        ]),
        // This is needed, because we can have more actionableAttestations than NUM_ATTESTATIONS_REQUIRED
        requiredAttestationsCompleted: call(requiredAttestationsCompleted),
      })

      receiveMessageTask?.cancel()
      if (Platform.OS === 'android') {
        autoRetrievalTask?.cancel()
      }
    }

    yield put(setVerificationStatus(VerificationStatus.Done))
    yield put(setNumberVerified(true))
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      yield put(setVerificationStatus(VerificationStatus.SaltQuotaExceeded))
    } else if (error.message === ErrorMessages.ODIS_INSUFFICIENT_BALANCE) {
      yield put(setVerificationStatus(VerificationStatus.InsufficientBalance))
    } else {
      yield put(setVerificationStatus(VerificationStatus.Failed))
      yield put(showErrorOrFallback(error, ErrorMessages.VERIFICATION_FAILURE))
    }
    return error.message
  } finally {
    receiveMessageTask?.cancel()
    if (Platform.OS === 'android') {
      autoRetrievalTask?.cancel()
    }
  }
}

export function* requiredAttestationsCompleted() {
  while (true) {
    yield take(Actions.COMPLETE_ATTESTATION_CODE)
    const acceptedAttestationCodes: AttestationCode[] = yield select(
      acceptedAttestationCodesSelector
    )
    if (acceptedAttestationCodes.length >= NUM_ATTESTATIONS_REQUIRED) {
      return
    }
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
  currentActionableAttestations: ActionableAttestation[],
  attestationsNeeded: number
) {
  let attestations = currentActionableAttestations

  // Any verification failure past this point will be after sending a tx
  // so do not prompt forno retry as these failures are not always
  // light client related, and account may have insufficient balance
  yield put(setRetryVerificationWithForno(false))
  while (attestations.length < attestationsNeeded) {
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_start, {
      currentAttestation: attestations.length,
    })
    // Request any additional attestations beyond the original set
    yield call(
      requestAttestations,
      attestationsWrapper,
      attestationsNeeded - attestations.length,
      phoneHash,
      account
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_complete)

    // Check if we have a sufficient set now by fetching the new total set
    attestations = yield call(getActionableAttestations, attestationsWrapper, phoneHash, account)
    ValoraAnalytics.track(
      VerificationEvents.verification_request_all_attestations_refresh_progress,
      {
        attestationsRemaining: attestationsNeeded - attestations.length,
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
    NUM_ATTESTATIONS_REQUIRED,
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

  const attestationStatus = await attestationsWrapper.getVerifiedStatus(
    phoneHash,
    account,
    NUM_ATTESTATIONS_REQUIRED
  )

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

  // Check for attestation requests that need an issuer to be selected.
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

  // If any attestations require issuer selection, no new requests can be made
  // until the issuers are selected or the request expires.
  if (isUnselectedRequestValid) {
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Valid unselected request found, skipping approval/request`
    )
  } else {
    // Approve the attestation fee to be paid from the user's cUSD account.
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Approving ${numAttestationsRequestsNeeded} new attestations`
    )
    const approveTx: CeloTransactionObject<boolean> = yield call(
      [attestationsWrapper, attestationsWrapper.approveAttestationFee],
      numAttestationsRequestsNeeded
    )

    yield call(
      sendTransaction,
      approveTx.txo,
      account,
      newTransactionContext(TAG, 'Approve attestations')
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent)

    // Request the required number of attestations.
    Logger.debug(
      `${TAG}@requestAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )
    const requestTx: CeloTransactionObject<void> = yield call(
      [attestationsWrapper, attestationsWrapper.request],
      phoneHash,
      numAttestationsRequestsNeeded
    )

    yield call(
      sendTransaction,
      requestTx.txo,
      account,
      newTransactionContext(TAG, 'Request attestations')
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent)
  }

  // Wait for the issuer selection delay to elapse, then select issuers for the attestations.
  Logger.debug(`${TAG}@requestAttestations`, 'Waiting for block to select issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_await_issuer_selection)

  yield call([attestationsWrapper, attestationsWrapper.waitForSelectingIssuers], phoneHash, account)

  Logger.debug(`${TAG}@requestAttestations`, 'Selecting issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_select_issuer)

  const selectIssuersTx = attestationsWrapper.selectIssuers(phoneHash)

  yield call(
    sendTransaction,
    selectIssuersTx.txo,
    account,
    newTransactionContext(TAG, 'Select attestation issuers')
  )
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

function* revealAttestations(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(TAG + '@revealAttestations', `Revealing ${attestations.length} attestations`)
  const reveals = []
  for (const attestation of attestations) {
    const success = yield call(
      revealAttestation,
      attestationsWrapper,
      account,
      phoneHashDetails,
      attestation
    )
    // TODO (i1skn): remove this clause when
    // https://github.com/celo-org/celo-labs/issues/578 is resolved.
    // This sends messages with 5000ms delay on Android if reveals is successful
    if (success && Platform.OS === 'android') {
      Logger.debug(
        TAG + '@revealAttestations',
        `Delaying the next one for: ${ANDROID_DELAY_REVEAL_ATTESTATION}ms`
      )
      yield delay(ANDROID_DELAY_REVEAL_ATTESTATION)
    }
    reveals.push(success)
  }
  yield put(setLastRevealAttempt(Date.now()))
  return reveals
}
function* completeAttestations(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(
    TAG + '@completeNeededAttestations',
    `Completing ${attestations.length} attestations`
  )
  yield all(
    attestations.map((attestation) => {
      return call(completeAttestation, attestationsWrapper, account, phoneHashDetails, attestation)
    })
  )
}

function* revealAttestation(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_start, { issuer })
  return yield call(
    tryRevealPhoneNumber,
    attestationsWrapper,
    account,
    phoneHashDetails,
    attestation
  )
}

function* completeAttestation(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_start, {
    issuer,
  })
  const code: AttestationCode = yield call(waitForAttestationCode, issuer)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
  })

  Logger.debug(TAG + '@completeAttestation', `Completing code for issuer: ${code.issuer}`)

  // Generate and send the transaction to complete the attestation from the given issuer.
  const completeTx: CeloTransactionObject<void> = yield call(
    [attestationsWrapper, attestationsWrapper.complete],
    phoneHashDetails.phoneHash,
    account,
    code.issuer,
    code.code
  )
  const context = newTransactionContext(TAG, `Complete attestation from ${issuer}`)
  yield call(sendTransaction, completeTx.txo, account, context)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_complete, { issuer })

  // Report reveal status from validator
  yield put(
    reportRevealStatus(
      attestation.attestationServiceURL,
      account,
      issuer,
      phoneHashDetails.e164Number,
      phoneHashDetails.pepper
    )
  )
  Logger.debug(TAG + '@completeAttestation', `Attestation for issuer ${issuer} completed`)
  yield put(completeAttestationCode(code))
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
    // Only include retriever app sig for android, iOS doesn't support auto-read
    const smsRetrieverAppSig = Platform.OS === 'android' ? SMS_RETRIEVER_APP_SIGNATURE : undefined

    // Proxy required for any network where attestation service domains are not static
    // This works around TLS issues

    const revealRequestBody: AttesationServiceRevealRequest = {
      account,
      issuer,
      phoneNumber: phoneHashDetails.e164Number,
      salt: phoneHashDetails.pepper,
      smsRetrieverAppSig,
    }

    const { ok, status, body } = yield call(
      postToAttestationService,
      attestationsWrapper,
      attestation.attestationServiceURL,
      revealRequestBody
    )

    if (ok) {
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Revealing for issuer ${issuer} successful`)
      ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
        neededRetry: false,
        issuer,
      })
      return true
    }

    if (body.error && body.error.includes('No incomplete attestation found')) {
      // Retry as attestation service might not yet have received the block where it was made responsible for an attestation
      Logger.debug(TAG + '@tryRevealPhoneNumber', `Retrying revealing for issuer: ${issuer}`)

      yield delay(REVEAL_RETRY_DELAY)

      const { ok: retryOk, status: retryStatus } = yield call(
        postToAttestationService,
        attestationsWrapper,
        attestation.attestationServiceURL,
        revealRequestBody
      )

      if (retryOk) {
        Logger.debug(`${TAG}@tryRevealPhoneNumber`, `Reveal retry for issuer ${issuer} successful`)
        ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_revealed, {
          neededRetry: true,
          issuer,
        })
        return true
      }

      Logger.error(
        `${TAG}@tryRevealPhoneNumber`,
        `Reveal retry for issuer ${issuer} failed with status ${retryStatus}`
      )
    }

    // Reveal is unsuccessfull, so asking the status of it from validator
    yield put(
      reportRevealStatus(
        attestation.attestationServiceURL,
        account,
        issuer,
        phoneHashDetails.e164Number,
        phoneHashDetails.pepper
      )
    )

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
    return false
  }
}

async function postToAttestationService(
  attestationsWrapper: AttestationsWrapper,
  attestationServiceUrl: string,
  revealRequestBody: AttesationServiceRevealRequest
): Promise<{ ok: boolean; status: number; body: any }> {
  if (shouldUseProxy()) {
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

// Report to analytics reveal status from validator
export function* reportRevealStatusSaga({
  attestationServiceUrl,
  e164Number,
  account,
  issuer,
  pepper,
}: ReportRevealStatusAction) {
  let aggregatedResponse: undefined | { ok: boolean; status: number; body: any }
  if (shouldUseProxy()) {
    Logger.debug(
      `${TAG}@reportRevealStatusSaga`,
      `Posting to proxy for service url ${attestationServiceUrl}`
    )
    const fullUrl = attestationServiceUrl + '/get_attestations'
    const body = {
      attestationServiceUrl: fullUrl,
      account,
      phoneNumber: e164Number,
      issuer,
      pepper,
    }
    try {
      const proxyReveal = functions().httpsCallable('proxyRevealStatus')
      const response = yield call(proxyReveal, body)
      const { status, data } = response.data
      const ok = status >= 200 && status < 300
      aggregatedResponse = { ok, status, body: JSON.parse(data) }
    } catch (error) {
      Logger.error(`${TAG}@reportAttestationRevealStatus`, 'Error calling proxyRevealStatus', error)
      // The httpsCallable throws on any HTTP error code instead of
      // setting response.ok like fetch does, so catching errors here
      aggregatedResponse = { ok: false, status: 500, body: error }
    }
  } else {
    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    Logger.debug(
      `${TAG}@reportAttestationRevealStatus`,
      `Start for service url ${attestationServiceUrl}`
    )
    try {
      const response = yield call(
        attestationsWrapper.getRevealStatus,
        e164Number,
        account,
        issuer,
        attestationServiceUrl,
        pepper
      )
      const body = yield call(response.json.bind(response))
      aggregatedResponse = { ok: response.ok, body, status: response.status }
    } catch (error) {
      Logger.error(`${TAG}@reportAttestationRevealStatus`, 'Error calling proxyRevealStatus', error)
      aggregatedResponse = { ok: false, status: 500, body: error }
    }
  }
  if (aggregatedResponse.ok) {
    Logger.debug(
      `${TAG}@reportAttestationRevealStatus`,
      `Successful for service url ${attestationServiceUrl}`
    )
    ValoraAnalytics.track(
      VerificationEvents.verification_reveal_attestation_status,
      aggregatedResponse.body
    )
  } else {
    Logger.debug(
      `${TAG}@reportAttestationRevealStatus`,
      `Failed for service url ${attestationServiceUrl} with Status: ${aggregatedResponse.status}`
    )
  }
}

export function* reportActionableAttestationsStatuses() {
  const account: string = yield call(getConnectedUnlockedAccount)
  const e164Number: string = yield select(e164NumberSelector)
  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])
  const phoneHashDetails = yield call(getPhoneHashDetails, e164Number)
  const actionableAttestations: ActionableAttestation[] = yield call(
    getActionableAttestations,
    attestationsWrapper,
    phoneHashDetails.phoneHash,
    account
  )

  for (const attestation of actionableAttestations) {
    yield put(
      reportRevealStatus(
        attestation.attestationServiceURL,
        account,
        attestation.issuer,
        phoneHashDetails.e164Number,
        phoneHashDetails.pepper
      )
    )
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

function* getPhoneHashDetails(e164Number: string) {
  return yield call(fetchPhoneHashPrivate, e164Number)
}

function shouldUseProxy() {
  return DEFAULT_TESTNET === 'mainnet'
}

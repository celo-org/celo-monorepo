import { Result } from '@celo/base/lib/result'
import { CeloTransactionObject, ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  ActionableAttestation,
  AttesationServiceRevealRequest,
  AttestationsWrapper,
  IdentifierLookupResult,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { GetDistributedBlindedPepperResp } from '@celo/komencikit/src/actions'
import { FetchError, WalletValidationError } from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { Address } from '@celo/utils/src/address'
import { AttestationsStatus, extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import functions from '@react-native-firebase/functions'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
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
import { features } from 'src/flags'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  completeAttestationCode,
  feelessResetVerification,
  feelessSetVerificationStatus,
  feelessUpdateVerificationState,
  inputAttestationCode,
  InputAttestationCodeAction,
  ReceiveAttestationMessageAction,
  setCompletedCodes,
  setLastRevealAttempt,
  StartVerificationAction,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import {
  getAddressesFromLookupResult,
  lookupAttestationIdentifiers,
} from 'src/identity/contactMapping'
import {
  acceptedAttestationCodesSelector,
  attestationCodesSelector,
  e164NumberToSaltSelector,
  E164NumberToSaltType,
  FeelessVerificationState,
  feelessVerificationStateSelector,
  isFeelessVerificationStateExpiredSelector,
} from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { VerificationStatus } from 'src/identity/types'
import {
  ANDROID_DELAY_REVEAL_ATTESTATION,
  AttestationCode,
  CodeInputType,
  getActionableAttestations,
  getAttestationsStatus,
  NUM_ATTESTATIONS_REQUIRED,
  REVEAL_RETRY_DELAY,
  VERIFICATION_TIMEOUT,
} from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { setMtwAddress } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/feelessVerification'

const KOMENCI_URL = 'http://localhost:3000'
export const KOMENCI_MAX_ACTIONABLE_ATTESTATIONS = 5
const KOMENCI_ERROR_WINDOW = 1000 * 60 * 60 * 3 // 3 hours
const KOMENCI_ERROR_ALLOTMENT = 2
// TODO: Populate this with expected implementation address
const ALLOWED_MTW_IMPLEMENTATIONS: Address[] = []

// If a user has already encountered too many errors within a given window,
// do not allow them try verifing using Komenci again
const hasExceededErrorAllotment = (komenciErrorTimestamps: number[]) => {
  const currentTime = Date.now()
  const recentErrors = komenciErrorTimestamps.filter(
    (timestamp) => currentTime - timestamp < KOMENCI_ERROR_WINDOW
  )

  return recentErrors.length > KOMENCI_ERROR_ALLOTMENT
}

function* checkKomenciReadiness(
  komenciKit: KomenciKit,
  feelessVerificationState: FeelessVerificationState
) {
  const featureEnabled = features.KOMENCI
  if (!featureEnabled) {
    throw Error('Komenci not available: Feature not enabled')
  }

  const serviceStatus = yield call(komenciKit.checkService)
  if (!serviceStatus.ok) {
    throw Error(`Komenci not available: ${serviceStatus.error.message}`)
  }

  const {
    komenci: { errorTimestamps },
  } = feelessVerificationState
  const exceededErrorAllotment = hasExceededErrorAllotment(errorTimestamps)
  if (exceededErrorAllotment) {
    throw Error(
      `Komenci not available: Flow has failed more than ${KOMENCI_ERROR_ALLOTMENT} times within ${KOMENCI_ERROR_WINDOW /
        1000 /
        60 /
        60} hours`
    )
  }

  return true
}

function* getPhoneHashIfCached(e164Number: string) {
  const pepperCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const cachedPepper = pepperCache[e164Number]

  // If the user has started feeless verification, pepper will have been
  // queried for and cached by Komenci already
  if (!cachedPepper) {
    throw Error('No pepper in cache yet')
  }

  const phoneHash = getPhoneHash(e164Number, cachedPepper)
  const phoneHashDetails: PhoneNumberHashDetails = { e164Number, phoneHash, pepper: cachedPepper }
  return phoneHashDetails
}

function* fetchVerifiedMtwAddress(
  contractKit: ContractKit,
  phoneHash: string,
  walletAddress: string
) {
  const lookupResult: IdentifierLookupResult = yield call(lookupAttestationIdentifiers, [phoneHash])
  const possibleMtwAddresses = getAddressesFromLookupResult(lookupResult, phoneHash)
  if (!possibleMtwAddresses) {
    return null
  }

  const verificationResults: Array<Result<true, WalletValidationError>> = yield all(
    possibleMtwAddresses.map((possibleMtwAddress) => {
      return call(
        verifyWallet,
        contractKit,
        possibleMtwAddress,
        ALLOWED_MTW_IMPLEMENTATIONS,
        walletAddress
      )
    })
  )

  const verifiedMtwAddresses = possibleMtwAddresses.filter(
    (mtwAddress, i) => verificationResults[i].ok
  )

  if (verifiedMtwAddresses.length > 2) {
    throw Error(
      'More than one verified MTW with walletAddress as signer found. Should never happen'
    )
  }

  return verifiedMtwAddresses[0] || null
}

export function* feelessFetchVerificationState() {
  try {
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_start)
    const contractKit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)
    const komenciKit = new KomenciKit(contractKit, walletAddress, {
      url: KOMENCI_URL,
    })
    const feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )

    // Throws error if Komenci is not ready for user
    yield call(checkKomenciReadiness, komenciKit, feelessVerificationState)

    const e164Number: string = yield select(e164NumberSelector)

    // Throws error if unable to retreive phone hash
    const phoneHashDetails: PhoneNumberHashDetails = yield call(getPhoneHashIfCached, e164Number)
    const { phoneHash } = phoneHashDetails
    const {
      lastFetch,
      komenci: { unverifiedMtwAddress },
    } = feelessVerificationState

    yield put(feelessSetVerificationStatus(VerificationStatus.GettingStatus))

    // If we have not checked before, see if there is already a verified MTW
    // address associated with the user's phone number and walletAddress
    if (!lastFetch) {
      const verifiedMtwAddress: string | null = yield call(
        fetchVerifiedMtwAddress,
        contractKit,
        phoneHash,
        walletAddress
      )

      if (verifiedMtwAddress) {
        yield put(setMtwAddress(verifiedMtwAddress))
        return yield put(
          feelessUpdateVerificationState({
            phoneHashDetails,
            actionableAttestations: feelessVerificationState.actionableAttestations,
            status: {
              isVerified: true,
              numAttestationsRemaining: 0,
              total: NUM_ATTESTATIONS_REQUIRED,
              completed: NUM_ATTESTATIONS_REQUIRED,
            },
            komenci: feelessVerificationState.komenci,
          })
        )
      }
    }

    // If there is no unverifiedMtwAddress in state, that means verification
    // hasn't been attempted yet and there's no state to update
    if (!unverifiedMtwAddress) {
      yield put(
        feelessUpdateVerificationState({
          phoneHashDetails,
          actionableAttestations: feelessVerificationState.actionableAttestations,
          status: feelessVerificationState.status,
          komenci: {
            ...feelessVerificationState.komenci,
            serviceAvailable: true,
          },
        })
      )
      return
    }

    // Get all relevant info about the account's verification status
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])

    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      unverifiedMtwAddress,
      phoneHash
    )

    const actionableAttestations: ActionableAttestation[] = yield call(
      getActionableAttestations,
      attestationsWrapper,
      phoneHash,
      unverifiedMtwAddress
    )

    // TODO: Check komenci session status here and add to state update. That way, if there is a valid
    // live session, we dont have to make the user do the reCAPTCHA again

    yield put(
      feelessUpdateVerificationState({
        phoneHashDetails,
        actionableAttestations,
        status,
        komenci: {
          ...feelessVerificationState.komenci,
          serviceAvailable: true,
        },
      })
    )

    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_complete, {
      ...status,
    })
  } catch (error) {
    Logger.error(TAG, 'Error occured during fetching verification state', error)
  }
}

export function* feelessStartVerification(action: StartVerificationAction) {
  ValoraAnalytics.track(VerificationEvents.verification_start)

  Logger.debug(TAG, 'Starting verification')

  const { result, cancel, timeout } = yield race({
    result: call(feelessRestartableVerification, action.withoutRevealing),
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
    yield put(feelessSetVerificationStatus(VerificationStatus.Failed))
  }
  Logger.debug(TAG, 'Done verification')

  yield put(refreshAllBalances())
}

export function* feelessRestartableVerification(initialWithoutRevealing: boolean) {
  let isRestarted = false
  while (true) {
    const withoutRevealing = !isRestarted && initialWithoutRevealing
    yield call(navigate, Screens.VerificationLoadingScreen, {
      withoutRevealing,
    })
    yield put(feelessResetVerification())
    yield call(getConnectedAccount)
    if (isRestarted || (yield select(isFeelessVerificationStateExpiredSelector))) {
      yield call(feelessFetchVerificationState)
    }

    const { verification, restart } = yield race({
      verification: call(feelessDoVerificationFlow, withoutRevealing),
      restart: take(Actions.RESEND_ATTESTATIONS),
    })
    if (restart) {
      isRestarted = true
      const { status }: FeelessVerificationState = yield select(feelessVerificationStateSelector)
      ValoraAnalytics.track(VerificationEvents.verification_resend_messages, {
        count: status.numAttestationsRemaining,
      })
    } else {
      return verification
    }
    Logger.debug(TAG, 'Verification has been restarted')
  }
}

export function* feelessDoVerificationFlow(withoutRevealing: boolean = false) {
  let receiveMessageTask: Task | undefined
  let autoRetrievalTask: Task | undefined
  try {
    yield put(feelessSetVerificationStatus(VerificationStatus.Prepping))
    let feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )

    if (!feelessVerificationState.status.isVerified) {
      const { serviceAvailable } = feelessVerificationState.komenci

      // Flow should never start if service is unavailable but including this
      // as an extra precaution
      if (!serviceAvailable) {
        throw Error('Komenci not available: Error thrown in flow, should never happen')
      }

      const [walletAddress, contractKit]: [string, ContractKit] = yield all([
        call(getConnectedUnlockedAccount),
        call(getContractKit),
      ])

      const komenciKit = new KomenciKit(contractKit, walletAddress, {
        url: KOMENCI_URL,
      })

      // TODO: Use KomenciKit to ping Komenci to check if the current session is active
      const sessionActive = true

      // If Komenci session is not active, navigate back to the education screen
      // so they can do the reCAPTCHA again
      if (!sessionActive) {
        // TODO: make

        // QUESTION: Does this have unintended consequences for the screen stack?
        // TODO: Add an explanation for the user to understand why they are being sent back to
        // this screen
        yield call(navigate, Screens.VerificationEducationScreen, {
          hideOnboardingStep: true,
          showSkipDialog: false,
        })

        throw Error('Komenci session expired')
      }

      const e164Number: string = yield select(e164NumberSelector)
      const pepperCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
      let ownPepper = pepperCache[e164Number]
      let { phoneHash } = feelessVerificationState.phoneHashDetails

      if (!ownPepper) {
        let { pepperQuotaRemaining } = feelessVerificationState.komenci
        if (!pepperQuotaRemaining) {
          throw Error('No pepper quota remaining, must redo reCAPTCHA')
        }

        // NOTE: This is returning the identifier in addition to the pepper, which I believe is not desired
        const pepperQueryResult: Result<GetDistributedBlindedPepperResp, FetchError> = yield call(
          komenciKit.getDistributedBlindedPepper,
          e164Number,
          DeviceInfo.getVersion()
        )

        if (!pepperQueryResult.ok) {
          throw Error(
            `Komenci failed to query for pepper. Error: ${pepperQueryResult.error.message}`
          )
        }

        pepperQuotaRemaining -= 1
        ownPepper = pepperQueryResult.result.pepper
        phoneHash = getPhoneHash(e164Number, ownPepper)

        yield put(
          feelessUpdateVerificationState({
            phoneHashDetails: {
              e164Number,
              phoneHash,
              pepper: ownPepper,
            },
            actionableAttestations: feelessVerificationState.actionableAttestations,
            status: feelessVerificationState.status,
            komenci: {
              ...feelessVerificationState.komenci,
              pepperQuotaRemaining,
            },
          })
        )
        yield put(updateE164PhoneNumberSalts({ [e164Number]: ownPepper }))
      }

      if (!phoneHash) {
        phoneHash = getPhoneHash(e164Number, ownPepper)
      }

      const attestationsWrapper: AttestationsWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getAttestations,
      ])

      // Mark codes from previous attempts as complete
      yield put(setCompletedCodes(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining))

      let attestations = actionableAttestations

      if (Platform.OS === 'android') {
        autoRetrievalTask = yield fork(startAutoSmsRetrieval)
      }

      let issuers = attestations.map((a) => a.issuer)
      // Start listening for manual and/or auto message inputs
      receiveMessageTask = yield takeEvery(
        Actions.RECEIVE_ATTESTATION_MESSAGE,
        attestationCodeReceiver(attestationsWrapper, phoneHash, walletAddress, issuers)
      )

      if (!withoutRevealing) {
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start)
        // Request codes for the already existing attestations if any.
        // We check after which ones were successful
        const reveals: boolean[] = yield call(
          revealAttestations,
          attestationsWrapper,
          walletAddress,
          phoneHashDetails,
          attestations
        )

        // count how much more attestations we need to request
        const attestationsToRequest =
          status.numAttestationsRemaining - reveals.filter((r: boolean) => r).length

        // check if we hit the limit for max actionable attestations at the same time
        if (attestationsToRequest + attestations.length > KOMENCI_MAX_ACTIONABLE_ATTESTATIONS) {
          throw new Error(ErrorMessages.MAX_ACTIONABLE_ATTESTATIONS_EXCEEDED)
        }

        if (attestationsToRequest) {
          yield put(feelessSetVerificationStatus(VerificationStatus.RequestingAttestations))
          // request more attestations
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
            attestationsToRequest,
          })
          attestations = yield call(
            requestAndRetrieveAttestations,
            attestationsWrapper,
            phoneHash,
            walletAddress,
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
            attestationCodeReceiver(attestationsWrapper, phoneHash, walletAddress, issuers)
          )

          // Request codes for the new list of attestations. We ignore unsuccessfull reveals here,
          // cause we do not want to go into a loop of re-requesting more and more attestations
          yield call(
            revealAttestations,
            attestationsWrapper,
            walletAddress,
            phoneHashDetails,
            attestations
          )
        }
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete)
      }

      yield put(feelessSetVerificationStatus(VerificationStatus.CompletingAttestations))
      yield race({
        actionableAttestationCompleted: all([
          call(
            completeAttestations,
            attestationsWrapper,
            walletAddress,
            phoneHashDetails,
            attestations
          ),
          // Set acccount and data encryption key in Accounts contract
          // This is done in other places too, intentionally keeping it for more coverage
          call(registerAccountDek, walletAddress),
        ]),
        // This is needed, because we can have more actionableAttestations than NUM_ATTESTATIONS_REQUIRED
        requiredAttestationsCompleted: call(requiredAttestationsCompleted),
      })

      receiveMessageTask?.cancel()
      if (Platform.OS === 'android') {
        autoRetrievalTask?.cancel()
      }
    }

    yield put(setNumberVerified(true))
    yield put(setMtwAddress(verifiedMtwAddress))
    yield put(feelessSetVerificationStatus(VerificationStatus.Done))
    return true
  } catch (error) {
    // TODO: catch the errors and decide which ones should trigger recpatcha and which one should be added
    // to the komenciErrorTimestamps array in feelessVerificationState. Probably also need some way to formally
    // end the feeless flow. Also decide what errors should be sending user to the home screen
    Logger.error(TAG, 'Error occured during verification flow', error)
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      yield put(feelessSetVerificationStatus(VerificationStatus.SaltQuotaExceeded))
    } else if (error.message === ErrorMessages.ODIS_INSUFFICIENT_BALANCE) {
      yield put(feelessSetVerificationStatus(VerificationStatus.InsufficientBalance))
    } else {
      yield put(feelessSetVerificationStatus(VerificationStatus.Failed))
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

    yield call(
      sendTransaction,
      approveTx.txo,
      account,
      newTransactionContext(TAG, 'Approve attestations')
    )
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

    yield call(
      sendTransaction,
      requestTx.txo,
      account,
      newTransactionContext(TAG, 'Request attestations')
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent)
  }

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

  yield put(completeAttestationCode(code))
  Logger.debug(TAG + '@completeAttestation', `Attestation for issuer ${issuer} completed`)
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
    const useProxy = DEFAULT_TESTNET === 'mainnet'

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
      revealRequestBody,
      useProxy
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
        revealRequestBody,
        useProxy
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

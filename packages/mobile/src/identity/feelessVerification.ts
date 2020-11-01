import { Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  ActionableAttestation,
  AttestationsWrapper,
  IdentifierLookupResult,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { GetDistributedBlindedPepperResp } from '@celo/komencikit/src/actions'
import {
  AuthenticationFailed,
  FetchError,
  InvalidWallet,
  LoginSignatureError,
  TxError,
  WalletValidationError,
} from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { Address } from '@celo/utils/src/address'
import { AttestationsStatus, extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { Task } from 'redux-saga'
import { all, call, delay, fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { features } from 'src/flags'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  feelessCompleteAttestationCode,
  feelessInputAttestationCode,
  FeelessInputAttestationCodeAction,
  feelessResetVerification,
  feelessSetCompletedCodes,
  feelessSetLastRevealAttempt,
  feelessSetVerificationStatus,
  feelessUpdateVerificationState,
  ReceiveAttestationMessageAction,
  StartVerificationAction,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import {
  getAddressesFromLookupResult,
  lookupAttestationIdentifiers,
} from 'src/identity/contactMapping'
import {
  e164NumberToSaltSelector,
  E164NumberToSaltType,
  feelessAcceptedAttestationCodesSelector,
  feelessAttestationCodesSelector,
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
  revealAttestation,
  VERIFICATION_TIMEOUT,
} from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { setMtwAddress } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { TransactionReceipt } from 'web3-eth'

const TAG = 'identity/feelessVerification'

const KOMENCI_URL = 'http://localhost:3000'
export const KOMENCI_MAX_ACTIONABLE_ATTESTATIONS = 5
const KOMENCI_ERROR_WINDOW = 1000 * 60 * 60 * 3 // 3 hours
const KOMENCI_ERROR_ALLOTMENT = 2
// TODO: Populate this with expected implementation address
const ALLOWED_MTW_IMPLEMENTATIONS: Address[] = []
const CURRENT_MTW_IMPLEMENTATION_ADDRESS: Address = ''

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

function* getPhoneHashDetails(e164Number: string) {
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
  phoneHashDetails: PhoneNumberHashDetails,
  walletAddress: string
) {
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )
  const { phoneHash } = phoneHashDetails
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
    (address, i) => verificationResults[i].ok
  )

  if (verifiedMtwAddresses.length > 2) {
    throw Error(
      'More than one verified MTW with walletAddress as signer found. Should never happen'
    )
  }

  if (null) {
    return
  }

  const mtwAddress = verifiedMtwAddresses[0]
  yield put(
    feelessUpdateVerificationState({
      phoneHashDetails,
      actionableAttestations: feelessVerificationState.actionableAttestations,
      status: {
        isVerified: true,
        numAttestationsRemaining: 0,
        total: NUM_ATTESTATIONS_REQUIRED,
        completed: NUM_ATTESTATIONS_REQUIRED,
      },
      komenci: {
        ...feelessVerificationState.komenci,
        serviceAvailable: true,
      },
    })
  )

  yield put(setMtwAddress(mtwAddress))
  return mtwAddress
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
    const phoneHashDetails: PhoneNumberHashDetails = yield call(getPhoneHashDetails, e164Number)
    const { phoneHash } = phoneHashDetails
    const { unverifiedMtwAddress } = feelessVerificationState.komenci

    yield put(feelessSetVerificationStatus(VerificationStatus.GettingStatus))

    // If there is no unverifiedMtwAddress in state, that means a new wallet
    // hasn't been deployed yet. First check if there is a verified one
    if (!unverifiedMtwAddress) {
      yield call(fetchVerifiedMtwAddress, contractKit, phoneHashDetails, walletAddress)

      // If a wallet hasn't deployed yet, there is no point in checking the
      // Attestations contract for progress. Save state and bail
      yield put(
        feelessUpdateVerificationState({
          ...feelessVerificationState,
          phoneHashDetails,
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

function* endFeelessVerification(mtwAddress: string) {
  yield put(setNumberVerified(true))
  yield put(setMtwAddress(mtwAddress))
  yield put(feelessSetVerificationStatus(VerificationStatus.Done))
}

export function* feelessDoVerificationFlow(withoutRevealing: boolean = false) {
  let receiveMessageTask: Task | undefined
  let autoRetrievalTask: Task | undefined

  try {
    yield put(feelessSetVerificationStatus(VerificationStatus.Prepping))

    const feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )
    let { unverifiedMtwAddress } = feelessVerificationState.komenci
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

    if (!feelessVerificationState.status.isVerified || !unverifiedMtwAddress) {
      // If there isn't a sessionToken, you need to start a new Komenci session
      if (!feelessVerificationState.komenci.sessionToken.length) {
        const { captchaToken } = feelessVerificationState.komenci
        if (!captchaToken.length) {
          // TODO: Add an explanation for the user to understand why they are being sent back to
          // QUESTION: Does this have unintended consequences for the screen stack?
          yield call(navigate, Screens.VerificationEducationScreen, {
            hideOnboardingStep: true,
            showSkipDialog: false,
          })
          throw Error('No captchaToken stored. Should never happen')
        }

        const komenciSessionResult: Result<
          string,
          FetchError | AuthenticationFailed | LoginSignatureError
        > = yield call(komenciKit.startSession, captchaToken)

        if (!komenciSessionResult.ok) {
          throw Error('Komenci unable to start session')
        }

        const sessionToken = komenciSessionResult.result
        yield put(
          feelessUpdateVerificationState({
            ...feelessVerificationState,
            komenci: {
              ...feelessVerificationState.komenci,
              sessionToken,
              sessionActive: true,
            },
          })
        )
      }

      // TODO: Use KomenciKit to ping Komenci to check if the current session is still active
      const sessionActive = true

      // If Komenci session is not active, navigate back to the education screen
      // so they can do the reCAPTCHA again
      if (!sessionActive) {
        // TODO: Add an explanation for the user to understand why they are being sent back to
        // QUESTION: Does this have unintended consequences for the screen stack?
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
      let {
        phoneHashDetails,
        komenci: { pepperQuotaRemaining },
      } = feelessVerificationState

      if (!ownPepper) {
        if (!pepperQuotaRemaining) {
          throw Error('No pepper quota remaining, must redo captcha')
        }

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
        yield put(updateE164PhoneNumberSalts({ [e164Number]: ownPepper }))
      }

      phoneHashDetails = yield call(getPhoneHashDetails, e164Number)

      yield put(
        feelessUpdateVerificationState({
          phoneHashDetails,
          actionableAttestations: feelessVerificationState.actionableAttestations,
          status: feelessVerificationState.status,
          komenci: {
            ...feelessVerificationState.komenci,
            pepperQuotaRemaining,
          },
        })
      )

      // If the user used the Komenci quota to fetch the pepper, check if the they
      // have a verified account. If user already had their pepper, then check would have
      // already happened in `feelessFetchVerificationState`
      if (pepperQuotaRemaining < feelessVerificationState.komenci.pepperQuotaRemaining) {
        const verifiedMtwAddress: string | null = yield call(
          fetchVerifiedMtwAddress,
          contractKit,
          phoneHashDetails,
          walletAddress
        )

        if (verifiedMtwAddress) {
          yield call(endFeelessVerification, verifiedMtwAddress)
          return true
        }
      }

      // If there isn't a wallet in verification state, ask Komenci to deploy one
      if (!unverifiedMtwAddress) {
        const deployWalletResult: Result<string, FetchError | TxError | InvalidWallet> = yield call(
          komenciKit.deployWallet,
          CURRENT_MTW_IMPLEMENTATION_ADDRESS
        )
        if (!deployWalletResult.ok) {
          throw Error(`Komenci failed to deploy MTW. Error: ${deployWalletResult.error.message}`)
        }

        unverifiedMtwAddress = deployWalletResult.result
      }

      // Check if MTW that was deployed is what we expected
      const validityCheckResult: Result<true, WalletValidationError> = yield call(
        verifyWallet,
        contractKit,
        unverifiedMtwAddress,
        ALLOWED_MTW_IMPLEMENTATIONS,
        walletAddress
      )

      if (!validityCheckResult.ok) {
        throw Error(
          `Deployed wallet did not meet expectations. Error: ${validityCheckResult.error.message}`
        )
      }

      yield put(
        feelessUpdateVerificationState({
          ...feelessVerificationState,
          komenci: {
            ...feelessVerificationState.komenci,
            unverifiedMtwAddress,
          },
        })
      )

      // Registering the DEK and wallet before beginning verification to guarantee that every
      // verified MTW address (i.e., accountAddress) has an EOA (i.e., walletAddress)
      // registered to it. If that's not guaranteed, users are at risk of sending to MTWs
      yield call(registerWalletAndDekViaKomenci, komenciKit, unverifiedMtwAddress, walletAddress)

      // ====== Below this point feeless verification has a similar structure to the original ====== //

      const { status, actionableAttestations } = feelessVerificationState
      const { phoneHash } = phoneHashDetails
      const attestationsWrapper: AttestationsWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getAttestations,
      ])

      // Mark codes from previous attempts as complete
      yield put(
        feelessSetCompletedCodes(NUM_ATTESTATIONS_REQUIRED - status.numAttestationsRemaining)
      )

      let attestations = actionableAttestations

      if (Platform.OS === 'android') {
        autoRetrievalTask = yield fork(startAutoSmsRetrieval)
      }

      let issuers = attestations.map((a) => a.issuer)
      // Start listening for manual and/or auto message inputs
      receiveMessageTask = yield takeEvery(
        Actions.RECEIVE_ATTESTATION_MESSAGE,
        feelessAttestationCodeReceiver(
          attestationsWrapper,
          phoneHash,
          unverifiedMtwAddress,
          issuers
        )
      )

      if (!withoutRevealing) {
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start)
        // Request codes for the already existing attestations if any.
        // We check after which ones were successful
        const reveals: boolean[] = yield call(
          feelessRevealAttestations,
          attestationsWrapper,
          unverifiedMtwAddress,
          phoneHashDetails,
          attestations
        )

        // Count how many more attestations we need to request
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
            feelessRequestAndRetrieveAttestations,
            komenciKit,
            attestationsWrapper,
            phoneHash,
            unverifiedMtwAddress,
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
            feelessAttestationCodeReceiver(
              attestationsWrapper,
              phoneHash,
              unverifiedMtwAddress,
              issuers
            )
          )

          // Request codes for the new list of attestations. We ignore unsuccessfull reveals here,
          // cause we do not want to go into a loop of re-requesting more and more attestations
          yield call(
            feelessRevealAttestations,
            attestationsWrapper,
            unverifiedMtwAddress,
            phoneHashDetails,
            attestations
          )
        }
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete)
      }

      yield put(feelessSetVerificationStatus(VerificationStatus.CompletingAttestations))

      yield race([
        call(
          feelessCompleteAttestations,
          komenciKit,
          unverifiedMtwAddress,
          phoneHashDetails,
          attestations
        ),
        // This is needed, because we can have more actionableAttestations than NUM_ATTESTATIONS_REQUIRED
        call(requiredAttestationsCompleted),
      ])

      receiveMessageTask?.cancel()
      if (Platform.OS === 'android') {
        autoRetrievalTask?.cancel()
      }
    }

    // Intentionally calling this a second time because it's critical that this is successful
    // so user shouldn't be considered verified until we are sure it has been done
    yield call(registerWalletAndDekViaKomenci, komenciKit, unverifiedMtwAddress, walletAddress)

    yield call(endFeelessVerification, unverifiedMtwAddress)
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
    yield take(Actions.FEELESS_COMPLETE_ATTESTATION_CODE)
    const acceptedAttestationCodes: AttestationCode[] = yield select(
      feelessAcceptedAttestationCodesSelector
    )
    if (acceptedAttestationCodes.length >= NUM_ATTESTATIONS_REQUIRED) {
      return
    }
  }
}

// Requests if necessary additional attestations and returns all revealable attestations
export function* feelessRequestAndRetrieveAttestations(
  komenciKit: KomenciKit,
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  mtwAddress: string,
  currentActionableAttestations: ActionableAttestation[],
  attestationsNeeded: number
) {
  let attestations = currentActionableAttestations
  while (attestations.length < attestationsNeeded) {
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_start, {
      currentAttestation: attestations.length,
    })
    // Request any additional attestations beyond the original set
    yield call(
      feelessRequestAttestations,
      komenciKit,
      attestationsWrapper,
      attestationsNeeded - attestations.length,
      phoneHash,
      mtwAddress
    )
    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_complete)

    // Check if we have a sufficient set now by fetching the new total set
    attestations = yield call(getActionableAttestations, attestationsWrapper, phoneHash, mtwAddress)
    ValoraAnalytics.track(
      VerificationEvents.verification_request_all_attestations_refresh_progress,
      {
        attestationsRemaining: attestationsNeeded - attestations.length,
      }
    )
  }

  return attestations
}

function* feelessRequestAttestations(
  komenciKit: KomenciKit,
  attestationsWrapper: AttestationsWrapper,
  numAttestationsRequestsNeeded: number,
  phoneHash: string,
  mtwAddress: string
) {
  if (numAttestationsRequestsNeeded <= 0) {
    Logger.debug(`${TAG}@feelessRequestAttestations`, 'No additional attestations requests needed')
    return
  }

  const unselectedRequest: UnselectedRequest = yield call(
    [attestationsWrapper, attestationsWrapper.getUnselectedRequest],
    phoneHash,
    mtwAddress
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
      `${TAG}@feelessRequestAttestations`,
      `Valid unselected request found, skipping approval/request`
    )
  } else {
    Logger.debug(
      `${TAG}@feelessRequestAttestations`,
      `Approving ${numAttestationsRequestsNeeded} new attestations`
    )

    const approveTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
      komenciKit.approveAttestations,
      mtwAddress,
      numAttestationsRequestsNeeded
    )

    if (!approveTxResult.ok) {
      throw approveTxResult.error
    }

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent)

    Logger.debug(
      `${TAG}@feelessRequestAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )

    const requestTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
      komenciKit.requestAttestations,
      mtwAddress,
      phoneHash,
      numAttestationsRequestsNeeded
    )
    if (!requestTxResult.ok) {
      throw requestTxResult.error
    }

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent)
  }

  Logger.debug(`${TAG}@feelessRequestAttestations`, 'Waiting for block to select issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_await_issuer_selection)

  yield call(
    [attestationsWrapper, attestationsWrapper.waitForSelectingIssuers],
    phoneHash,
    mtwAddress
  )

  Logger.debug(`${TAG}@feelessRequestAttestations`, 'Selecting issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_select_issuer)

  const selectIssuersTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
    komenciKit.selectIssuers,
    mtwAddress,
    phoneHash
  )

  if (!selectIssuersTxResult.ok) {
    throw selectIssuersTxResult.error
  }

  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_issuer_tx_sent)
}

function feelessAttestationCodeReceiver(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  mtwAddress: string,
  allIssuers: string[]
) {
  return function*(action: ReceiveAttestationMessageAction) {
    if (!action || !action.message) {
      Logger.error(TAG + '@feelessAttestationCodeReceiver', 'Received empty code. Ignoring.')
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

      const existingCode = yield call(feelessIsCodeAlreadyAccepted, code)
      if (existingCode) {
        Logger.warn(
          TAG + '@feelessAttestationCodeReceiver',
          'Code already exists in store, skipping.'
        )
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
        mtwAddress,
        code,
        allIssuers
      )
      if (!issuer) {
        throw new Error('No issuer found for attestion code')
      }

      Logger.debug(TAG + '@feelessAttestationCodeReceiver', `Received code for issuer ${issuer}`)

      ValoraAnalytics.track(VerificationEvents.verification_code_validate_start, { issuer })
      const isValidRequest = yield call(
        [attestationsWrapper, attestationsWrapper.validateAttestationCode],
        phoneHash,
        mtwAddress,
        issuer,
        code
      )
      ValoraAnalytics.track(VerificationEvents.verification_code_validate_complete, { issuer })

      if (!isValidRequest) {
        throw new Error('Code is not valid')
      }

      yield put(feelessInputAttestationCode({ code, issuer }))
    } catch (error) {
      Logger.error(
        TAG + '@feelessAttestationCodeReceiver',
        'Error processing attestation code',
        error
      )
      yield put(showError(ErrorMessages.INVALID_ATTESTATION_CODE))
    }
  }
}

function* feelessGetCodeForIssuer(issuer: string) {
  const existingCodes: AttestationCode[] = yield select(feelessAttestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
}

function* feelessIsCodeAlreadyAccepted(code: string) {
  const existingCodes: AttestationCode[] = yield select(feelessAcceptedAttestationCodesSelector)
  return existingCodes.find((c) => c.code === code)
}

function* feelessRevealAttestations(
  attestationsWrapper: AttestationsWrapper,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(TAG + '@feelessRevealAttestations', `Revealing ${attestations.length} attestations`)
  const reveals = []
  for (const attestation of attestations) {
    const success = yield call(
      revealAttestation,
      attestationsWrapper,
      mtwAddress,
      phoneHashDetails,
      attestation
    )
    // TODO (i1skn): remove this clause when
    // https://github.com/celo-org/celo-labs/issues/578 is resolved.
    // This sends messages with 5000ms delay on Android if reveals is successful
    if (success && Platform.OS === 'android') {
      Logger.debug(
        TAG + '@feelessRevealAttestations',
        `Delaying the next one for: ${ANDROID_DELAY_REVEAL_ATTESTATION}ms`
      )
      yield delay(ANDROID_DELAY_REVEAL_ATTESTATION)
    }
    reveals.push(success)
  }
  yield put(feelessSetLastRevealAttempt(Date.now()))
  return reveals
}

function* feelessCompleteAttestations(
  komenciKit: KomenciKit,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestations: ActionableAttestation[]
) {
  Logger.debug(
    TAG + '@completeNeededAttestations',
    `Completing ${attestations.length} attestations`
  )
  yield all(
    attestations.map((attestation) => {
      return call(feelessCompleteAttestation, komenciKit, mtwAddress, phoneHashDetails, attestation)
    })
  )
}

function* feelessCompleteAttestation(
  komenciKit: KomenciKit,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_start, {
    issuer,
  })
  const code: AttestationCode = yield call(feelessWaitForAttestationCode, issuer)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
  })

  Logger.debug(TAG + '@feelessCompleteAttestation', `Completing code for issuer: ${code.issuer}`)

  const completeTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
    komenciKit.completeAttestation,
    mtwAddress,
    phoneHashDetails.phoneHash,
    code.issuer,
    code.code
  )

  if (!completeTxResult.ok) {
    throw completeTxResult.error
  }

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_complete, { issuer })

  yield put(feelessCompleteAttestationCode(code))
  Logger.debug(TAG + '@feelessCompleteAttestation', `Attestation for issuer ${issuer} completed`)
}

// Get the code from the store if it's already there, otherwise wait for it
function* feelessWaitForAttestationCode(issuer: string) {
  Logger.debug(TAG + '@feelessWaitForAttestationCode', `Waiting for code for issuer ${issuer}`)
  const code = yield call(feelessGetCodeForIssuer, issuer)
  if (code) {
    return code
  }

  while (true) {
    const action: FeelessInputAttestationCodeAction = yield take(
      Actions.FEELESS_INPUT_ATTESTATION_CODE
    )
    if (action.code.issuer === issuer) {
      return action.code
    }
  }
}

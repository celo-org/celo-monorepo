import { Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  ActionableAttestation,
  AttestationsWrapper,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import {
  CheckSessionResp,
  GetDistributedBlindedPepperResp,
  StartSessionResp,
} from '@celo/komencikit/src/actions'
import {
  AuthenticationFailed,
  FetchError,
  InvalidWallet,
  KomenciDown,
  LoginSignatureError,
  TxError,
  WalletValidationError,
} from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { AttestationsStatus } from '@celo/utils/src/attestations'
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
import networkConfig from 'src/geth/networkConfig'
import { waitForNextBlock } from 'src/geth/saga'
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  feelessCompleteAttestationCode,
  FeelessInputAttestationCodeAction,
  feelessProcessingInputCode,
  feelessResetVerification,
  feelessSetCompletedCodes,
  feelessSetVerificationStatus,
  feelessUpdateVerificationState,
  StartVerificationAction,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import {
  hasExceededKomenciErrorQuota,
  KomenciDisabledError,
  KomenciErrorQuotaExceeded,
  KomenciSessionInvalidError,
  PepperNotCachedError,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
import {
  e164NumberToSaltSelector,
  E164NumberToSaltType,
  feelessAcceptedAttestationCodesSelector,
  feelessAttestationCodesSelector,
  feelessProcessingInputCodeSelector,
  FeelessVerificationState,
  feelessVerificationStateSelector,
  isFeelessVerificationStateExpiredSelector,
} from 'src/identity/reducer'
import { startAutoSmsRetrieval } from 'src/identity/smsRetrieval'
import { VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  attestationCodeReceiver,
  completeAttestations,
  getActionableAttestations,
  getAttestationsStatus,
  NUM_ATTESTATIONS_REQUIRED,
  requestAndRetrieveAttestations,
  revealAttestations,
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

// NOTE: This will need to change if we begin to use the `total`
// property as a consideration for verification status
const VERIFIED_ATTESTATION_STATUS = {
  isVerified: true,
  numAttestationsRemaining: 0,
  total: NUM_ATTESTATIONS_REQUIRED,
  completed: NUM_ATTESTATIONS_REQUIRED,
}

export function* feelessFetchVerificationState() {
  Logger.debug(TAG, '@feelessFetchVerificationState', 'Starting fetch')
  try {
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_start, { feeless: true })
    const [contractKit, walletAddress, feelessVerificationState, e164Number]: [
      ContractKit,
      string,
      FeelessVerificationState,
      string
    ] = yield all([
      call(getContractKit),
      call(getConnectedUnlockedAccount),
      select(feelessVerificationStateSelector),
      select(e164NumberSelector),
      put(feelessSetVerificationStatus(VerificationStatus.GettingStatus)),
    ])

    const komenciKit = new KomenciKit(contractKit, walletAddress, {
      url: feelessVerificationState.komenci.callbackUrl || networkConfig.komenciUrl,
      token: feelessVerificationState.komenci.sessionToken,
    })

    try {
      // Throws error if Komenci is not ready for user, otherwise it updates state
      yield call(fetchKomenciReadiness, komenciKit)
    } catch (error) {
      // Checks if a MTW was verified in a previous attempt and updates state.
      // This check will likely fail because the pepper hasn't been cached yet
      // but needs to happen for the edge case that a user has a cached pepper
      // and Komenci is down. If a verified MTW is found, return
      try {
        yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)
        return
      } catch (e) {
        Logger.debug(TAG, 'Unable to check if MTW is verified on first attempt')
      }
      throw error
    }

    // Throws error if unable to retreive phone hash, otherwise it updates state
    yield call(fetchPhoneHashDetailsFromCache, e164Number)

    // Updates state with sessionStatus and the mtwAddress associated with the session
    yield call(fetchKomenciSessionState, komenciKit, e164Number)

    // Checks if a MTW was verified in a previous attempt and updates state
    yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)

    // Updates state with any attestation progress that's been made
    const status: AttestationsStatus = yield call(fetchAttestationStatus, contractKit)
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_complete, {
      ...status,
      feeless: true,
    })
  } catch (error) {
    Logger.error(TAG, 'Error occured while fetching verification state', error)
    yield call(storeTimestampIfKomenciError, error, false)
  } finally {
    yield put(feelessSetVerificationStatus(VerificationStatus.Stopped))
  }
}

export function* feelessStartVerification(action: StartVerificationAction) {
  ValoraAnalytics.track(VerificationEvents.verification_start, { feeless: true })

  Logger.debug(TAG, 'Starting verification')

  const { result, cancel, timeout } = yield race({
    result: call(feelessRestartableVerification, action.withoutRevealing),
    cancel: take(Actions.CANCEL_VERIFICATION),
    timeout: delay(VERIFICATION_TIMEOUT),
  })

  if (result === true) {
    ValoraAnalytics.track(VerificationEvents.verification_complete, { feeless: true })
    Logger.debug(TAG, 'Verification completed successfully')
  } else if (result) {
    ValoraAnalytics.track(VerificationEvents.verification_error, { error: result, feeless: true })
    Logger.debug(TAG, 'Verification failed')
  } else if (cancel) {
    ValoraAnalytics.track(VerificationEvents.verification_cancel, { feeless: true })
    Logger.debug(TAG, 'Verification cancelled')
  } else if (timeout) {
    ValoraAnalytics.track(VerificationEvents.verification_timeout, { feeless: true })
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
      restart: take(Actions.FEELESS_RESEND_ATTESTATIONS),
    })

    if (restart) {
      isRestarted = true
      const { status }: FeelessVerificationState = yield select(feelessVerificationStateSelector)
      ValoraAnalytics.track(VerificationEvents.verification_resend_messages, {
        count: status.numAttestationsRemaining,
        feeless: true,
      })
    } else {
      return verification
    }
    Logger.debug(TAG, 'Verification has been restarted')
  }
}

export function* feelessDoVerificationFlow(withoutRevealing: boolean = false) {
  Logger.debug(TAG, '@feelessDoVerificationFlow', 'Starting feeless verification')
  let receiveMessageTask: Task | undefined
  let autoRetrievalTask: Task | undefined

  try {
    const [walletAddress, contractKit, e164Number]: [string, ContractKit, string] = yield all([
      call(getConnectedUnlockedAccount),
      call(getContractKit),
      select(e164NumberSelector),
      put(feelessSetVerificationStatus(VerificationStatus.Prepping)),
    ])

    let feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )

    const komenciKit = new KomenciKit(contractKit, walletAddress, {
      url: feelessVerificationState.komenci.callbackUrl || networkConfig.komenciUrl,
      token: feelessVerificationState.komenci.sessionToken,
    })

    // There should be no instances where the first param is truethy but the second isn't.
    // Mainly including the second param to satisfy typescript
    if (
      !feelessVerificationState.status.isVerified ||
      !feelessVerificationState.komenci.unverifiedMtwAddress
    ) {
      // Start a new Komenci session if one doesn't exist or we've run out of quota and update state.
      // Throws error if unable to do so
      yield call(startOrResumeKomenciSession, komenciKit, e164Number)

      // Adds phoneHash into verification state, will ping Komenci for it only if needed.
      // Throws an error if unable to get phoneHash
      yield call(fetchPhoneHashDetails, komenciKit, e164Number)

      // Now that we are guarnateed to have the phoneHash, check again to see if the
      // user already has a verified MTW
      yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)

      const mtwIsVerified = yield call(isMtwVerified)

      if (mtwIsVerified) {
        // TODO: Need some sort of success animation for this
        yield call(endFeelessVerification, komenciKit, walletAddress)
        return true
      }

      yield call(fetchOrDeployMtw, contractKit, komenciKit, walletAddress, e164Number)

      // Registering the DEK and wallet before beginning verification to guarantee that every
      // verified MTW address (i.e., accountAddress) has an EOA (i.e., walletAddress)
      // registered to it. If that's not guaranteed, users are at risk of sending to MTWs
      yield call(feelessDekAndWalletRegistration, komenciKit, walletAddress)

      // ====== Below this point feeless verification has the same structure as the original ====== //

      feelessVerificationState = yield select(feelessVerificationStateSelector)
      const { status, actionableAttestations, phoneHashDetails, komenci } = feelessVerificationState
      const { phoneHash } = phoneHashDetails
      const { unverifiedMtwAddress } = komenci

      if (!unverifiedMtwAddress) {
        throw Error('MTW not yet deployed. Should never happen')
      }

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
        attestationCodeReceiver(attestationsWrapper, phoneHash, unverifiedMtwAddress, issuers, true)
      )

      if (!withoutRevealing) {
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start, {
          feeless: true,
        })
        // Request codes for the already existing attestations if any.
        // We check after which ones were successful
        const reveals: boolean[] = yield call(
          revealAttestations,
          attestationsWrapper,
          unverifiedMtwAddress,
          phoneHashDetails,
          attestations,
          true
        )

        // Count how many more attestations we need to request
        const attestationsToRequest =
          status.numAttestationsRemaining - reveals.filter((r: boolean) => r).length

        if (attestationsToRequest) {
          yield put(feelessSetVerificationStatus(VerificationStatus.RequestingAttestations))
          // request more attestations
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_start, {
            attestationsToRequest,
            feeless: true,
          })
          attestations = yield call(
            requestAndRetrieveAttestations,
            attestationsWrapper,
            phoneHash,
            unverifiedMtwAddress,
            attestations,
            attestations.length + attestationsToRequest,
            true,
            komenciKit
          )
          ValoraAnalytics.track(VerificationEvents.verification_request_all_attestations_complete, {
            issuers,
            feeless: true,
          })

          // start listening for the new list of attestations
          receiveMessageTask?.cancel()
          issuers = attestations.map((a) => a.issuer)
          receiveMessageTask = yield takeEvery(
            Actions.RECEIVE_ATTESTATION_MESSAGE,
            attestationCodeReceiver(
              attestationsWrapper,
              phoneHash,
              unverifiedMtwAddress,
              issuers,
              true
            )
          )

          // Request codes for the new list of attestations. We ignore unsuccessfull reveals here,
          // cause we do not want to go into a loop of re-requesting more and more attestations
          yield call(
            revealAttestations,
            attestationsWrapper,
            unverifiedMtwAddress,
            phoneHashDetails,
            attestations,
            true
          )
        }
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete, {
          feeless: true,
        })
      }

      yield put(feelessSetVerificationStatus(VerificationStatus.CompletingAttestations))

      yield race([
        call(
          completeAttestations,
          attestationsWrapper,
          unverifiedMtwAddress,
          phoneHashDetails,
          attestations,
          true,
          komenciKit
        ),
        // This is needed, because we can have more actionableAttestations than NUM_ATTESTATIONS_REQUIRED
        call(feelessRequiredAttestationsCompleted),
      ])

      receiveMessageTask?.cancel()
      if (Platform.OS === 'android') {
        autoRetrievalTask?.cancel()
      }
    }

    yield call(endFeelessVerification, komenciKit, walletAddress)
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during feeless verification flow', error)
    yield all([
      call(storeTimestampIfKomenciError, error, true),
      put(feelessSetVerificationStatus(VerificationStatus.Failed)),
      put(showErrorOrFallback(error, ErrorMessages.VERIFICATION_FAILURE)),
    ])
    return error.message
  } finally {
    receiveMessageTask?.cancel()
    if (Platform.OS === 'android') {
      autoRetrievalTask?.cancel()
    }
  }
}

function* fetchKomenciReadiness(komenciKit: KomenciKit) {
  Logger.debug(TAG, '@fetchKomenciReadiness', 'Starting fetch')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  try {
    const { komenci } = feelessVerificationState

    if (!features.KOMENCI) {
      throw new KomenciDisabledError()
    }

    const serviceStatusResult: Result<true, KomenciDown> = yield call([
      komenciKit,
      komenciKit.checkService,
    ])
    if (!serviceStatusResult.ok) {
      Logger.debug(TAG, '@fetchKomenciReadiness', 'Service down')
      throw serviceStatusResult.error
    }

    if (hasExceededKomenciErrorQuota(komenci.errorTimestamps)) {
      Logger.debug(TAG, '@fetchKomenciReadiness', 'Too  many errors')
      throw new KomenciErrorQuotaExceeded()
    }

    yield put(
      feelessUpdateVerificationState({
        ...feelessVerificationState,
        komenci: {
          ...feelessVerificationState.komenci,
          serviceAvailable: true,
        },
      })
    )
  } catch (error) {
    yield put(
      feelessUpdateVerificationState({
        ...feelessVerificationState,
        komenci: {
          ...feelessVerificationState.komenci,
          serviceAvailable: false,
        },
      })
    )
    throw error
  }
}

function* fetchPhoneHashDetailsFromCache(e164Number: string) {
  Logger.debug(TAG, '@fetchPhoneHashDetailsFromCache', 'Starting fetch')
  const [feelessVerificationState, pepperCache]: [
    FeelessVerificationState,
    E164NumberToSaltType
  ] = yield all([select(feelessVerificationStateSelector), select(e164NumberToSaltSelector)])

  let { phoneHashDetails } = feelessVerificationState
  let { phoneHash } = feelessVerificationState.phoneHashDetails
  const ownPepper = pepperCache[e164Number]

  // If we already know the phoneHash, we can bail without updating state
  if (phoneHash.length) {
    return phoneHashDetails
  }

  // Pepper will be queried as part of feeless verification flow but cache
  // may be empty if the user hasn't initiated a Komenci session before
  if (!ownPepper) {
    Logger.debug(TAG, '@fetchPhoneHashDetailsFromCache', 'Pepper not cached')
    throw new PepperNotCachedError()
  }

  phoneHash = getPhoneHash(e164Number, ownPepper)
  phoneHashDetails = { e164Number, phoneHash, pepper: ownPepper }

  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      phoneHashDetails,
    })
  )
  return phoneHashDetails
}

function* fetchKomenciSessionState(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchKomenciSessionState', 'Starting fetch')
  const [feelessVerificationState, pepperCache, sessionStatusResult]: [
    FeelessVerificationState,
    E164NumberToSaltType,
    Result<CheckSessionResp, FetchError>
  ] = yield all([
    select(feelessVerificationStateSelector),
    select(e164NumberToSaltSelector),
    call([komenciKit, komenciKit.checkSession]),
  ])

  let sessionActive = true
  let { unverifiedMtwAddress } = feelessVerificationState.komenci

  // An inactive session is not fatal, it just means we will need to start one
  if (!sessionStatusResult.ok) {
    Logger.debug(TAG, '@fetchKomenciSessionState', 'No active sessions')
    sessionActive = false
  } else {
    Logger.debug(TAG, '@fetchKomenciSessionState', 'Active session found')
    const {
      quotaLeft: { distributedBlindedPepper, requestSubsidisedAttestation, submitMetaTransaction },
      metaTxWalletAddress,
    } = sessionStatusResult.result
    const ownPepper = pepperCache[e164Number]

    Logger.debug(
      TAG,
      '@fetchKomenciSessionState Session status:',
      JSON.stringify(sessionStatusResult.result)
    )

    // Sometimes `metaTxWalletAddress` is returned as undefined for an active session.
    // In that case, use the `unverifiedMtwAddress` we have stored locally
    unverifiedMtwAddress = metaTxWalletAddress ?? unverifiedMtwAddress

    // No pepper quota remaining is only bad if it's not already cached. Given Komenci will fetch
    // a pepper for you once, a session could be invalid due to the pepper condition if a user
    // fetched their pepper once this session then uninstalled without starting a new session
    if (
      (!ownPepper && !distributedBlindedPepper) ||
      !requestSubsidisedAttestation ||
      !submitMetaTransaction
    ) {
      Logger.debug(
        TAG,
        '@fetchKomenciSessionState',
        'Komenci session has run out of quota. Will attempt to start a new one'
      )
      sessionActive = false
    }
  }

  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      komenci: {
        ...feelessVerificationState.komenci,
        unverifiedMtwAddress,
        sessionActive,
      },
    })
  )
}

function* fetchVerifiedMtw(contractKit: ContractKit, walletAddress: string, e164Number: string) {
  Logger.debug(TAG, '@fetchVerifiedMtw', 'Starting fetch')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const phoneHashDetails: PhoneNumberHashDetails = yield call(
    fetchPhoneHashDetailsFromCache,
    e164Number
  )
  const { phoneHash } = phoneHashDetails

  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const associatedAccounts: string[] = yield call(
    [attestationsWrapper, attestationsWrapper.lookupAccountsForIdentifier],
    phoneHash
  )

  const accountAttestationStatuses: AttestationsStatus[] = yield all(
    associatedAccounts.map((account) =>
      call(getAttestationsStatus, attestationsWrapper, account, phoneHash)
    )
  )

  const possibleMtwAddresses: string[] = associatedAccounts.filter(
    (account, i) => accountAttestationStatuses[i].isVerified
  )

  if (!possibleMtwAddresses) {
    Logger.debug(TAG, '@fetchVerifiedMtw', 'No verified MTW found')
    return null
  }

  const verificationResults: Array<Result<true, WalletValidationError>> = yield all(
    possibleMtwAddresses.map((possibleMtwAddress) =>
      call(
        verifyWallet,
        contractKit,
        possibleMtwAddress,
        networkConfig.allowedMtwImplementations,
        walletAddress
      )
    )
  )

  const verifiedMtwAddresses = possibleMtwAddresses.filter(
    (address, i) => verificationResults[i].ok
  )

  if (verifiedMtwAddresses.length > 1) {
    throw Error(
      'More than one verified MTW with walletAddress as signer found. Should never happen'
    )
  }

  const verifiedMtwAddress = verifiedMtwAddresses[0]

  if (!verifiedMtwAddress) {
    Logger.debug(TAG, '@fetchVerifiedMtw', 'No verified MTW found')
    return null
  }

  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      status: VERIFIED_ATTESTATION_STATUS,
      komenci: {
        ...feelessVerificationState.komenci,
        unverifiedMtwAddress: verifiedMtwAddress,
      },
    })
  )

  return verifiedMtwAddress
}

function* isMtwVerified() {
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  return feelessVerificationState.status.isVerified
}

function* fetchAttestationStatus(contractKit: ContractKit) {
  Logger.debug(TAG, '@fetchAttestationStatus', 'Starting fetch')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const { phoneHashDetails, komenci } = feelessVerificationState
  const { phoneHash } = phoneHashDetails
  const { unverifiedMtwAddress } = komenci

  // If there isn't an address stored in state or we already know that the
  // MTW is verified, then there is nothing to check the progress of
  if (!unverifiedMtwAddress || feelessVerificationState.status.isVerified) {
    return
  }

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

  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      actionableAttestations,
      status,
    })
  )

  return status
}

function* startOrResumeKomenciSession(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@startOrResumeKomenciSession', 'Starting session')
  // Fetch session state to make sure we have the most up-to-date session info
  yield call(fetchKomenciSessionState, komenciKit, e164Number)
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const { sessionActive, captchaToken, sessionToken } = feelessVerificationState.komenci

  // If there isn't an active session, start one. Need to include `sessionActive`
  // because that's the only way we'll know if Komenci session is active but
  // quota is used
  if (!sessionActive || !sessionToken.length) {
    // Should never get here without a captcha token
    if (!captchaToken.length) {
      const error = new KomenciSessionInvalidError()
      Logger.error(TAG, '@startOrResumeKomenciSession', error)
      throw error
    }

    const komenciSessionResult: Result<
      StartSessionResp,
      FetchError | AuthenticationFailed | LoginSignatureError
    > = yield call([komenciKit, komenciKit.startSession], captchaToken)

    if (!komenciSessionResult.ok) {
      Logger.debug(TAG, '@startOrResumeKomenciSession', 'Unable to start session')
      throw komenciSessionResult.error
    }

    yield put(
      feelessUpdateVerificationState({
        ...feelessVerificationState,
        komenci: {
          ...feelessVerificationState.komenci,
          sessionToken: komenciSessionResult.result.token,
          callbackUrl: komenciSessionResult.result.callbackUrl || '',
        },
      })
    )

    // Fetch session state now that we are sure to have a token
    yield call(fetchKomenciSessionState, komenciKit, e164Number)
  }
}

// Checks if phoneHash is in cache, if it's not it asks Komenci to get it,
// puts it in the cache, then checks again
function* fetchPhoneHashDetails(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchPhoneHashDetails', 'Starting fetch')
  try {
    yield call(fetchPhoneHashDetailsFromCache, e164Number)
  } catch (error) {
    Logger.debug(TAG, '@fetchPhoneHashDetails', 'Pepper not in cache, fetching from Komenci')
    const feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )

    const blsBlindingClient = new ReactBlsBlindingClient(networkConfig.odisPubKey)
    const pepperQueryResult: Result<GetDistributedBlindedPepperResp, FetchError> = yield call(
      [komenciKit, komenciKit.getDistributedBlindedPepper],
      e164Number,
      DeviceInfo.getVersion(),
      blsBlindingClient
    )

    if (!pepperQueryResult.ok) {
      Logger.debug(TAG, '@fetchPhoneHashDetails', 'Unable to query for pepper')
      throw pepperQueryResult.error
    }

    yield put(
      feelessUpdateVerificationState({
        ...feelessVerificationState,
        komenci: {
          ...feelessVerificationState.komenci,
          pepperFetchedByKomenci: true,
        },
      })
    )

    yield put(updateE164PhoneNumberSalts({ [e164Number]: pepperQueryResult.result.pepper }))
    yield call(fetchPhoneHashDetailsFromCache, e164Number)
  }
}

function* fetchOrDeployMtw(
  contractKit: ContractKit,
  komenciKit: KomenciKit,
  walletAddress: string,
  e164Number: string
) {
  Logger.debug(TAG, '@fetchOrDeployMtw', 'Starting fetch')
  let feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )
  const storedUnverifiedMtwAddress = feelessVerificationState.komenci.unverifiedMtwAddress
  let deployedUnverifiedMtwAddress: string | null = null
  let komenciError: FetchError | TxError | InvalidWallet | undefined

  // If there isn't a MTW stored for this session, ask Komenci to deploy one
  if (!storedUnverifiedMtwAddress) {
    // This try/catch block is a workaround because Komenci will throw an error
    // if a wallet was already deployed in a session. This is only fatal if
    // we can't recover the MTW address or there is no quota left on the session
    try {
      const deployWalletResult: Result<string, FetchError | TxError | InvalidWallet> = yield call(
        [komenciKit, komenciKit.deployWallet],
        networkConfig.currentMtwImplementationAddress
      )

      if (!deployWalletResult.ok) {
        Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy MTW')
        throw deployWalletResult.error
      }

      deployedUnverifiedMtwAddress = deployWalletResult.result
    } catch (error) {
      // Fetch session state now that there should be no cases where we don't have a  MTW
      yield call(fetchKomenciSessionState, komenciKit, e164Number)
      feelessVerificationState = yield select(feelessVerificationStateSelector)
      deployedUnverifiedMtwAddress = feelessVerificationState.komenci.unverifiedMtwAddress
      komenciError = error
    }
  }

  const unverifiedMtwAddress = deployedUnverifiedMtwAddress ?? storedUnverifiedMtwAddress

  // If we couldn't recover or deploy a new the MTW address, then propogate the Komenci error
  // we recevied from the failed `deployWallet` call. We also need to check if the session
  // is still active because it's possible the current session ran out of quota
  if (!unverifiedMtwAddress || !feelessVerificationState.komenci.sessionActive) {
    Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy or recover a MTW')
    // The new error on the RHS is mostly to placate the linting rules.
    // There should be no instances where Komenci is unable to deploy
    // a MTW yet doesn't return an error
    throw komenciError ?? new Error('Unable to deploy or recover a MTW')
  }

  // Check if the MTW we have is a valid implementation
  const validityCheckResult: Result<true, WalletValidationError> = yield call(
    verifyWallet,
    contractKit,
    unverifiedMtwAddress,
    networkConfig.allowedMtwImplementations,
    walletAddress
  )

  if (!validityCheckResult.ok) {
    Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to validate MTW implementation')
    throw validityCheckResult.error
  }

  // If a new MTW was deployed, then make sure to reset all attestation
  // progress associated with the old MTW
  let { status } = feelessVerificationState
  if (deployedUnverifiedMtwAddress) {
    yield put(feelessResetVerification())
    status = {
      isVerified: false,
      numAttestationsRemaining: NUM_ATTESTATIONS_REQUIRED,
      total: 0,
      completed: 0,
    }
  }

  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      status,
      komenci: {
        ...feelessVerificationState.komenci,
        unverifiedMtwAddress,
      },
    })
  )
}

function* feelessDekAndWalletRegistration(komenciKit: KomenciKit, walletAddress: string) {
  Logger.debug(TAG, '@feelessDekAndWalletRegistration', 'Starting registration')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const { unverifiedMtwAddress } = feelessVerificationState.komenci

  // Should never happen
  if (!unverifiedMtwAddress) {
    throw Error('Tried registering DEK and walletAddress without a MTW')
  }

  yield call(registerWalletAndDekViaKomenci, komenciKit, unverifiedMtwAddress, walletAddress)
}

export function* feelessRequiredAttestationsCompleted() {
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

export function* feelessRequestAttestations(
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
      [komenciKit, komenciKit.approveAttestations],
      mtwAddress,
      numAttestationsRequestsNeeded
    )

    if (!approveTxResult.ok) {
      Logger.debug(TAG, '@feelessRequestAttestations', 'Failed approve tx')
      throw approveTxResult.error
    }

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent, {
      feeless: true,
    })

    Logger.debug(
      `${TAG}@feelessRequestAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )

    const requestTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
      [komenciKit, komenciKit.requestAttestations],
      mtwAddress,
      phoneHash,
      numAttestationsRequestsNeeded
    )
    if (!requestTxResult.ok) {
      Logger.debug(TAG, '@feelessRequestAttestations', 'Failed request tx')
      throw requestTxResult.error
    }

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_request_tx_sent, {
      feeless: true,
    })
  }

  Logger.debug(`${TAG}@feelessRequestAttestations`, 'Waiting for block to select issuers')
  ValoraAnalytics.track(
    VerificationEvents.verification_request_attestation_await_issuer_selection,
    { feeless: true }
  )

  yield call(
    [attestationsWrapper, attestationsWrapper.waitForSelectingIssuers],
    phoneHash,
    mtwAddress
  )

  Logger.debug(`${TAG}@feelessRequestAttestations`, 'Selecting issuers')
  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_select_issuer, {
    feeless: true,
  })

  const selectIssuersTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
    [komenciKit, komenciKit.selectIssuers],
    mtwAddress,
    phoneHash
  )

  if (!selectIssuersTxResult.ok) {
    Logger.debug(TAG, '@feelessRequestAttestations', 'Failed selectIssuers tx')
    throw selectIssuersTxResult.error
  }

  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_issuer_tx_sent, {
    feeless: true,
  })
}

export function* feelessGetCodeForIssuer(issuer: string) {
  const existingCodes: AttestationCode[] = yield select(feelessAttestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
}
// Codes that are auto-imported or pasted in quick sucsession may revert due to being submitted by Komenci
// with the same nonce as the previous code. Adding retry logic to attempt the tx again in that case
// TODO: Batch all available `complete` tranactions once Komenci supports it
function* submitCompleteTxAndRetryOnRevert(
  komenciKit: KomenciKit,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  code: AttestationCode
) {
  const numOfRetries = 3
  let completeTxResult: Result<TransactionReceipt, FetchError | TxError>
  for (let i = 0; i < numOfRetries; i += 1) {
    completeTxResult = yield call(
      [komenciKit, komenciKit.completeAttestation],
      mtwAddress,
      phoneHashDetails.phoneHash,
      code.issuer,
      code.code
    )

    if (completeTxResult.ok) {
      return completeTxResult
    }

    // If it's not a revert error, or this is the last retry, then return result
    const errorString = completeTxResult.error.toString().toLowerCase()
    if (!errorString.includes('revert') || i + 1 === numOfRetries) {
      return completeTxResult
    }

    Logger.debug(TAG, '@feelessCompleteAttestation', `Failed complete tx on retry #${i + 1}`)
    yield call(waitForNextBlock)
  }
}

export function* feelessCompleteAttestation(
  komenciKit: KomenciKit,
  mtwAddress: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation
) {
  const issuer = attestation.issuer
  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_start, {
    issuer,
    feeless: true,
  })
  const code: AttestationCode = yield call(feelessWaitForAttestationCode, issuer)
  const existingCodes: AttestationCode[] = yield select(feelessAttestationCodesSelector)
  const codePosition = existingCodes.indexOf(code)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
    feeless: true,
  })

  Logger.debug(TAG + '@feelessCompleteAttestation', `Completing code for issuer: ${code.issuer}`)

  // Make each concurrent completion attempt wait a sec for where they are relative to other codes
  // to ensure `processingInputCode` has enough time to properly gate the tx. 0-index code
  // will have 0 delay, 1-index code will have 1 sec delay, etc.
  yield delay(codePosition * 1000)
  while (yield select(feelessProcessingInputCodeSelector)) {
    yield delay(Math.random() * 1000)
  }

  yield put(feelessProcessingInputCode(true))
  const completeTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
    submitCompleteTxAndRetryOnRevert,
    komenciKit,
    mtwAddress,
    phoneHashDetails,
    code
  )
  yield put(feelessProcessingInputCode(false))

  if (!completeTxResult.ok) {
    Logger.debug(TAG, '@feelessCompleteAttestation', 'Failed complete tx')
    throw completeTxResult.error
  }

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_complete, {
    issuer,
    feeless: true,
  })

  Logger.debug(TAG + '@feelessCompleteAttestation', `Attestation for issuer ${issuer} completed`)
  yield put(feelessCompleteAttestationCode(code))
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

function* endFeelessVerification(komenciKit: KomenciKit, walletAddress: string) {
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )
  const mtwAddress = feelessVerificationState.komenci.unverifiedMtwAddress

  if (!mtwAddress) {
    throw Error('Dev error: Tried ending feeless verification too early')
  }
  // Intentionally calling this a second time. No-op if they already registered so no harm done
  yield call(feelessDekAndWalletRegistration, komenciKit, walletAddress)
  yield put(setNumberVerified(true))
  yield put(setMtwAddress(mtwAddress))
  yield put(feelessSetVerificationStatus(VerificationStatus.Done))
}

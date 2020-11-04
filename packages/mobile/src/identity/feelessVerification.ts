import { Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  ActionableAttestation,
  AttestationsWrapper,
  IdentifierLookupResult,
  UnselectedRequest,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { CheckSessionResp, GetDistributedBlindedPepperResp } from '@celo/komencikit/src/actions'
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
import { Address } from '@celo/utils/src/address'
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
import { refreshAllBalances } from 'src/home/actions'
import {
  Actions,
  feelessCompleteAttestationCode,
  FeelessInputAttestationCodeAction,
  feelessResetVerification,
  feelessSetCompletedCodes,
  feelessSetVerificationStatus,
  feelessUpdateVerificationState,
  StartVerificationAction,
  updateE164PhoneNumberSalts,
} from 'src/identity/actions'
import {
  getAddressesFromLookupResult,
  lookupAttestationIdentifiers,
} from 'src/identity/contactMapping'
import {
  hasExceededKomenciErrorQuota,
  KomenciDisabledError,
  KomenciQuotaExceededError,
  KomenciSessionInvalidError,
  PepperNotCachedError,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
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

const KOMENCI_URL = 'https://a334b526560c.ngrok.io'
// const KOMENCI_URL = 'http://192.168.86.33:3000'
// TODO: Populate this with expected implementation address
const ALLOWED_MTW_IMPLEMENTATIONS: Address[] = ['0x88a2b9B8387A1823D821E406b4e951337fa1D46D']
const CURRENT_MTW_IMPLEMENTATION_ADDRESS: Address = '0x88a2b9B8387A1823D821E406b4e951337fa1D46D'

export function* feelessFetchVerificationState() {
  Logger.debug(TAG, '@feelessFetchVerificationState', 'Starting fetch')
  try {
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_start)
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
      url: KOMENCI_URL,
      token: feelessVerificationState.komenci.sessionToken,
    })

    try {
      // Checks if a MTW was verified in a previous attempt and updates state.
      // This check will likely fail because the pepper hasn't been cached yet
      // but needs to happen for the edge case that a user has a cached pepper
      // and Komenci is down
      yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)
    } catch (error) {
      Logger.debug(TAG, 'Unable to check it MTW is verified on first attempt')
    }
    // Throws error if Komenci is not ready for user, otherwise it updates state
    yield call(fetchKomenciReadiness, komenciKit)

    // Throws error if unable to retreive phone hash, otherwise it updates state
    yield call(fetchPhoneHashDetailsFromCache, e164Number)

    // Updates state with sessionStatus and the mtwAddress associated with the session
    yield call(fetchSessionState, komenciKit, e164Number)

    // Checks if a MTW was verified in a previous attempt and updates state
    yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)

    // Updates state with any attestation progress that's been made
    const status: AttestationsStatus = yield call(fetchAttestationStatus, contractKit)
    ValoraAnalytics.track(VerificationEvents.verification_fetch_status_complete, {
      ...status,
    })
    yield put(feelessSetVerificationStatus(VerificationStatus.Stopped))
  } catch (error) {
    Logger.error(TAG, 'Error occured while fetching verification state', error)
    yield call(storeTimestampIfKomenciError, error)
    yield put(feelessSetVerificationStatus(VerificationStatus.Stopped))
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
      restart: take(Actions.FEELESS_RESEND_ATTESTATIONS),
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
      url: KOMENCI_URL,
      token: feelessVerificationState.komenci.sessionToken,
    })

    // Start by checking again to make sure Komenci is ready. Throws error if not
    yield call(fetchKomenciReadiness, komenciKit)

    // There should be no instances where the first param is truethy but the second isn't.
    // Mainly including the second param to satisfy typescript
    if (
      !feelessVerificationState.status.isVerified ||
      !feelessVerificationState.komenci.unverifiedMtwAddress
    ) {
      // Start or resume a Komenci session and update state. Throws error if unable to do so
      yield call(startOrResumeKomenciSession, komenciKit, e164Number)

      // Adds phoneHash into verification state, will ping Komenci for it only if needed.
      // Throws an error if unable to get phoneHash
      yield call(fetchPhoneHashDetails, komenciKit, e164Number)

      const startingPepperQuota = feelessVerificationState.komenci.pepperQuotaRemaining
      // Now that we are guarnateed to have the phoneHash, check again to see if the
      // user already has a verified MTW
      yield call(reFetchVerifiedMtw, contractKit, walletAddress, e164Number, startingPepperQuota)

      const mtwIsVerified = yield call(isMtwVerified)

      if (mtwIsVerified) {
        yield call(endFeelessVerification)
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
        throw Error('MTW not yet deploy. Should never happen')
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
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_start)
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
        ValoraAnalytics.track(VerificationEvents.verification_reveal_all_attestations_complete)
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

    // Intentionally calling this a second time. No-op if they already registered so no harm done
    yield call(feelessDekAndWalletRegistration, komenciKit, walletAddress)
    yield call(endFeelessVerification)
    return true
  } catch (error) {
    Logger.error(TAG, 'Error occured during feeless verification flow', error)
    yield all([
      call(storeTimestampIfKomenciError, error),
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
    throw new KomenciQuotaExceededError()
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

function* fetchSessionState(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchSessionState', 'Starting fetch')
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
  let {
    requestQuotaRemaining,
    pepperQuotaRemaining,
    unverifiedMtwAddress,
  } = feelessVerificationState.komenci

  // An inactive session is not fatal, it just means we will need to start one
  if (!sessionStatusResult.ok) {
    Logger.debug(TAG, '@fetchSessionState', 'No active sessions')
    sessionActive = false
  } else {
    Logger.debug(TAG, '@fetchSessionState', 'Active session found')
    const {
      quotaLeft: { distributedBlindedPepper, requestSubsidisedAttestation, submitMetaTransaction },
      metaTxWalletAddress,
    } = sessionStatusResult.result
    const ownPepper = pepperCache[e164Number]

    Logger.debug(
      TAG,
      '@fetchSessionState Session status:',
      JSON.stringify(sessionStatusResult.result)
    )

    sessionActive = true
    // Somtimes `metaTxWalletAddress` is returned as undefined for an active session.
    // In that case, use the `unverifiedMtwAddress` we have stored locally
    unverifiedMtwAddress = metaTxWalletAddress ?? unverifiedMtwAddress
    pepperQuotaRemaining = distributedBlindedPepper
    requestQuotaRemaining = requestSubsidisedAttestation

    // No pepper quota remaining is only bad if it's not already cached. Given Komenci will fetch
    // a pepper for you once, a session could be invalid due to the pepper condition if a user
    // fetched their pepper once this session then uninstalled without starting a new session
    if (
      (!ownPepper && !distributedBlindedPepper) ||
      !requestSubsidisedAttestation ||
      !submitMetaTransaction
    ) {
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
        requestQuotaRemaining,
        pepperQuotaRemaining,
      },
    })
  )
}

function* fetchVerifiedMtw(contractKit: ContractKit, walletAddress: string, e164Number: string) {
  Logger.debug(TAG, '@fetchVerifiedMtw', 'Starting fetch')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const phonHashDetails: PhoneNumberHashDetails = yield call(
    fetchPhoneHashDetailsFromCache,
    e164Number
  )
  const { phoneHash } = phonHashDetails

  const lookupResult: IdentifierLookupResult = yield call(lookupAttestationIdentifiers, [phoneHash])
  const possibleMtwAddresses = getAddressesFromLookupResult(lookupResult, phoneHash)
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
        ALLOWED_MTW_IMPLEMENTATIONS,
        walletAddress
      )
    )
  )

  const verifiedMtwAddresses = possibleMtwAddresses.filter(
    (address, i) => verificationResults[i].ok
  )

  if (verifiedMtwAddresses.length > 2) {
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
      status: {
        isVerified: true,
        numAttestationsRemaining: 0,
        total: NUM_ATTESTATIONS_REQUIRED,
        completed: NUM_ATTESTATIONS_REQUIRED,
      },
      komenci: {
        ...feelessVerificationState.komenci,
        unverifiedMtwAddress: verifiedMtwAddress,
      },
    })
  )

  return verifiedMtwAddress
}

function* reFetchVerifiedMtw(
  contractKit: ContractKit,
  walletAddress: string,
  e164Number: string,
  startingPepperQuota: number
) {
  Logger.debug(TAG, '@reFetchVerifiedMtw', 'Starting fetch')
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  const { pepperQuotaRemaining } = feelessVerificationState.komenci
  // If Komenci was used to fetch their pepper, check if the they have a verified
  // account. If user already had their pepper, then check would have happened
  // in `feelessFetchVerificationState`
  if (startingPepperQuota > pepperQuotaRemaining) {
    yield call(fetchVerifiedMtw, contractKit, walletAddress, e164Number)
  }
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
  yield call(fetchSessionState, komenciKit, e164Number)
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
      Logger.debug(TAG, '@startOrResumeKomenciSession', 'No captcha found')
      throw new KomenciSessionInvalidError()
    }

    const komenciSessionResult: Result<
      string,
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
          sessionToken: komenciSessionResult.result,
        },
      })
    )

    // Fetch session state now that we are sure to have a token
    yield call(fetchSessionState, komenciKit, e164Number)
  }
}

// Checks if phoneHash is in cache, if it's not it asks Komenci to get it,
// puts it in the cache, then checks again
function* fetchPhoneHashDetails(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchPhoneHashDetails', 'Starting fetch')
  try {
    yield call(fetchPhoneHashDetailsFromCache, e164Number)
  } catch (error) {
    const feelessVerificationState: FeelessVerificationState = yield select(
      feelessVerificationStateSelector
    )

    const pepperQueryResult: Result<GetDistributedBlindedPepperResp, FetchError> = yield call(
      [
        komenciKit,
        async (phoneNumber, version) =>
          komenciKit.getDistributedBlindedPepper(phoneNumber, version),
      ],
      e164Number,
      DeviceInfo.getVersion()
    )

    if (!pepperQueryResult.ok) {
      Logger.debug(TAG, '@fetchPhoneHashDetails', 'Unable to query for pepper')
      throw pepperQueryResult.error
    }

    const pepperQuotaRemaining = feelessVerificationState.komenci.pepperQuotaRemaining - 1
    yield put(
      feelessUpdateVerificationState({
        ...feelessVerificationState,
        komenci: {
          ...feelessVerificationState.komenci,
          pepperQuotaRemaining,
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
  let { unverifiedMtwAddress } = feelessVerificationState.komenci

  // If there isn't a MTW for this session, ask Komenci to deploy one
  if (!unverifiedMtwAddress) {
    // This try/catch block is a workaround because Komenci will throw and error
    // if a wallet was already deployed in a session. This is only fatal if
    // we can't recover the MTW address or there is no quota left on the session
    try {
      const deployWalletResult: Result<string, FetchError | TxError | InvalidWallet> = yield call(
        [komenciKit, async (address) => komenciKit.deployWallet(address)],
        CURRENT_MTW_IMPLEMENTATION_ADDRESS
      )

      if (!deployWalletResult.ok) {
        Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy MTW')
        throw deployWalletResult.error
      }

      unverifiedMtwAddress = deployWalletResult.result
    } catch (error) {
      // Fetch session state now that we are sure to have a MTW
      yield call(fetchSessionState, komenciKit, e164Number)
      feelessVerificationState = yield select(feelessVerificationStateSelector)
      // If we can't recover the MTW address or already used up all our quota,
      // then propogate the Komenci error
      unverifiedMtwAddress = feelessVerificationState.komenci.unverifiedMtwAddress
      if (!unverifiedMtwAddress || !feelessVerificationState.komenci.sessionActive) {
        Logger.debug(
          TAG,
          '@fetchOrDeployMtw',
          'Checked status again and but still no MTW address found'
        )
        throw error
      }
    }
  }

  // Check if MTW we have is a valid implementation
  const validityCheckResult: Result<true, WalletValidationError> = yield call(
    verifyWallet,
    contractKit,
    unverifiedMtwAddress,
    ALLOWED_MTW_IMPLEMENTATIONS,
    walletAddress
  )

  if (!validityCheckResult.ok) {
    Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to valiad MTW')
    throw validityCheckResult.error
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
      [komenciKit, async (address, num) => komenciKit.approveAttestations(address, num)],
      mtwAddress,
      numAttestationsRequestsNeeded
    )

    if (!approveTxResult.ok) {
      Logger.debug(TAG, '@feelessRequestAttestations', 'Failed approve tx')
      throw approveTxResult.error
    }

    ValoraAnalytics.track(VerificationEvents.verification_request_attestation_approve_tx_sent)

    Logger.debug(
      `${TAG}@feelessRequestAttestations`,
      `Requesting ${numAttestationsRequestsNeeded} new attestations`
    )

    const requestTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
      [
        komenciKit,
        async (address, hash, num) => komenciKit.requestAttestations(address, hash, num),
      ],
      mtwAddress,
      phoneHash,
      numAttestationsRequestsNeeded
    )
    if (!requestTxResult.ok) {
      Logger.debug(TAG, '@feelessRequestAttestations', 'Failed request tx')
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
    [komenciKit, async (address, hash) => komenciKit.selectIssuers(address, hash)],
    mtwAddress,
    phoneHash
  )

  if (!selectIssuersTxResult.ok) {
    Logger.debug(TAG, '@feelessRequestAttestations', 'Failed selectIssuers tx')
    throw selectIssuersTxResult.error
  }

  ValoraAnalytics.track(VerificationEvents.verification_request_attestation_issuer_tx_sent)
}

function* feelessGetCodeForIssuer(issuer: string) {
  const existingCodes: AttestationCode[] = yield select(feelessAttestationCodesSelector)
  return existingCodes.find((c) => c.issuer === issuer)
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
  })
  const code: AttestationCode = yield call(feelessWaitForAttestationCode, issuer)

  ValoraAnalytics.track(VerificationEvents.verification_reveal_attestation_await_code_complete, {
    issuer,
  })

  Logger.debug(TAG + '@feelessCompleteAttestation', `Completing code for issuer: ${code.issuer}`)

  const completeTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
    [
      komenciKit,
      async (address, hash, iss, cod) => komenciKit.completeAttestation(address, hash, iss, cod),
    ],
    mtwAddress,
    phoneHashDetails.phoneHash,
    code.issuer,
    code.code
  )

  if (!completeTxResult.ok) {
    Logger.debug(TAG, '@feelessCompleteAttestation', 'Failed complete tx')
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

function* endFeelessVerification() {
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )
  const mtwAddress = feelessVerificationState.komenci.unverifiedMtwAddress

  if (!mtwAddress) {
    throw Error('Dev error: Tried ending feeless verification too early')
  }

  yield put(setNumberVerified(true))
  yield put(setMtwAddress(mtwAddress))
  yield put(feelessSetVerificationStatus(VerificationStatus.Done))
}

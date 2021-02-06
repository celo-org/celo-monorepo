import { Result } from '@celo/base/lib/result'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/src/wrappers/Attestations'
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
  NetworkError,
  NotFoundError,
  RequestError,
  ResponseDecodeError,
  ServiceUnavailable,
  TxError,
  TxEventNotFound,
  TxRevertError,
  TxTimeoutError,
  WalletValidationError,
} from '@celo/komencikit/src/errors'
import { KomenciKit } from '@celo/komencikit/src/kit'
import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import { sleep } from '@celo/utils/src/async'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import DeviceInfo from 'react-native-device-info'
import { all, call, delay, put, race, select, takeEvery } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import {
  hasExceededKomenciErrorQuota,
  KomenciErrorQuotaExceeded,
  KomenciSessionInvalidError,
  storeTimestampIfKomenciError,
} from 'src/identity/feelessVerificationErrors'
import {
  e164NumberToSaltSelector,
  E164NumberToSaltType,
  isBalanceSufficientForSigRetrievalSelector,
} from 'src/identity/reducer'
import {
  doVerificationFlowSaga,
  getActionableAttestations,
  getAttestationsStatus,
} from 'src/identity/verification'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { clearPasswordCaches } from 'src/pincode/PasswordCache'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import Logger from 'src/utils/Logger'
import {
  disableKomenci,
  doVerificationFlow,
  e164NumberSelector,
  ensureRealHumanUser,
  eoaAccountSelector,
  fetchMtw,
  fetchOnChainData,
  fetchPhoneNumberDetails,
  KomenciContext,
  komenciContextSelector,
  phoneHashSelector,
  setActionableAttestation,
  setKomenciContext,
  setPhoneHash,
  setVerificationStatus,
  start,
  startKomenciSession,
  useKomenciSelector,
} from 'src/verify/reducer'
import { getContractKit } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'

const TAG = 'verify/saga'
const BALANCE_CHECK_TIMEOUT = 5 * 1000 // 5 seconds
const KOMENCI_READINESS_RETRIES = 3
const KOMENCI_DEPLOY_MTW_RETRIES = 3

function* checkTooManyErrors() {
  const komenci = yield select(komenciContextSelector)
  if (hasExceededKomenciErrorQuota(komenci.errorTimestamps)) {
    Logger.debug(TAG, '@fetchKomenciReadiness', 'Too  many errors')
    throw new KomenciErrorQuotaExceeded()
  }
}

function* fetchKomenciReadiness(komenciKit: KomenciKit) {
  for (let i = 0; i < KOMENCI_READINESS_RETRIES; i += 1) {
    const serviceStatusResult: Result<true, KomenciDown> = yield call([
      komenciKit,
      komenciKit.checkService,
    ])

    if (!serviceStatusResult.ok) {
      Logger.debug(TAG, '@fetchKomenciReadiness', 'Komenci service is down')
      yield checkTooManyErrors()
      if (serviceStatusResult.error instanceof KomenciDown) {
        yield sleep(2 ** i * 5000)
      } else {
        throw serviceStatusResult.error
      }
    }
  }

  return true
}

function* fetchKomenciSession(komenciKit: KomenciKit, e164Number: string) {
  Logger.debug(TAG, '@fetchKomenciSession', 'Starting fetch')
  const [komenciContext, pepperCache, sessionStatusResult]: [
    KomenciContext,
    E164NumberToSaltType,
    Result<CheckSessionResp, FetchError>
  ] = yield all([
    select(komenciContextSelector),
    select(e164NumberToSaltSelector),
    call([komenciKit, komenciKit.checkSession]),
  ])

  let sessionActive = true
  let { unverifiedMtwAddress } = komenciContext

  // An inactive session is not fatal, it just means we will need to start one
  if (!sessionStatusResult.ok) {
    Logger.debug(TAG, '@fetchKomenciSession', 'No active sessions')
    sessionActive = false
  } else {
    Logger.debug(TAG, '@fetchKomenciSession', 'Active session found')
    const {
      quotaLeft: { distributedBlindedPepper, requestSubsidisedAttestation, submitMetaTransaction },
      metaTxWalletAddress,
    } = sessionStatusResult.result
    const ownPepper = pepperCache[e164Number]

    Logger.debug(
      TAG,
      '@fetchKomenciSession Session status:',
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
        '@fetchKomenciSession',
        'Komenci session has run out of quota. Will attempt to start a new one'
      )
      sessionActive = false
    }
  }

  yield put(setKomenciContext({ unverifiedMtwAddress, sessionActive }))
}

function* startOrResumeKomenciSessionSaga(action: ReturnType<typeof startKomenciSession>) {
  Logger.debug(TAG, '@startOrResumeKomenciSession', 'Starting session')
  // Fetch session state to make sure we have the most up-to-date session info
  // yield call(fetchKomenciSessionState, komenciKit, e164Number)
  // const feelessVerificationState: FeelessVerificationState = yield select(
  // feelessVerificationStateSelector
  // )

  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
  })

  const { sessionActive, captchaToken } = komenci
  let { sessionToken } = komenci

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

    sessionToken = komenciSessionResult.result.token

    yield put(
      setKomenciContext({
        sessionToken: komenciSessionResult.result.token,
        callbackUrl: komenciSessionResult.result.callbackUrl || '',
        sessionActive: true,
      })
    )
  }

  Logger.debug(TAG, 'Session active. sessionToken: ', sessionToken)
  yield put(fetchPhoneNumberDetails())
}

function* startSaga(action: ReturnType<typeof start>) {
  // TODO: Move this out of saga
  yield call(navigate, Screens.VerificationLoadingScreen, {
    withoutRevealing: action.payload.withoutRevealing,
  })

  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)

  Logger.debug(TAG, '@startSaga', walletAddress)
  // we want to reset password before force unlock account
  clearPasswordCaches()
  const result: UnlockResult = yield call(unlockAccount, walletAddress, true)
  if (result !== UnlockResult.SUCCESS) {
    // This navigateBack has no effect if part of onboarding and returns to home or
    // settings page if the user pressed on the back button when prompted for the PIN.
    navigateBack()
    return
  }

  const e164Number = yield select(e164NumberSelector)
  const useKomenci = yield select(useKomenciSelector)

  if (useKomenci) {
    try {
      const komenci = yield select(komenciContextSelector)
      const komenciKit = new KomenciKit(contractKit, walletAddress, {
        url: komenci.callbackUrl || networkConfig.komenciUrl,
        token: komenci.sessionToken,
      })
      const isKomenciReady = yield call(fetchKomenciReadiness, komenciKit)
      if (!isKomenciReady) {
        yield put(disableKomenci())
        yield put(start(e164Number))
        return
      }

      yield call(fetchKomenciSession, komenciKit, e164Number)
      if (!komenci.sessionActive) {
        yield put(ensureRealHumanUser())
      }
    } catch (e) {
      Logger.error(TAG, '@startSaga', e)
      storeTimestampIfKomenciError(e)
      if (e instanceof KomenciErrorQuotaExceeded) {
        yield put(disableKomenci())
        yield put(start(e164Number))
      }
    }
  } else {
    const { timeout } = yield race({
      balances: all([
        call(waitFor, stableTokenBalanceSelector),
        call(waitFor, celoTokenBalanceSelector),
      ]),
      timeout: delay(BALANCE_CHECK_TIMEOUT),
    })
    if (timeout) {
      Logger.debug(TAG, '@fetchVerificationState', 'Token balances is null or undefined')
      // TODO: Error Screen
      return
    }
    const isBalanceSufficientForSigRetrieval = yield select(
      isBalanceSufficientForSigRetrievalSelector
    )
    if (!isBalanceSufficientForSigRetrieval) {
      Logger.debug(TAG, '@fetchVerificationState', 'Insufficient balance for sig retrieval')

      yield put(fail(ErrorMessages.INSUFFICIENT_BALANCE))
      // TODO: direct to buy more quota screen
      return
    }
  }
}

function* fetchPhoneNumberDetailsSaga(action: ReturnType<typeof fetchPhoneNumberDetails>) {
  Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Starting fetch')
  const e164Number = yield select(e164NumberSelector)
  let phoneHash = yield select(phoneHashSelector)
  const pepperCache = yield select(e164NumberToSaltSelector)
  const useKomenci = yield select(useKomenciSelector)
  let ownPepper = pepperCache[e164Number]

  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', walletAddress)

  if (phoneHash && phoneHash.length) {
    Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper is cached')
    return
  }

  if (!ownPepper) {
    Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper not cached')
    if (useKomenci) {
      Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Fetching from Komenci')

      const komenci = yield select(komenciContextSelector)
      const komenciKit = new KomenciKit(contractKit, walletAddress, {
        url: komenci.callbackUrl || networkConfig.komenciUrl,
        token: komenci.sessionToken,
      })

      const blsBlindingClient = new ReactBlsBlindingClient(networkConfig.odisPubKey)
      const pepperQueryResult: Result<GetDistributedBlindedPepperResp, FetchError> = yield call(
        [komenciKit, komenciKit.getDistributedBlindedPepper],
        e164Number,
        DeviceInfo.getVersion(),
        blsBlindingClient
      )

      if (!pepperQueryResult.ok) {
        Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Unable to query for pepper')
        throw pepperQueryResult.error
      }
      ownPepper = pepperQueryResult.result.pepper
    } else {
      // TODO: classical fetch
    }
    Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Pepper is fetched')
    yield put(updateE164PhoneNumberSalts({ [e164Number]: ownPepper }))
  }
  phoneHash = getPhoneHash(e164Number, ownPepper)
  yield put(setPhoneHash(phoneHash))
  Logger.debug(TAG, '@fetchPhoneNumberDetailsSaga', 'Phone Hash is set')
  if (useKomenci) {
    yield put(fetchMtw())
  } else {
    yield put(fetchOnChainData())
  }
}

function* fetchOrDeployMtwSaga() {
  const e164Number = yield select(e164NumberSelector)
  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  const komenci = yield select(komenciContextSelector)
  const komenciKit = new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
  })

  Logger.debug(TAG, '@fetchOrDeployMtwSaga', 'Starting fetch')
  const storedUnverifiedMtwAddress = komenci.unverifiedMtwAddress
  let deployedUnverifiedMtwAddress: string | null = null
  try {
    // If there isn't a MTW stored for this session, ask Komenci to deploy one
    if (!storedUnverifiedMtwAddress) {
      // This try/catch block is a workaround because Komenci will throw an error
      // if a wallet was already deployed in a session. This is only fatal if
      // we can't recover the MTW address or there is no quota left on the session
      for (let i = 0; i < KOMENCI_DEPLOY_MTW_RETRIES; i += 1) {
        try {
          const deployWalletResult: Result<
            string,
            FetchError | TxError | InvalidWallet
          > = yield call(
            [komenciKit, komenciKit.deployWallet],
            networkConfig.currentMtwImplementationAddress
          )

          if (!deployWalletResult.ok) {
            Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy MTW')
            throw deployWalletResult.error
          }
          deployedUnverifiedMtwAddress = deployWalletResult.result
        } catch (e) {
          storeTimestampIfKomenciError(e)

          switch (true) {
            case e instanceof ServiceUnavailable:
            case e instanceof NetworkError:
            case e instanceof RequestError:
            case e instanceof NotFoundError:
            case e instanceof ResponseDecodeError:
            case e instanceof TxTimeoutError:
            case e instanceof TxRevertError:
            case e instanceof TxEventNotFound:
              continue

            case e instanceof InvalidWallet:
            default:
              put(disableKomenci())
              put(start(e164Number))
              return
          }
        }
      }
    }

    const unverifiedMtwAddress = deployedUnverifiedMtwAddress ?? storedUnverifiedMtwAddress

    // If we couldn't recover or deploy a new the MTW address, then propogate the Komenci error
    // we recevied from the failed `deployWallet` call. We also need to check if the session
    // is still active because it's possible the current session ran out of quota
    if (!unverifiedMtwAddress || !komenci.sessionActive) {
      Logger.debug(TAG, '@fetchOrDeployMtw', 'Unable to deploy or recover a MTW')
      // The new error on the RHS is mostly to placate the linting rules.
      // There should be no instances where Komenci is unable to deploy
      // a MTW yet doesn't return an error
      throw new Error('Unable to deploy or recover a MTW')
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

    yield put(setKomenciContext({ unverifiedMtwAddress }))
    yield call(feelessDekAndWalletRegistration, komenciKit, walletAddress)
    yield put(fetchOnChainData())
  } catch (e) {
    storeTimestampIfKomenciError(e)
    put(disableKomenci())
    put(start(e164Number))
  }
}

function* feelessDekAndWalletRegistration(komenciKit: KomenciKit, walletAddress: string) {
  Logger.debug(TAG, '@feelessDekAndWalletRegistration', 'Starting registration')
  const komenci = yield select(komenciContextSelector)
  const { unverifiedMtwAddress } = komenci

  // Should never happen
  if (!unverifiedMtwAddress) {
    throw Error('Tried registering DEK and walletAddress without a MTW')
  }

  yield call(registerWalletAndDekViaKomenci, komenciKit, unverifiedMtwAddress, walletAddress)
}

function* fetchOnChainDataSaga() {
  Logger.debug(TAG, '@fetchOnChainDataSaga', 'Starting fetch')
  const contractKit = yield call(getContractKit)
  const useKomenci = yield select(useKomenciSelector)
  const phoneHash = yield select(phoneHashSelector)
  let account
  if (useKomenci) {
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Using Komenci')
    const komenci = yield select(komenciContextSelector)

    const { unverifiedMtwAddress } = komenci

    // If there isn't an address stored in state or we already know that the
    // MTW is verified, then there is nothing to check the progress of
    if (!unverifiedMtwAddress) {
      throw Error('unverifiedMtwAddress is not set')
    }
    account = unverifiedMtwAddress
  } else {
    Logger.debug(TAG, '@fetchOnChainDataSaga', 'Using Classic')
    account = yield select(eoaAccountSelector)
  }
  Logger.debug(TAG, '@fetchOnChainDataSaga', 'Account to fetch: ' + account)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const status: AttestationsStatus = yield call(
    getAttestationsStatus,
    attestationsWrapper,
    account,
    phoneHash
  )

  Logger.debug(TAG, '@fetchOnChainDataSaga', 'Fetched status')
  yield put(setVerificationStatus(status))

  const actionableAttestations: ActionableAttestation[] = yield call(
    getActionableAttestations,
    attestationsWrapper,
    phoneHash,
    account
  )
  Logger.debug(TAG, '@fetchOnChainDataSaga', 'Fetched actionable attestations')
  yield put(setActionableAttestation(actionableAttestations))
  const withoutRevealing = actionableAttestations.length === status.numAttestationsRemaining
  yield put(doVerificationFlow(withoutRevealing))
}

export function* verifySaga() {
  Logger.debug(TAG, 'Initializing verify sagas')
  yield takeEvery(start.type, startSaga)
  yield takeEvery(startKomenciSession.type, startOrResumeKomenciSessionSaga)
  yield takeEvery(fetchPhoneNumberDetails.type, fetchPhoneNumberDetailsSaga)
  yield takeEvery(fetchMtw.type, fetchOrDeployMtwSaga)
  yield takeEvery(fetchOnChainData.type, fetchOnChainDataSaga)
  yield takeEvery(doVerificationFlow.type, doVerificationFlowSaga)
}

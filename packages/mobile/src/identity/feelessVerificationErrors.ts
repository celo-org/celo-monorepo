// tslint:disable: max-classes-per-file
import { RootError } from '@celo/base'
import { FetchErrorTypes, KomenciKitErrorTypes, TxErrorTypes } from '@celo/komencikit/src/errors'
import { put, select } from 'redux-saga/effects'
import { feelessUpdateVerificationState } from 'src/identity/actions'
import { FeelessVerificationState, feelessVerificationStateSelector } from 'src/identity/reducer'

const KOMENCI_ERROR_WINDOW = 1000 * 60 * 60 * 3 // 3 hours
const KOMENCI_ERROR_ALLOTMENT = 2

export enum FeelessVerificationErrors {
  KomenciErrorQuotaExceeded = 'KomenciErrorQuotaExceeded',
  KomenciDisabledError = 'KomenciDisabledError',
  KomenciSessionInvalidError = 'KomenciSessionInvalidError',
  PepperNotCachedError = 'PepperNotCachedError',
}

// When Komenci has failed more than allowed within a given window
export class KomenciErrorQuotaExceeded extends RootError<
  FeelessVerificationErrors.KomenciErrorQuotaExceeded
> {
  constructor() {
    super(FeelessVerificationErrors.KomenciErrorQuotaExceeded)
  }
}

// When feature flag is disabled
export class KomenciDisabledError extends RootError<
  FeelessVerificationErrors.KomenciDisabledError
> {
  constructor() {
    super(FeelessVerificationErrors.KomenciDisabledError)
  }
}

// When the Komenci session is no longer valid
export class KomenciSessionInvalidError extends RootError<
  FeelessVerificationErrors.KomenciSessionInvalidError
> {
  constructor() {
    super(FeelessVerificationErrors.KomenciSessionInvalidError)
  }
}

// When the pepper is not in the redux store
export class PepperNotCachedError extends RootError<
  FeelessVerificationErrors.PepperNotCachedError
> {
  constructor() {
    super(FeelessVerificationErrors.PepperNotCachedError)
  }
}

// If a user has already encountered too many errors within a given window,
// do not allow them try verifing using Komenci again
export const hasExceededKomenciErrorQuota = (komenciErrorTimestamps: number[]) => {
  const currentTime = Date.now()
  const recentErrors = komenciErrorTimestamps.filter(
    (timestamp) => currentTime - timestamp < KOMENCI_ERROR_WINDOW
  )

  return recentErrors.length > KOMENCI_ERROR_ALLOTMENT
}

// If the error is unexpected, add it to state. If we encounter more errors than
// allowed within a given window, we won't allow the user to attempt verifciation
// via Komenci until a certain amount of time has passed
export function* storeTimestampIfKomenciError(error: Error, errorOccuredInMainFlow: boolean) {
  const feelessVerificationState: FeelessVerificationState = yield select(
    feelessVerificationStateSelector
  )

  let unexpectedKomenciError = false
  const errorString = error.toString()

  if (
    Object.keys(TxErrorTypes).includes(errorString) ||
    Object.keys(KomenciKitErrorTypes).includes(errorString) ||
    Object.keys(FetchErrorTypes).includes(errorString) ||
    Object.keys(FeelessVerificationErrors).includes(errorString)
  ) {
    unexpectedKomenciError = true
  }

  // These errors should not be considered fatal Komenci errors
  if (
    !unexpectedKomenciError ||
    errorString === FetchErrorTypes.QuotaExceededError ||
    errorString === FeelessVerificationErrors.KomenciSessionInvalidError ||
    errorString === FeelessVerificationErrors.PepperNotCachedError ||
    (errorString === FetchErrorTypes.Unauthorised && !errorOccuredInMainFlow)
  ) {
    return
  }

  const { errorTimestamps } = feelessVerificationState.komenci
  errorTimestamps.push(Date.now())
  yield put(
    feelessUpdateVerificationState({
      ...feelessVerificationState,
      komenci: {
        ...feelessVerificationState.komenci,
        errorTimestamps,
      },
    })
  )
}

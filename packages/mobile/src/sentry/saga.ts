import { spawn, takeEvery } from 'redux-saga/effects'
import { Actions } from 'src/sentry/actions'
import { initializeSentryUserContext } from 'src/sentry/Sentry'

export function* watchLanguage() {
  yield takeEvery(Actions.INITIALIZE_SENTRY_USER_CONTEXT, initializeSentryUserContext)
}

export function* sentrySaga() {
  yield spawn(watchLanguage)
}

import { takeEvery } from 'redux-saga/effects'
import { Actions } from 'src/sentry/actions'
import { initializeSentryUserContext } from 'src/sentry/Sentry'

export function* sentrySaga() {
  yield takeEvery(Actions.INITIALIZE_SENTRY_USER_CONTEXT, initializeSentryUserContext)
}

import { call, take } from 'redux-saga/effects'
import { Actions } from 'src/sentry/actions'
import { initializeSentryUserContext } from 'src/sentry/Sentry'

export function* sentrySaga() {
  yield take(Actions.INITIALIZE_SENTRY_USER_CONTEXT)
  yield call(initializeSentryUserContext)
}

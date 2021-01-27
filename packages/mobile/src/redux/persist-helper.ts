import { REHYDRATE } from 'redux-persist/es/constants'
import { take } from 'redux-saga/effects'

// Re-export for convenience
export { REHYDRATE } from 'redux-persist/es/constants'

let didRehydrate = false

export interface RehydrateAction {
  type: typeof REHYDRATE
  key: string
  payload?: any
}

export function getRehydratePayload(action: RehydrateAction, key: string) {
  return (action && action.payload && action.payload[key]) || {}
}

// Note: Shouldn't be necessary except for in one place in the root saga
export function* waitForRehydrate() {
  if (didRehydrate) {
    return
  }
  yield take(REHYDRATE)
  didRehydrate = true
  return
}

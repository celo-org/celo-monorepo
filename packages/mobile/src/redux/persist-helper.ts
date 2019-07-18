import { REHYDRATE } from 'redux-persist/es/constants'

// Re-export for convenience
export { REHYDRATE } from 'redux-persist/es/constants'

export interface RehydrateAction {
  type: typeof REHYDRATE
  key: string
  payload?: any
}

export function getRehydratePayload(action: RehydrateAction, key: string) {
  return (action && action.payload && action.payload[key]) || {}
}

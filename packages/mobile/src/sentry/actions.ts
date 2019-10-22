export enum Actions {
  INITIALIZE_SENTRY_USER_CONTEXT = 'SENTRY/INITIALIZE_SENTRY_USER_CONTEXT',
}

export interface InitializeSentryUserContext {
  type: Actions.INITIALIZE_SENTRY_USER_CONTEXT
}

export const initializeSentryUserContext = (): InitializeSentryUserContext => ({
  type: Actions.INITIALIZE_SENTRY_USER_CONTEXT,
})

export enum Actions {
  INITIALIZE_SENTRY_USER_CONTEXT = 'SENTRY/INITIALIZESENTRYUSERCONTEXT',
}

export interface InitializeSentryUserContext {
  type: Actions.INITIALIZE_SENTRY_USER_CONTEXT
}

export const initializeSentryUserContext = (): InitializeSentryUserContext => ({
  type: Actions.INITIALIZE_SENTRY_USER_CONTEXT,
})

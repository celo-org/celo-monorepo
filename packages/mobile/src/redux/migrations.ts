export const migrations = {
  0: (state: any) => {
    return {
      ...state,
      invite: {
        ...state.invite,
        redeemComplete: state.app.inviteCodeEntered,
      },
      identity: {
        startedVerification: state.app.numberVerified,
        askedContactsPermission: state.app.numberVerified,
        isLoadingImportContacts: false,
      },
    }
  },
  1: (state: any) => {
    return {
      ...state,
      app: {
        ...state.app,
        language: state.app.language === 'es-AR' ? 'es-419' : state.app.language,
      },
    }
  },
}

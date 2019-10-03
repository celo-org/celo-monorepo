import { PincodeType } from 'src/account/reducer'

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
  2: (state: any) => {
    return {
      ...state,
      account: {
        ...state.account,
        pincodeType: state.account.pincodeSet ? PincodeType.PhoneAuth : PincodeType.Unset,
        pincodeSet: undefined,
      },
    }
  },
  3: (state: any) => {
    return {
      ...state,
      localCurrency: {
        ...state.localCurrency,
        fetchedCurrencyCode: state.localCurrency.symbol || undefined,
        symbol: undefined,
      },
    }
  },
}

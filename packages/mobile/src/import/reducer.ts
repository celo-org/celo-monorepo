import { Actions, ActionTypes } from 'src/import/actions'

export interface State {
  isImportingWallet: boolean
  isWalletEmpty: boolean
}

const initialState = {
  isImportingWallet: false,
  isWalletEmpty: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes) => {
  switch (action.type) {
    case Actions.IMPORT_BACKUP_PHRASE:
      return {
        ...state,
        isImportingWallet: true,
      }
    case Actions.IMPORT_BACKUP_PHRASE_SUCCESS:
    case Actions.IMPORT_BACKUP_PHRASE_FAILURE:
      return {
        ...state,
        isImportingWallet: false,
      }

    case Actions.IMPORT_BACKUP_PHRASE_EMPTY:
      return {
        ...state,
        isImportingWallet: false,
        isWalletEmpty: true,
      }
    case Actions.TRY_ANOTHER_BACKUP_PHRASE: {
      return {
        ...state,
        isWalletEmpty: false,
      }
    }

    default:
      return state
  }
}

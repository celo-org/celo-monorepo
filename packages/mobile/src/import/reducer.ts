import { Actions, ActionTypes } from 'src/import/actions'

export interface State {
  isImportingWallet: boolean
}

const initialState = {
  isImportingWallet: false,
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

    default:
      return state
  }
}

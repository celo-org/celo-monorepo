import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  SET_BALANCE = 'GOLD/SET_BALANCE',
  SET_EDUCATION_COMPLETED = 'GOLD/SET_EDUCATION_COMPLETED',
  FETCH_BALANCE = 'GOLD/FETCH_BALANCE',
  TRANSFER = 'GOLD/TRANSFER',
  DISMISS_CELO_EDUCATION = 'GOLD/DISMISS_CELO_EDUCATION',
}

export interface SetBalanceAction {
  type: Actions.SET_BALANCE
  balance: string
}

export interface SetEducationCompletedAction {
  type: Actions.SET_EDUCATION_COMPLETED
  educationCompleted: boolean
}

export interface FetchBalanceAction {
  type: Actions.FETCH_BALANCE
}

export type TransferAction = {
  type: Actions.TRANSFER
} & TokenTransferAction

export interface DismissCeloEducation {
  type: Actions.DISMISS_CELO_EDUCATION
}

export type ActionTypes =
  | SetBalanceAction
  | SetEducationCompletedAction
  | FetchBalanceAction
  | TransferAction
  | DismissCeloEducation

export const fetchGoldBalance = (): FetchBalanceAction => ({
  type: Actions.FETCH_BALANCE,
})

export const setBalance = (balance: string): SetBalanceAction => ({
  type: Actions.SET_BALANCE,
  balance,
})

export const transferGoldToken = ({
  recipientAddress,
  amount,
  comment,
  context,
}: TokenTransfer): TransferAction => ({
  type: Actions.TRANSFER,
  recipientAddress,
  amount,
  comment,
  context,
})

export const dismissCeloEducation = (): DismissCeloEducation => ({
  type: Actions.DISMISS_CELO_EDUCATION,
})

export const setEducationCompleted = (): SetEducationCompletedAction => ({
  type: Actions.SET_EDUCATION_COMPLETED,
  educationCompleted: true,
})

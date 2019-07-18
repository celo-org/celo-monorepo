import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  SET_BALANCE = 'GOLD/SET_BALANCE',
  SET_EDUCATION_COMPLETED = 'GOLD/SET_EDUCATION_COMPLETED',
  FETCH_BALANCE = 'GOLD/FETCH_BALANCE',
  TRANSFER = 'GOLD/TRANSFER',
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

export type ActionTypes =
  | SetBalanceAction
  | SetEducationCompletedAction
  | FetchBalanceAction
  | TransferAction

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
  txId,
}: TokenTransfer): TransferAction => ({
  type: Actions.TRANSFER,
  recipientAddress,
  amount,
  comment,
  txId,
})

export const setEducationCompleted = (): SetEducationCompletedAction => ({
  type: Actions.SET_EDUCATION_COMPLETED,
  educationCompleted: true,
})

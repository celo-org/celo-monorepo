import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  SET_BALANCE = 'STABLE_TOKEN/SET_BALANCE',
  SET_EDUCATION_COMPLETED = 'STABLE_TOKEN/SET_EDUCATION_COMPLETED',
  FETCH_BALANCE = 'STABLE_TOKEN/FETCH_BALANCE',
  TRANSFER = 'STABLE_TOKEN/TRANSFER',
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

export const fetchDollarBalance = (): FetchBalanceAction => ({
  type: Actions.FETCH_BALANCE,
})

export const setBalance = (balance: string): SetBalanceAction => ({
  type: Actions.SET_BALANCE,
  balance,
})

export const transferStableToken = ({
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

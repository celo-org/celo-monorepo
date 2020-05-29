import { TokenTransactionType } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'

export interface ExchangeStandby {
  id: string
  type: TokenTransactionType.Exchange
  status: TransactionStatus
  inSymbol: CURRENCY_ENUM
  inValue: string
  outSymbol: CURRENCY_ENUM
  outValue: string
  timestamp: number
  hash?: string
}
export interface TransferStandby {
  id: string
  type: TransferTransactionType
  status: TransactionStatus
  value: string
  comment: string
  symbol: CURRENCY_ENUM
  timestamp: number
  address: string
  hash?: string
}

export type StandbyTransaction = ExchangeStandby | TransferStandby

export enum TransactionStatus {
  Pending = 'Pending',
  Complete = 'Complete',
  Failed = 'Failed',
}

type TransferTransactionType =
  | TokenTransactionType.Sent
  | TokenTransactionType.Received
  | TokenTransactionType.EscrowReceived
  | TokenTransactionType.EscrowSent
  | TokenTransactionType.Faucet
  | TokenTransactionType.VerificationReward
  | TokenTransactionType.VerificationFee
  | TokenTransactionType.InviteSent
  | TokenTransactionType.InviteReceived
  | TokenTransactionType.NetworkFee
